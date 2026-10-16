import {hashPassword as managedHash,equal as managedEqual} from "../../shared-security/identity";
/** Normal Account 4 administrator login. Independent of Cloudflare Access.
 * Uses high-entropy password provisioned as a Worker secret, HttpOnly signed sessions
 * and KV-backed rate limiting. No credentials appear in the repository or HTML. */
type ControlEnv={
 DB:D1Database;
 GITHUB_CONTROL_TOKEN:string;
 CONTROL_PASSWORD_HASH?:string;
 RECOVERY_STATE:KVNamespace;
};
const S=new TextEncoder();
const settings={
 cookie:'hk_control_session',
 lifetime:8*60*60,
 attempts:5,
 lockSeconds:15*60
};
const responseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
async function sha256(text:string){
 const raw=await crypto.subtle.digest('SHA-256',S.encode(text));
 return [...new Uint8Array(raw)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function constantTime(a:string,b:string){
 let diff=a.length^b.length;
 for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);
 return diff===0;
}
async function sign(key:string,data:string){
 const k=await crypto.subtle.importKey('raw',S.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const raw=await crypto.subtle.sign('HMAC',k,S.encode(data));
 return [...new Uint8Array(raw)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function json(v:unknown,status=200,other:Record<string,string>={}){
 return new Response(JSON.stringify(v),{status,headers:{...responseHeaders,'Content-Type':'application/json',...other}});
}
function cookieValue(req:Request){
 const cookie=req.headers.get('cookie')||'';
 const row=cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith(settings.cookie+'='));
 try{return row?decodeURIComponent(row.slice(settings.cookie.length+1)):'';}catch{return '';}
}
export function sameOrigin(req:Request){
 const origin=req.headers.get('Origin');
 return origin===new URL(req.url).origin;
}
/** Only for a browser's native username/password form: some legitimate mobile
 * browsers omit Origin on same-site form POSTs. Fetch metadata or a verified
 * same-origin Referrer is still required; never trust a missing Origin alone.
 * Other Account 4 APIs retain the strict Origin requirement. */
export function sameOriginLogin(req:Request,nativeForm:boolean){
 if(sameOrigin(req))return true;
 if(!nativeForm||req.headers.has('Origin'))return false;
 const fetchSite=(req.headers.get('Sec-Fetch-Site')||'').toLowerCase();
 if(fetchSite==='cross-site'||fetchSite==='same-site')return false;
 if(fetchSite==='same-origin')return true;
 const referer=req.headers.get('Referer');
 if(!referer)return false;
 try{return new URL(referer).origin===new URL(req.url).origin;}
 catch{return false;}
}
const recordKey='hkem-control-password-v2';
async function passwordRecord(env:ControlEnv):Promise<string>{
 const row=await env.DB.prepare('SELECT value FROM account4_security_state WHERE key=?').bind(recordKey).first<{value:string}>();
 return row?.value||env.CONTROL_PASSWORD_HASH||'';
}
async function derivePassword(password:string,salt:Uint8Array){
 const base=await crypto.subtle.importKey('raw',S.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:160000,salt},base,256);
 return [...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function authenticated(req:Request,env:ControlEnv):Promise<boolean>{
 if(!env.GITHUB_CONTROL_TOKEN)return false;
 const record=await passwordRecord(env);if(!record)return false;
 const parts=cookieValue(req).split('~');
 if(parts.length!==2||!/^[0-9]{10}:[0-9a-f-]{36}$/.test(parts[0])||!/^[0-9a-f]{64}$/.test(parts[1]))return false;
 const end=Number(parts[0].split(':')[0]);
 if(end<Math.floor(Date.now()/1000)||end>Math.floor(Date.now()/1000)+settings.lifetime)return false;
 const correct=await sign(env.GITHUB_CONTROL_TOKEN,'hkem-account4-cookie-v2:'+parts[0]+':'+record);
 return constantTime(parts[1],correct);
}
const loginPage=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Administrator Login — Heavenly Key Update Centre</title><style>
body{margin:0;min-height:100dvh;background:linear-gradient(145deg,#102d6e,#421a51);color:#21314b;font:16px/1.5 system-ui;display:grid;place-items:center;padding:20px;box-sizing:border-box}
main{background:#fff;padding:30px;width:min(100%,410px);border-radius:17px;box-shadow:0 18px 70px #060f2e66;box-sizing:border-box}
h1{font-size:24px;margin:8px 0}p{color:#667186;font-size:14px;margin-bottom:24px}
label{display:block;font-weight:650;margin:15px 0 5px}
input{box-sizing:border-box;width:100%;padding:13px;border:1px solid #b6c1d5;border-radius:9px;font:inherit}
button{width:100%;background:#204b9d;color:white;border:0;border-radius:9px;font:inherit;font-weight:700;padding:13px;margin-top:24px;cursor:pointer}
#msg{min-height:22px;color:#9d253c;font-size:14px}
.password-wrap{display:flex;position:relative;align-items:center}
.password-wrap input{padding-right:84px}
#show-password{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:auto;margin:0;padding:8px 10px;background:#f0f3f9;color:#17346d;border:1px solid #d4ddec;border-radius:7px;font-size:13px;font-weight:700;line-height:1.3}
#show-password:focus-visible{outline:3px solid #557acc;outline-offset:2px}
</style></head><body><main><div style="font-size:12px;color:#925824;font-weight:750">HEAVENLY KEY · ACCOUNT 4</div><h1>Website Update Centre</h1><p>Administrator sign-in. Cloudflare Access is optional; it is not required to use this dashboard.</p><form id="login" method="post" action="/api/login" autocomplete="on"><label for="username">Username</label><input id="username" name="username" autocomplete="username" value="admin" required><label for="password">Password</label><div class="password-wrap"><input id="password" name="password" type="password" autocomplete="current-password" required><button type="button" id="show-password" aria-label="Show password" aria-controls="password" aria-pressed="false">Show</button></div><button type="submit">Sign in</button></form><p style="text-align:center;margin:18px 0 3px"><a href="/forgot-password" style="color:#204b9d;font-weight:700;text-decoration:underline">Forgot your password? Reset by email</a></p><div id="msg" role="alert"></div><p style="margin:8px 0 0">Your browser may offer to save this login securely after signing in. Avoid saving on a shared device.</p></main><script>
const pass=document.querySelector('#password'),toggle=document.querySelector('#show-password');
toggle.addEventListener('click',()=>{
 const visible=pass.type==='password';
 pass.type=visible?'text':'password';
 toggle.textContent=visible?'Hide':'Show';
 toggle.setAttribute('aria-label',visible?'Hide password':'Show password');
 toggle.setAttribute('aria-pressed',String(visible));
 pass.focus();
});
// Use a native same-origin POST so Safari, iCloud Keychain and other browser password managers can recognize a successful sign-in.\n</script></body></html>`;
export async function verifyOwnerPassword(password:unknown,env:ControlEnv):Promise<boolean>{
 try{const managed=await env.DB.prepare("SELECT password_hash,salt FROM security_users WHERE role='owner' AND status='active' AND password_hash IS NOT NULL LIMIT 1").first<{password_hash:string;salt:string}>();if(managed)return typeof password==='string'&&password.length<=200&&managedEqual(await managedHash(password,managed.salt),managed.password_hash);}catch(e){if(!/no such table/i.test(String(e)))return false;}

 if(typeof password!=='string'||password.length<12||password.length>256)return false;
 const record=await passwordRecord(env);if(!record)return false;
 if(record.startsWith('hmac-v3$')){
  const parts=record.split('$');
  if(parts.length!==3||!/^[a-f0-9]{32}$/.test(parts[1])||!/^[a-f0-9]{64}$/.test(parts[2])||!env.GITHUB_CONTROL_TOKEN)return false;
  return constantTime(await sign(env.GITHUB_CONTROL_TOKEN,'hkem-account4-password-v3:'+parts[1]+':'+password),parts[2]);
 }
 if(record.startsWith('pbkdf2$')){
  const [version,iteration,salt,stored]=record.split('$');
  if(version!=='pbkdf2'||iteration!=='160000'||!/^([a-f0-9]{32})$/.test(salt||'')||!/^([a-f0-9]{64})$/.test(stored||''))return false;
  const saltBytes=new Uint8Array(salt.match(/.{2}/g)!.map(x=>parseInt(x,16)));
  try{return constantTime(await derivePassword(password,saltBytes),stored);}catch{return false;}
 }
 return constantTime(await sha256(password),record);
}
export function renderLogin(message='',status=200){
 const text=message?loginPage.replace('<div id="msg" role="alert"></div>','<div id="msg" role="alert">'+message+'</div>'):loginPage;
 return new Response(text,{status,headers:{...responseHeaders,'Referrer-Policy':'same-origin','Content-Type':'text/html;charset=utf-8','X-Robots-Tag':'noindex, nofollow'}});
}
export async function login(req:Request,env:ControlEnv){
 const nativeForm=(req.headers.get('content-type')||'').startsWith('application/x-www-form-urlencoded');
 const fail=(message:string,status:number)=>nativeForm?renderLogin(message,status):json({error:message},status);
 if(!sameOriginLogin(req,nativeForm))return fail('Invalid login origin. Open the Account 4 sign-in page and try again.',403);
 if(!await passwordRecord(env)||!env.GITHUB_CONTROL_TOKEN)
  return fail('Administrator password is not configured. Use the private Account 4 login artifact from GitHub Actions.',503);
 const ip=req.headers.get('CF-Connecting-IP')||'unknown';
 const key='hkem-login-fail:'+await sha256(ip);
 const count=Number(await env.RECOVERY_STATE.get(key)||0);
 if(count>=settings.attempts)return fail('Too many attempts. Try again in 15 minutes.',429);
 let username='',password='';
 try{
  if(nativeForm){
   const form=await req.formData();
   username=String(form.get('username')||'');
   password=String(form.get('password')||'');
  }else{
   const input=await req.json() as {username?:unknown;password?:unknown};
   username=typeof input.username==='string'?input.username:'';
   password=typeof input.password==='string'?input.password:'';
  }
 }catch{return fail('Invalid login details',400);}
 if(username!=='admin'||!await verifyOwnerPassword(password,env)){
  await env.RECOVERY_STATE.put(key,String(count+1),{expirationTtl:settings.lockSeconds});
  return fail('Incorrect username or password.',401);
 }
 await env.RECOVERY_STATE.delete(key);
 const expires=Math.floor(Date.now()/1000)+settings.lifetime;
 const body=expires+':'+crypto.randomUUID(),sig=await sign(env.GITHUB_CONTROL_TOKEN,'hkem-account4-cookie-v2:'+body+':'+await passwordRecord(env));
 const cookie=settings.cookie+'='+encodeURIComponent(body+'~'+sig)+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age='+settings.lifetime;
 return nativeForm?new Response(null,{status:303,headers:{...responseHeaders,Location:'/', 'Set-Cookie':cookie}}):json({ok:true},200,{'Set-Cookie':cookie});
}

export async function changePassword(req:Request,env:ControlEnv){
 if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);
 let details:any;
 try{details=await req.json();}catch{return json({error:'Invalid JSON'},400);}
 const old=details?.currentPassword,newPwd=details?.newPassword;
 if(typeof newPwd!=='string'||newPwd.length<16||newPwd.length>128||
   !/[a-z]/.test(newPwd)||!/[A-Z]/.test(newPwd)||!/[0-9]/.test(newPwd))
   return json({error:'Use at least 16 characters including uppercase, lowercase and numbers.'},400);
 if(newPwd===old)return json({error:'New password must differ from the previous password.'},400);
 if(!await verifyOwnerPassword(old,env))return json({error:'Current Account 4 password is incorrect.'},403);
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const saltHex=[...salt].map(x=>x.toString(16).padStart(2,'0')).join('');
 const record='hmac-v3$'+saltHex+'$'+await sign(env.GITHUB_CONTROL_TOKEN,'hkem-account4-password-v3:'+saltHex+':'+newPwd);
 await env.DB.prepare('INSERT INTO account4_security_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP').bind(recordKey,record).run();
 return json({ok:true,message:'Password changed. Previous sessions invalidated; sign in again.'},200,{'Set-Cookie':settings.cookie+'=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'});
}
export function logout(){
 return json({ok:true},200,{'Set-Cookie':settings.cookie+'=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'});
}
