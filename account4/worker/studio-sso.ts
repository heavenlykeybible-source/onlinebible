/** Single-use Control Room -> Studio login bridge.
 * Requires the Studio Worker to call redeem on the same protected D1 database.
 * Studio must create its own Secure HttpOnly session after successful redemption.
 */
import type {VerifyOwner} from "./approval-handler";
interface Stmt { bind(...values:unknown[]):Stmt; run():Promise<{meta?:{changes?:number}}>; first<T=unknown>():Promise<T|null>; }
interface DB {prepare(sql:string):Stmt}
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const hex=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,"0")).join("");
const validTicket=(v:string)=>/^[0-9a-f]{64}$/.test(v);
export function createStudioSso(verifyOwner:VerifyOwner){
 return async(request:Request,env:{DB:DB;STUDIO_ORIGIN?:string;STUDIO_REDEEM_SECRET?:string}):Promise<Response>=>{
  if(request.method!=="POST")return json({error:"method_not_allowed"},405);
  const url=new URL(request.url);
  const isLaunch=url.pathname==="/api/control/studio/launch";
  const isRedeem=url.pathname==="/api/control/studio/redeem";
  if(!isLaunch&&!isRedeem)return json({error:"not_found"},404);
  if(!env.STUDIO_ORIGIN)return json({error:"studio_not_configured"},503);
  let studio:URL;
  try{studio=new URL(env.STUDIO_ORIGIN)}catch{return json({error:"studio_not_configured"},503)}
  if(studio.protocol!=="https:"||studio.pathname!=="/"||studio.search||studio.hash||studio.username||studio.password)return json({error:"studio_not_configured"},503);
  if(isLaunch){
   if(request.headers.get("Origin")!==url.origin)return json({error:"invalid_origin"},403);
   const owner=await verifyOwner(request);
   if(!owner)return json({error:"forbidden"},403);
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v=>v.toString(16).padStart(2,"0")).join("");
   const expiresAt=Math.floor(Date.now()/1000)+60;
   await env.DB.prepare("INSERT INTO control_studio_tickets(ticket_hash,owner_user_id,expires_at) VALUES(?,?,?)").bind(await hex(token),owner.userId,expiresAt).run();
   // Do not put the ticket in a URL (history, logs, referer).
   return json({studioOrigin:studio.origin,ticket:token,expiresInSeconds:60});
  }
  if(!env.STUDIO_REDEEM_SECRET||request.headers.get("Authorization")!==`Bearer ${env.STUDIO_REDEEM_SECRET}`)return json({error:"forbidden"},403);
  if(!request.headers.get("Content-Type")?.startsWith("application/json"))return json({error:"invalid_content_type"},415);
  if(Number(request.headers.get("Content-Length")||0)>1024)return json({error:"body_too_large"},413);
  const raw=await request.text();
  if(raw.length>1024)return json({error:"body_too_large"},413);
  let value:unknown;
  try{value=JSON.parse(raw)}catch{return json({error:"invalid_body"},400)}
  if(!value||typeof value!=="object"||Array.isArray(value))return json({error:"invalid_body"},400);
  const ticket=(value as Record<string,unknown>).ticket;
  if(typeof ticket!=="string"||!validTicket(ticket))return json({error:"invalid_ticket"},400);
  const digest=await hex(ticket);
  // Atomic compare-and-swap prevents replay across concurrent requests.
  const now=Math.floor(Date.now()/1000);
  const redeemed=await env.DB.prepare("UPDATE control_studio_tickets SET consumed_at=? WHERE ticket_hash=? AND consumed_at IS NULL AND expires_at>? RETURNING owner_user_id").bind(now,digest,now).first<{owner_user_id:string}>();
  if(!redeemed)return json({error:"expired_or_consumed"},403);
  return json({status:"redeemed",userId:redeemed.owner_user_id,role:"owner"});
 };
}
