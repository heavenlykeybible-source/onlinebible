/** Account 4 owner-only email password recovery.
 * No reset token or plaintext password is stored in source code, logs, or GitHub.
 * Requires Cloudflare Email Service sending binding RESET_EMAIL and a verified sender domain.
 */
type ResetEnv = {
  DB:D1Database;
  RECOVERY_STATE:KVNamespace;
  GITHUB_CONTROL_TOKEN:string;
  RESET_EMAIL?:{send(message:{to:string;from:string;subject:string;text:string}):Promise<{messageId:string}>};
  RESET_EMAIL_FROM?:string;
};
const ADMIN_EMAIL='emmanuel2026miracle@gmail.com';
const TOKEN_KEY='hkem-control-password-reset-v1';
const PASSWORD_KEY='hkem-control-password-v2';
const encoder=new TextEncoder();
const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'};
const style='<style>*{box-sizing:border-box}body{min-height:100dvh;margin:0;padding:16px;display:grid;place-items:center;background:linear-gradient(145deg,#102d6e,#421a51);color:#21314b;font:16px/1.5 system-ui}main{background:#fff;padding:26px;width:min(100%,430px);border-radius:16px;box-shadow:0 18px 70px #060f2e66}h1{font-size:24px}p,small{color:#52627d}label{display:block;font-weight:700;margin:16px 0 5px}input{width:100%;padding:12px;border:1px solid #adbbcf;border-radius:8px;font:inherit}button{width:100%;background:#204b9d;color:white;border:0;border-radius:9px;font:inherit;font-weight:700;padding:13px;margin-top:20px;cursor:pointer}a{color:#204b9d}</style>';
function page(title:string,body:string,status=200){
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+title+' | Account 4</title>'+style+'</head><body><main><small>HEAVENLY KEY — ACCOUNT 4</small><h1>'+title+'</h1>'+body+'<p><a href="/">Return to administrator login</a></p></main></body></html>',{status,headers});
}
function message(title:string,text:string,status=200){return page(title,'<p>'+text+'</p>',status);}
function originOk(req:Request){return req.headers.get('Origin')===new URL(req.url).origin;}
async function sha256(text:string){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text)));return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
function equal(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
function hex(bytes:Uint8Array){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function hashPassword(password:string,secret:string){
  if(!secret)throw Error('Account 4 password signing secret is unavailable');
  const salt=hex(crypto.getRandomValues(new Uint8Array(16)));
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const digest=hex(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode('hkem-account4-password-v3:'+salt+':'+password))));
  return 'hmac-v3$'+salt+'$'+digest;
}
export function forgotPage(){return page('Reset your password','<p>A private password-reset link will be emailed to the approved Account 4 administrator. It expires in 15 minutes and can be used once.</p><form method="POST" action="/forgot-password"><button type="submit">Send password reset email</button></form><p><small>Only the registered administrator email receives a link.</small></p>');}
export function resetPage(req:Request){
  const token=new URL(req.url).searchParams.get('token')||'';
  if(!/^[0-9a-f]{64}$/.test(token))return message('Invalid reset link','This reset link is invalid. Request a new one.',400);
  return page('Choose new password','<form method="POST" action="/reset-password"><input type="hidden" name="token" value="'+token+'"><label for="password">New password (16+ characters)</label><input type="password" id="password" name="password" required minlength="16" maxlength="128" autocomplete="new-password"><label for="confirm">Confirm new password</label><input type="password" id="confirm" name="confirm" required minlength="16" maxlength="128" autocomplete="new-password"><button type="submit">Save new password</button></form><p><small>Use uppercase and lowercase letters and a number. The link works only once.</small></p>');
}
export async function sendReset(req:Request,env:ResetEnv){
  if(!originOk(req))return message('Request blocked','Please use the password-recovery page on Account 4.',403);
  if(!env.RESET_EMAIL||!env.RESET_EMAIL_FROM)return message('Email setup needed','Email password recovery is not configured in Cloudflare Account 4 yet. Ask the account owner to enable Email Service, verify the administrator recipient and configure the sender.',503);
  try {
    const addr=req.headers.get('CF-Connecting-IP')||'unknown';
    const ipKey='account4-reset-ip:'+await sha256(addr);
    const attempts=Number(await env.RECOVERY_STATE.get(ipKey)||0);
    if(attempts>=3)return message('Too many requests','Please try again later.',429);
    await env.RECOVERY_STATE.put(ipKey,String(attempts+1),{expirationTtl:3600});
    const now=Math.floor(Date.now()/1000);
    const previous=await env.DB.prepare('SELECT value FROM account4_security_state WHERE key=?').bind(TOKEN_KEY).first<{value:string}>();
    if(previous){
      try{const data=JSON.parse(previous.value);if(data.requestedAt&&now-data.requestedAt<120)return message('Check your email','If email delivery is available, a reset link was recently sent. Check the approved administrator inbox and Spam folder.');}catch{}
    }
    const token=hex(crypto.getRandomValues(new Uint8Array(32)));
    const record=JSON.stringify({digest:await sha256(token),requestedAt:now,expiresAt:now+900});
    await env.DB.prepare('INSERT INTO account4_security_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP').bind(TOKEN_KEY,record).run();
    const link=new URL('/reset-password',req.url);link.searchParams.set('token',token);
    try{
      await env.RESET_EMAIL.send({to:ADMIN_EMAIL,from:env.RESET_EMAIL_FROM,subject:'Account 4 password reset — Heavenly Key',text:'An Account 4 administrator password reset was requested. Open this one-time link within 15 minutes:\n\n'+link.toString()+'\n\nIf you did not request this, ignore the message. Never forward a reset link.'});
    }catch(err){
      await env.DB.prepare('DELETE FROM account4_security_state WHERE key=? AND value=?').bind(TOKEN_KEY,record).run();
      console.error('Account 4 reset delivery failed:',err instanceof Error?err.message:'Cloudflare email delivery error');
      return message('Email could not be sent','Email delivery is not available. Check the verified sender and recipient in Cloudflare Email Service.',503);
    }
    return message('Check your email','If email delivery is available, a password reset link was sent to the registered administrator inbox. Check Spam if you do not see it.');
  }catch(err){
    console.error('Account 4 reset request failed:',err instanceof Error?err.message:'Backend error');
    return message('Recovery temporarily unavailable','Account 4 could not process the request. Check the Worker and D1 database connection.',503);
  }
}
export async function completeReset(req:Request,env:ResetEnv){
  if(!originOk(req))return message('Request blocked','Please open the reset link on Account 4.',403);
  try{
    const body=await req.formData();
    const token=body.get('token'),password=body.get('password'),confirmation=body.get('confirm');
    if(typeof token!=='string'||!/^[0-9a-f]{64}$/.test(token))return message('Invalid reset link','The reset link is invalid or expired.',400);
    if(typeof password!=='string'||password.length<16||password.length>128||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password))return message('Invalid new password','Use 16 or more characters, with uppercase and lowercase letters and a number.',400);
    if(password!==confirmation)return message('Passwords do not match','Open your reset link and enter matching passwords.',400);
    const saved=await env.DB.prepare('SELECT value FROM account4_security_state WHERE key=?').bind(TOKEN_KEY).first<{value:string}>();
    if(!saved)return message('Reset link expired','Request a new reset link.',400);
    let info:{digest:string;expiresAt:number};
    try{info=JSON.parse(saved.value);}catch{return message('Reset link expired','Request a new reset link.',400);}
    if(!info||info.expiresAt<Math.floor(Date.now()/1000)||!equal(info.digest,await sha256(token)))return message('Reset link expired','Request a new reset link.',400);
    const newHash=await hashPassword(password,env.GITHUB_CONTROL_TOKEN);
    const claimed=await env.DB.prepare('DELETE FROM account4_security_state WHERE key=? AND value=?').bind(TOKEN_KEY,saved.value).run();
    if(claimed.meta.changes!==1)return message('Link already used','Request a new password reset link.',409);
    await env.DB.prepare('INSERT INTO account4_security_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP').bind(PASSWORD_KEY,newHash).run();
    return message('Password changed','Your Account 4 password has been updated. You can now sign in with the new password.');
  }catch(err){
    console.error('Account 4 reset completion failed:',err instanceof Error?err.message:'Backend error');
    return message('Reset unavailable','The account could not process this reset. Request a new link or check the database connection.',503);
  }
}
