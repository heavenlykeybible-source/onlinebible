/** Studio-side SSO session bridge. Mount on the ACTUAL Studio Worker only.
 * A ticket is redeemed server-to-server; no password or ticket is stored in the URL.
 * Session HMAC key and redemption secret are Cloudflare secrets, never source values.
 */
export interface StudioEnv {
 CONTROL_REDEEM_URL:string;
 STUDIO_REDEEM_SECRET:string;
 STUDIO_SESSION_SECRET:string;
}
const respond=(data:unknown,status=200,headers:Record<string,string>={})=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...headers}});
const base64url=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
const enc=(value:string)=>new TextEncoder().encode(value);
const sign=async(secret:string,data:string)=>{
 const key=await crypto.subtle.importKey("raw",enc(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return base64url(new Uint8Array(await crypto.subtle.sign("HMAC",key,enc(data))));
};
export async function handleStudioExchange(request:Request,env:StudioEnv):Promise<Response>{
 if(request.method!=="POST")return respond({error:"method_not_allowed"},405);
 if(request.headers.get("Origin")!==new URL(request.url).origin)return respond({error:"invalid_origin"},403);
 if(!env.CONTROL_REDEEM_URL||!env.STUDIO_REDEEM_SECRET||!env.STUDIO_SESSION_SECRET||env.STUDIO_SESSION_SECRET.length<32)return respond({error:"not_configured"},503);
 let redeemUrl:URL;
 try{redeemUrl=new URL(env.CONTROL_REDEEM_URL)}catch{return respond({error:"not_configured"},503)}
 if(redeemUrl.protocol!=="https:"||redeemUrl.pathname!=="/api/control/studio/redeem"||redeemUrl.username||redeemUrl.password||redeemUrl.search||redeemUrl.hash)return respond({error:"not_configured"},503);
 if(!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))return respond({error:"invalid_content_type"},415);
 if(Number(request.headers.get("Content-Length")||0)>1024)return respond({error:"body_too_large"},413);
 const raw=await request.text();
 if(raw.length>1024)return respond({error:"body_too_large"},413);
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return respond({error:"invalid_body"},400)}
 const ticket=body&&typeof body==="object"&&!Array.isArray(body)?(body as Record<string,unknown>).ticket:null;
 if(typeof ticket!=="string"||!/^[a-f0-9]{64}$/.test(ticket))return respond({error:"invalid_ticket"},400);
 let response:Response;
 try{response=await fetch(redeemUrl.toString(),{method:"POST",headers:{"Authorization":`Bearer ${env.STUDIO_REDEEM_SECRET}`,"Content-Type":"application/json"},body:JSON.stringify({ticket}),redirect:"error",signal:AbortSignal.timeout(5000)})}
 catch{return respond({error:"identity_unavailable"},503)}
 if(!response.ok)return respond({error:"ticket_rejected"},403);
 const identity:unknown=await response.json().catch(()=>null);
 if(!identity||typeof identity!=="object")return respond({error:"invalid_identity"},403);
 const v=identity as Record<string,unknown>;
 if(v.status!=="redeemed"||v.role!=="owner"||typeof v.userId!=="string"||!/^[0-9a-f-]{36}$/i.test(v.userId))return respond({error:"invalid_identity"},403);
 const now=Math.floor(Date.now()/1000);
 const payload=base64url(enc(JSON.stringify({sub:v.userId,role:"owner",iat:now,exp:now+3600,iss:"heavenlykey-studio"})));
 const signature=await sign(env.STUDIO_SESSION_SECRET,payload);
 return respond({status:"signed_in"},200,{"Set-Cookie":`hk_studio_session=${payload}.${signature}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`});
}
export async function verifyStudioSession(request:Request,secret:string):Promise<{userId:string;role:"owner"}|null>{
 if(!secret||secret.length<32)return null;
 const value=request.headers.get("Cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith("hk_studio_session="))?.slice("hk_studio_session=".length);
 if(!value)return null;
 const [payload,signature,...extra]=value.split(".");
 if(!payload||!signature||extra.length||!/^[-_A-Za-z0-9]+$/.test(payload))return null;
 const expected=await sign(secret,payload);
 if(signature.length!==expected.length)return null;
 let diff=0;for(let i=0;i<signature.length;i++)diff|=signature.charCodeAt(i)^expected.charCodeAt(i);
 if(diff!==0)return null;
 try{
  const text=atob(payload.replace(/-/g,"+").replace(/_/g,"/"));
  const v=JSON.parse(text) as Record<string,unknown>;
  const now=Math.floor(Date.now()/1000);
  if(v.iss!=="heavenlykey-studio"||v.role!=="owner"||typeof v.sub!=="string"||typeof v.exp!=="number"||v.exp<=now||v.exp>now+3600)return null;
  return {userId:v.sub,role:"owner"};
 }catch{return null}
}
