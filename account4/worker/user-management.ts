import type {VerifyOwner} from "./approval-handler";
interface Statement {bind(...args:unknown[]):Statement;first<T=unknown>():Promise<T|null>;all<T=unknown>():Promise<{results:T[]}>;run():Promise<{meta?:{changes?:number}}>};
export interface UserDb {prepare(sql:string):Statement;batch(statements:Statement[]):Promise<unknown>}
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailValid=(v:string)=>v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const hashHex=(bytes:Uint8Array)=>Array.from(bytes,v=>v.toString(16).padStart(2,"0")).join("");
async function hashPassword(password:string,salt:Uint8Array){
 const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
 return hashHex(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:310000},material,256)));
}
export function createUserRouter(verifyOwner:VerifyOwner){
 return async(request:Request,db:UserDb):Promise<Response>=>{
  const owner=await verifyOwner(request);
  if(!owner)return json({error:"forbidden"},403);
  const url=new URL(request.url),path=url.pathname.replace(/\/$/,"");
  if(request.method==="GET"&&path==="/api/control/users"){
   const rows=await db.prepare("SELECT id,email,display_name,role,status,must_change_password,created_at FROM control_users ORDER BY created_at DESC LIMIT 200").all();
   return json({users:rows.results});
  }
  if(request.method!=="POST")return json({error:"method_not_allowed"},405);
  if(request.headers.get("Origin")!==url.origin)return json({error:"invalid_origin"},403);
  if(!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))return json({error:"invalid_content_type"},415);
  if(Number(request.headers.get("Content-Length")||0)>8192)return json({error:"body_too_large"},413);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).length>8192)return json({error:"body_too_large"},413);
  let input:unknown;
  try{input=JSON.parse(raw)}catch{return json({error:"invalid_body"},400)}
  if(!input||typeof input!=="object"||Array.isArray(input))return json({error:"invalid_body"},400);
  const body=input as Record<string,unknown>;
  if(path==="/api/control/users"){
   const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
   const name=typeof body.name==="string"?body.name.trim():"";
   const role=body.role;
   if(!emailValid(email)||!name||name.length>160||!["admin","editor","viewer"].includes(String(role)))return json({error:"invalid_user"},400);
   const id=crypto.randomUUID();
   try{
    await db.batch([
     db.prepare("INSERT INTO control_users(id,email,display_name,role,created_by) VALUES(?,?,?,?,?)").bind(id,email,name,role,owner.userId),
     db.prepare("INSERT INTO control_user_audit(id,actor_id,target_user_id,action) VALUES(?,?,?,?)").bind(crypto.randomUUID(),owner.userId,id,"user.created")
    ]);
    return json({id,email,name,role,status:"active",passwordConfigured:false},201);
   }catch{return json({error:"conflict_or_storage_failure"},409)}
  }
  const match=path.match(/^\/api\/control\/users\/([^/]+)\/(password|disable|enable)$/);
  if(!match||!uuid.test(match[1]))return json({error:"not_found"},404);
  const userId=match[1],action=match[2];
  const target=await db.prepare("SELECT id,role,status FROM control_users WHERE id=?").bind(userId).first<{id:string;role:string;status:string}>();
  if(!target)return json({error:"not_found"},404);
  if(target.role==="owner")return json({error:"owner_protected"},403);
  if(action==="password"){
   const password=body.password;
   if(typeof password!=="string"||password.length<14||new TextEncoder().encode(password).length>256)return json({error:"password_policy"},400);
   const salt=crypto.getRandomValues(new Uint8Array(16));
   const digest=await hashPassword(password,salt);
   await db.batch([
    db.prepare("UPDATE control_users SET password_hash=?,password_salt=?,password_iterations=310000,must_change_password=1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND role<>'owner'").bind(digest,hashHex(salt),userId),
    db.prepare("INSERT INTO control_user_audit(id,actor_id,target_user_id,action) VALUES(?,?,?,?)").bind(crypto.randomUUID(),owner.userId,userId,"user.password_reset")
   ]);
   return json({status:"password_updated",mustChangePassword:true});
  }
  await db.batch([
   db.prepare("UPDATE control_users SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND role<>'owner'").bind(action==="disable"?"disabled":"active",userId),
   db.prepare("INSERT INTO control_user_audit(id,actor_id,target_user_id,action) VALUES(?,?,?,?)").bind(crypto.randomUUID(),owner.userId,userId,action==="disable"?"user.disabled":"user.enabled")
  ]);
  return json({status:action==="disable"?"disabled":"active"});
 };
}
