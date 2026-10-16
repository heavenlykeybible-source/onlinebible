import type {VerifyOwner} from "./approval-handler";
interface Statement {bind(...values:unknown[]):Statement;first<T=unknown>():Promise<T|null>;all<T=unknown>():Promise<{results:T[]}>;run():Promise<{meta?:{changes?:number}}>;}
export interface DeploymentDb {prepare(query:string):Statement}
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha=/^[a-f0-9]{64}$/i;
export function createDeploymentRouter(verifyOwner:VerifyOwner){
 return async(req:Request,db:DeploymentDb):Promise<Response>=>{
  const owner=await verifyOwner(req);if(!owner)return reply({error:"forbidden"},403);
  const url=new URL(req.url),path=url.pathname;
  if(req.method==="GET"&&path==="/api/control/deploy/targets"){
   const data=await db.prepare("SELECT id,label,target_kind,cloudflare_project_name,production_url,enabled FROM control_deployment_targets ORDER BY label").all();
   return reply({targets:data.results});
  }
  if(req.method==="GET"&&path==="/api/control/deploy/jobs"){
   const data=await db.prepare("SELECT j.id,j.target_id,t.label,j.source_ref,j.source_sha256,j.status,j.created_at,j.approved_at,j.completed_at,j.error_code FROM control_deployment_jobs j JOIN control_deployment_targets t ON t.id=j.target_id ORDER BY j.created_at DESC LIMIT 100").all();
   return reply({jobs:data.results});
  }
  if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
  if(req.headers.get("Origin")!==url.origin)return reply({error:"invalid_origin"},403);
  if(!req.headers.get("Content-Type")?.startsWith("application/json"))return reply({error:"invalid_content_type"},415);
  const raw=await req.text();if(new TextEncoder().encode(raw).length>4096)return reply({error:"body_too_large"},413);
  let input:unknown;try{input=JSON.parse(raw)}catch{return reply({error:"invalid_body"},400)}
  if(!input||typeof input!=="object"||Array.isArray(input))return reply({error:"invalid_body"},400);
  const b=input as Record<string,unknown>;
  if(path==="/api/control/deploy/jobs"){
   if(typeof b.targetId!=="string"||!uuid.test(b.targetId)||typeof b.sourceRef!=="string"||!/^[a-zA-Z0-9._/-]{1,200}$/.test(b.sourceRef)||typeof b.sha256!=="string"||!sha.test(b.sha256))return reply({error:"invalid_job"},400);
   const target=await db.prepare("SELECT id FROM control_deployment_targets WHERE id=? AND enabled=1").bind(b.targetId).first();
   if(!target)return reply({error:"target_not_enabled"},409);
   const id=crypto.randomUUID();
   await db.prepare("INSERT INTO control_deployment_jobs(id,target_id,source_ref,source_sha256,requested_by) VALUES(?,?,?,?,?)").bind(id,b.targetId,b.sourceRef,b.sha256.toLowerCase(),owner.userId).run();
   return reply({id,status:"pending",note:"No deployment performed"},201);
  }
  const match=path.match(/^\/api\/control\/deploy\/jobs\/([0-9a-f-]{36})\/approve$/i);
  if(match&&uuid.test(match[1])){
   const result=await db.prepare("UPDATE control_deployment_jobs SET status='approved',approved_by=?,approved_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending' AND EXISTS(SELECT 1 FROM control_deployment_targets t WHERE t.id=target_id AND t.enabled=1)").bind(owner.userId,match[1]).run();
   return result.meta?.changes===1?reply({status:"approved",note:"Approved for deployment executor; not yet deployed"}):reply({error:"job_not_pending_or_target_disabled"},409);
  }
  return reply({error:"not_found"},404);
 };
}
