import type {RegistryDb} from "./release-approval";
import type {VerifyOwner} from "./approval-handler";
type QueryDb=RegistryDb & {prepare(sql:string):ReturnType<RegistryDb["prepare"]> & {all<T=unknown>():Promise<{results:T[]}>}};
const respond=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const host=/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
async function body(request:Request){
 if(!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))return null;
 const raw=await request.text();
 if(raw.length>8192)return null;
 try{const value:unknown=JSON.parse(raw);return value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:null}catch{return null}
}
export function createClientRegistryRouter(verifyOwner:VerifyOwner){
 return async(request:Request,db:QueryDb):Promise<Response>=>{
  const owner=await verifyOwner(request);
  if(!owner)return respond({error:"forbidden"},403);
  if(request.method!=="GET"&&request.method!=="POST")return respond({error:"method_not_allowed"},405);
  if(request.method==="POST"&&request.headers.get("Origin")!==new URL(request.url).origin)return respond({error:"invalid_origin"},403);
  const path=new URL(request.url).pathname.replace(/\/$/,"");
  if(path==="/api/control/clients"){
   if(request.method==="GET"){
    const rows=await db.prepare("SELECT id,display_name,slug,status,created_at FROM control_clients ORDER BY created_at DESC LIMIT 100").all();
    return respond({clients:rows.results});
   }
   const data=await body(request),name=typeof data?.name==="string"?data.name.trim():"";
   if(!name||name.length>160)return respond({error:"invalid_client_name"},400);
   const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
   if(!slug)return respond({error:"invalid_slug"},400);
   const id=crypto.randomUUID();
   try{await db.prepare("INSERT INTO control_clients(id,display_name,slug,created_by) VALUES(?,?,?,?)").bind(id,name,slug,owner.userId).run();
    return respond({id,name,slug,status:"active"},201);
   }catch{return respond({error:"conflict_or_storage_failure"},409)}
  }
  const match=path.match(/^\/api\/control\/clients\/([^/]+)\/sites$/);
  if(!match||!uuid.test(match[1]))return respond({error:"not_found"},404);
  const clientId=match[1];
  if(request.method==="GET"){
   const client=await db.prepare("SELECT id FROM control_clients WHERE id=?").bind(clientId).first();
   if(!client)return respond({error:"not_found"},404);
   const rows=await db.prepare("SELECT id,name,hostname,status,created_at FROM control_client_sites WHERE client_id=? ORDER BY created_at DESC LIMIT 100").bind(clientId).all();
   return respond({sites:rows.results});
  }
  const data=await body(request),name=typeof data?.name==="string"?data.name.trim():"";
  const hostname=typeof data?.hostname==="string"?data.hostname.trim().toLowerCase():"";
  if(!name||name.length>160||!host.test(hostname))return respond({error:"invalid_site"},400);
  const client=await db.prepare("SELECT id FROM control_clients WHERE id=? AND status='active'").bind(clientId).first();
  if(!client)return respond({error:"not_found"},404);
  const id=crypto.randomUUID();
  try{await db.prepare("INSERT INTO control_client_sites(id,client_id,name,hostname) VALUES(?,?,?,?)").bind(id,clientId,name,hostname).run();
   return respond({id,name,hostname,status:"draft"},201);
  }catch{return respond({error:"conflict_or_storage_failure"},409)}
 };
}
