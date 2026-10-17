/* Account 2 session adapter. Administration stays in this account; identity stays in Account 4. */
export type StudioEnv={LIVE_STATUS_KV:KVNamespace;MEDIA_ENGINE_SHARED_SECRET:string};
type Actor={id:string;email:string;name:string;role:'owner'|'administrator'};
type Session={proof:string;actor:Actor;expires:number};
const CONTROL='https://control.heavenlykey.org',BROKER='https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev',STUDIO='https://studio.heavenlykey.org';
const enc=new TextEncoder(),hex=(v:ArrayBuffer)=>Array.from(new Uint8Array(v),n=>n.toString(16).padStart(2,'0')).join(''),random=()=>hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
const sha=async(v:string)=>hex(await crypto.subtle.digest('SHA-256',enc.encode(v)));
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
function value(req:Request,name:string){return(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||''}
function cookie(name:string,v:string,age:number){return `${name}=${v}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`}
const redirect=(to:string,headers:HeadersInit={})=>new Response(null,{status:302,headers:{...headers,location:to,'cache-control':'no-store','referrer-policy':'no-referrer'}});
async function central(path:string,data:unknown,request:typeof fetch){const r=await request(BROKER+'/api/security/'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data),redirect:'error'});if(!r.ok)throw Error('Central sign-in could not be verified.');return r.json() as Promise<any>}
async function actor(req:Request,env:StudioEnv,request:typeof fetch){const token=value(req,'__Host-hk-studio');if(!/^[a-f0-9]{64}$/.test(token))return null;const raw=await env.LIVE_STATUS_KV.get('studio-access:'+await sha(token));if(!raw)return null;try{const session=JSON.parse(raw) as Session;if(session.expires<=Date.now()/1000)return null;const result=await central('introspect',{proof:session.proof,audience:'studio'},request);if(result.audience!=='studio'||result.identity?.id!==session.actor.id||!['owner','administrator'].includes(result.identity.role))return null;return {session,user:result.identity as Actor}}catch{return null}}
async function capability(user:Actor,secret:string){if(!secret||secret.length<32)throw Error('Studio backend connection is not configured.');const now=Math.floor(Date.now()/1000),payload=btoa(JSON.stringify({sub:user.id,role:user.role==='owner'?'Super Administrator':'Deputy Super Administrator',iat:now,exp:now+60,nonce:random()}));const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return payload+'.'+hex(await crypto.subtle.sign('HMAC',key,enc.encode(payload)))}
export async function studioAccess(req:Request,env:StudioEnv,engine:(req:Request)=>Promise<Response>,ui:()=>Response,request:typeof fetch=fetch):Promise<Response|null>{
 const u=new URL(req.url),path=u.pathname;
 if(!['studio.heavenlykey.org','heavenlykey-media.faithofourfatherstv.workers.dev'].includes(u.hostname))return null;
 const page=path==='/'||path==='/studio'||/^\/pages\/admin(?:\.html)?$/.test(path),api=path.startsWith('/studio/api/');
 if(path==='/api/auth/control-start'&&req.method==='GET'){
  const state=random(),verifier=random(),flow={state,verifier,created:Date.now()},link=new URL('/security',CONTROL);link.searchParams.set('state',state);link.searchParams.set('challenge',await sha(verifier));link.searchParams.set('audience','studio');
  return redirect(link.href,{'set-cookie':cookie('__Host-hk-studio-flow',encodeURIComponent(JSON.stringify(flow)),600)});
 }
 if(path==='/api/auth/control-callback'&&req.method==='GET'){
  try{const flow=JSON.parse(decodeURIComponent(value(req,'__Host-hk-studio-flow')));if(!/^[a-f0-9]{64}$/.test(flow.state)||flow.state!==u.searchParams.get('state')||!Number.isFinite(flow.created)||flow.created>Date.now()||Date.now()-flow.created>600000||!['https://control.heavenlykey.org',BROKER].includes(u.searchParams.get('issuer')||''))return json({error:'This Studio sign-in expired. Open Studio again.'},401);
   const grant=await central('exchange',{code:u.searchParams.get('code'),verifier:flow.verifier,audience:'studio'},request);if(grant.audience!=='studio'||!['owner','administrator'].includes(grant.identity?.role)||!/^[a-f0-9]{64}$/.test(grant.proof||''))return json({error:'Owner or administrator access is required.'},403);
   const token=random(),now=Math.floor(Date.now()/1000);const user:Actor={id:grant.identity.id,email:grant.identity.email,name:grant.identity.name,role:grant.identity.role};await env.LIVE_STATUS_KV.put('studio-access:'+await sha(token),JSON.stringify({proof:grant.proof,actor:user,expires:now+3500}),{expirationTtl:3600});
   const headers=new Headers({location:STUDIO+'/','cache-control':'no-store','referrer-policy':'no-referrer'});headers.append('set-cookie',cookie('__Host-hk-studio',token,3500));headers.append('set-cookie',cookie('__Host-hk-studio-flow','',0));return new Response(null,{status:302,headers});
  }catch{return json({error:'Studio sign-in could not be completed. Return to the Control Room and open Studio again.'},401)}
 }
 if(!page&&!api)return null;
 if(!['GET','HEAD'].includes(req.method)&&req.headers.get('Origin')!==u.origin)return json({error:'Use the Studio page to make changes.'},403);
 const access=await actor(req,env,request);
 if(!access)return page?redirect('/api/auth/control-start'):json({error:'Sign in to continue.',signIn:'/api/auth/control-start'},401);
 if(page&&['GET','HEAD'].includes(req.method))return ui();
 if(path==='/studio/api/me'&&req.method==='GET')return json({user:access.user});
 if(path==='/studio/api/logout'&&req.method==='POST'){await env.LIVE_STATUS_KV.delete('studio-access:'+await sha(value(req,'__Host-hk-studio')));return new Response('{"ok":true}',{headers:{'content-type':'application/json','cache-control':'no-store','set-cookie':cookie('__Host-hk-studio','',0)}})}
 if(api){const internal=new URL(req.url);internal.pathname='/api/'+path.slice('/studio/api/'.length);const headers=new Headers(req.headers);headers.delete('cookie');headers.delete('authorization');headers.delete('x-heavenly-key-internal');headers.set('X-Heavenly-Key-Internal','media-engine-v1');try{headers.set('Authorization','Bearer '+await capability(access.user,env.MEDIA_ENGINE_SHARED_SECRET));const r=await engine(new Request(internal,new Request(req,{headers})));const out=new Headers(r.headers);out.set('cache-control','no-store');out.delete('set-cookie');return new Response(r.body,{status:r.status,headers:out})}catch{return json({error:'Studio backend connection is unavailable.'},503)}}
 return json({error:'Studio route not found.'},404);
}
