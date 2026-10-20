import {planConnectionChoice,validateConnection,type ConnectionRecord} from "../connector/multi-connection-registry.ts";

/** Owner-authenticated connection directory. Metadata only: no secrets, no arbitrary URLs. */
interface DirectoryEnv { DB:D1Database }
const send=(value:unknown,status=200)=>Response.json(value,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
const fail=(error:string,status=400)=>send({error},status);
const validSite=(value:string|null)=>!!value&&/^account(?:[1-3]|[5-6])$/.test(value);
const take=(row:Record<string,unknown>):ConnectionRecord=>validateConnection({
 id:row.id, site:row.site,provider:row.provider,label:row.label,
 accountRef:row.account_ref,resourceRef:row.resource_ref,
 allowedRoles:JSON.parse(String(row.allowed_roles)),enabled:row.enabled===1,verified:row.verified===1
});
/** Must be called only AFTER existing Control Room administrator authentication.
 * Endpoint is read-only, including plan; neither token nor provider accounts can be added by an agent.
 */
export async function handleConnectionDirectory(request:Request,env:DirectoryEnv):Promise<Response>{
 const u=new URL(request.url);
 if (!u.pathname.startsWith("/api/connections/")) return fail("Not found",404);
 if (request.method!=="GET" && request.method!=="POST") return fail("Method not allowed",405);
 if (u.pathname==="/api/connections/list"&&request.method==="GET"){
  const site=u.searchParams.get("site");
  if(site!==null&&!validSite(site))return fail("Invalid website");
  const rows=await env.DB.prepare("SELECT id,site,provider,label,account_ref,resource_ref,allowed_roles,enabled,verified FROM cms_provider_connections WHERE (? IS NULL OR site=?) ORDER BY site,label LIMIT 200").bind(site,site).all();
  return send({connections:(rows.results as Record<string,unknown>[]).map(take).map(x=>({...x,accountRef:x.accountRef,resourceRef:x.resourceRef})),executionEnabled:false});
 }
 if (u.pathname==="/api/connections/plan"&&request.method==="POST"){
  if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))return fail("JSON required",415);
  const body=await request.text();
  if(body.length>2000)return fail("Request too large",413);
  let choice:unknown;
  try {choice=JSON.parse(body)}catch{return fail("Invalid JSON")}
  const rows=await env.DB.prepare("SELECT id,site,provider,label,account_ref,resource_ref,allowed_roles,enabled,verified FROM cms_provider_connections ORDER BY id LIMIT 200").all();
  try{return send({plan:planConnectionChoice(choice,(rows.results as Record<string,unknown>[]).map(take))})}
  catch(error){return fail(error instanceof Error?error.message:"Invalid connection")}
 }
 return fail("Not found",404);
}
