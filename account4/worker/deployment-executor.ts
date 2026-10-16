/** Deployment executor: an approved immutable R2 artifact is sent to its exact
 * registered Cloudflare Worker destination. No arbitrary URLs or user tokens.
 * Bindings, routes, secrets and other Workers configuration are intentionally
 * not overwritten by this minimal module upload.
 */
interface Statement {bind(...values:unknown[]):Statement;first<T=unknown>():Promise<T|null>;run():Promise<{meta?:{changes?:number}}>;}
interface Db {prepare(sql:string):Statement}
interface R2Object {arrayBuffer():Promise<ArrayBuffer>}
interface Bucket {get(key:string):Promise<R2Object|null>}
export interface ExecutorEnv {DB:Db;DEPLOY_ARTIFACTS?:Bucket;CLOUDFLARE_DEPLOY_TOKEN?:string;DEPLOY_EXECUTOR_SECRET?:string}
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const sha256=async(buffer:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buffer)),v=>v.toString(16).padStart(2,"0")).join("");
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
interface Job {id:string;target_id:string;source_ref:string;source_sha256:string;cloudflare_account_id:string;cloudflare_project_name:string;target_kind:string;enabled:number}
export async function executeApprovedDeployment(req:Request,env:ExecutorEnv):Promise<Response>{
 if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
 if(!env.DEPLOY_EXECUTOR_SECRET||!env.CLOUDFLARE_DEPLOY_TOKEN||!env.DEPLOY_ARTIFACTS)return reply({error:"executor_not_configured"},503);
 const auth=req.headers.get("Authorization");
 if(auth!==`Bearer ${env.DEPLOY_EXECUTOR_SECRET}`)return reply({error:"unauthorized"},401);
 const path=new URL(req.url).pathname;
 const id=path.match(/^\/api\/internal\/deploy\/([0-9a-f-]{36})\/execute$/i)?.[1];
 if(!id||!uuid.test(id))return reply({error:"not_found"},404);
 const job=await env.DB.prepare("SELECT j.id,j.target_id,j.source_ref,j.source_sha256,t.cloudflare_account_id,t.cloudflare_project_name,t.target_kind,t.enabled FROM control_deployment_jobs j JOIN control_deployment_targets t ON t.id=j.target_id WHERE j.id=? AND j.status='approved'").bind(id).first<Job>();
 if(!job||job.enabled!==1)return reply({error:"job_not_approved"},409);
 // Only immutable artifact keys. R2 object must match the recorded digest.
 if(!/^releases\/[a-zA-Z0-9/_-]{1,170}\.mjs$/.test(job.source_ref))return reply({error:"invalid_artifact_ref"},409);
 if(job.target_kind!=="worker")return reply({error:"unsupported_target_kind"},409);
 if(!/^[a-f0-9]{32}$/i.test(job.cloudflare_account_id)||!/^[a-z0-9_-]{1,63}$/i.test(job.cloudflare_project_name))return reply({error:"invalid_destination"},409);
 const object=await env.DEPLOY_ARTIFACTS.get(job.source_ref);
 if(!object)return reply({error:"artifact_missing"},404);
 const bytes=await object.arrayBuffer();
 if(bytes.byteLength>5_000_000||await sha256(bytes)!==job.source_sha256.toLowerCase())return reply({error:"artifact_integrity_failed"},409);
 const claim=await env.DB.prepare("UPDATE control_deployment_jobs SET status='deploying' WHERE id=? AND status='approved' AND target_id=?").bind(id,job.target_id).run();
 if(claim.meta?.changes!==1)return reply({error:"already_claimed"},409);
 try{
  const api=`https://api.cloudflare.com/client/v4/accounts/${job.cloudflare_account_id}/workers/scripts/${encodeURIComponent(job.cloudflare_project_name)}`;
  const form=new FormData();
  form.append("metadata",new Blob([JSON.stringify({main_module:"index.mjs",compatibility_date:"2026-10-01"})],{type:"application/json"}));
  form.append("index.mjs",new Blob([bytes],{type:"application/javascript"}),"index.mjs");
  const result=await fetch(api,{method:"PUT",headers:{"Authorization":`Bearer ${env.CLOUDFLARE_DEPLOY_TOKEN}`},body:form,redirect:"error",signal:AbortSignal.timeout(30000)});
  if(!result.ok)throw Error("cloudflare_upload_failed");
  const payload=await result.json() as {success?:boolean};
  if(payload.success!==true)throw Error("cloudflare_rejected");
  await env.DB.prepare("UPDATE control_deployment_jobs SET status='succeeded',completed_at=CURRENT_TIMESTAMP,error_code=NULL WHERE id=? AND status='deploying'").bind(id).run();
  return reply({status:"succeeded",jobId:id});
 }catch(e){
  const code=e instanceof Error&&e.message==="cloudflare_rejected"?"cloudflare_rejected":"upload_failed";
  await env.DB.prepare("UPDATE control_deployment_jobs SET status='failed',completed_at=CURRENT_TIMESTAMP,error_code=? WHERE id=? AND status='deploying'").bind(code,id).run();
  return reply({status:"failed",error:code},502);
 }
}
