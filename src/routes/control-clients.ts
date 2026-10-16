/**
 * Account 4 client registry API (mount under /api/control/clients).
 * Requires a verified owner session; never accepts caller-supplied owner IDs.
 * Intentionally does not expose Cloudflare credentials or deployment capabilities.
 */
import { requireMinimumRole } from "../middleware/rbac";
import type { Env } from "../services/auth-service";

const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
 "X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'"}});
const slugify=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
const hostnameValid=(s:string)=>/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(s);
const jsonBody=async(request:Request):Promise<Record<string,unknown>|null>=>{
 if(!request.headers.get("content-type")?.toLowerCase().includes("application/json"))return null;
 const length=Number(request.headers.get("content-length")||0);
 if(length>8192)return null;
 const value:unknown=await request.json().catch(()=>null);
 return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:null;
};
export async function handleClientAccounts(request:Request,env:Env):Promise<Response>{
 const actor=await requireMinimumRole(request,env,"Owner");
 if(!actor)return reply({error:"forbidden"},403);
 const userId=actor.userId;
 const path=new URL(request.url).pathname.replace(/\/$/,"");
 if(path==="/api/control/clients"&&request.method==="GET"){
  const rows=await env.DB.prepare("SELECT id,display_name,slug,status,created_at FROM control_clients ORDER BY created_at DESC LIMIT 100").all();
  return reply({clients:rows.results});
 }
 if(path==="/api/control/clients"&&request.method==="POST"){
  const body=await jsonBody(request);
  const name=typeof body?.name==="string"?body.name.trim():"";
  if(name.length<1||name.length>160)return reply({error:"invalid_client_name"},400);
  const slug=slugify(name);
  if(!slug)return reply({error:"invalid_slug"},400);
  const id=crypto.randomUUID();
  try{
   await env.DB.prepare("INSERT INTO control_clients (id,display_name,slug,created_by) VALUES (?,?,?,?)").bind(id,name,slug,String(userId)).run();
   return reply({id,name,slug,status:"active"},201);
  }catch{return reply({error:"client_name_conflict_or_storage_error"},409);}
 }
 const match=path.match(/^\/api\/control\/clients\/([0-9a-f-]{36})\/sites$/i);
 if(match&&request.method==="GET"){
  const client=await env.DB.prepare("SELECT id FROM control_clients WHERE id=?").bind(match[1]).first();
  if(!client)return reply({error:"not_found"},404);
  const rows=await env.DB.prepare("SELECT id,name,hostname,status,created_at FROM control_client_sites WHERE client_id=? ORDER BY created_at DESC LIMIT 100").bind(match[1]).all();
  return reply({sites:rows.results});
 }
 if(match&&request.method==="POST"){
  const body=await jsonBody(request);
  const name=typeof body?.name==="string"?body.name.trim():"";
  const hostname=typeof body?.hostname==="string"?body.hostname.trim().toLowerCase():"";
  if(name.length<1||name.length>160||!hostnameValid(hostname))return reply({error:"invalid_site"},400);
  const client=await env.DB.prepare("SELECT id FROM control_clients WHERE id=? AND status='active'").bind(match[1]).first();
  if(!client)return reply({error:"not_found"},404);
  const id=crypto.randomUUID();
  try{
   await env.DB.prepare("INSERT INTO control_client_sites (id,client_id,name,hostname) VALUES (?,?,?,?)").bind(id,match[1],name,hostname).run();
   return reply({id,name,hostname,status:"draft"},201);
  }catch{return reply({error:"site_conflict_or_storage_error"},409);}
 }
 return reply({error:"not_found"},404);
}
