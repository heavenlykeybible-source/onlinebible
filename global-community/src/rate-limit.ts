import type {Env} from './types';

// Fixed expiry: retrying must never extend a member's wait indefinitely.
// KV is eventually consistent, so this is a best-effort abuse control.
export async function rate(env:Env,key:string,max:number,seconds:number){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
  const k='rate:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const now=Date.now();
  const raw=await env.SESSIONS.get(k);
  let state:{n:number;expiresAt:number}|null=null;
  try{state=raw?JSON.parse(raw):null;}catch{}
  if(!state||!Number.isSafeInteger(state.n)||state.n<0||!Number.isFinite(state.expiresAt)||state.expiresAt<=now)state={n:0,expiresAt:now+seconds*1000};
  if(state.n>=max)return false;
  state.n++;
  await env.SESSIONS.put(k,JSON.stringify(state),{expirationTtl:Math.max(60,Math.ceil((state.expiresAt-now)/1000))});
  return true;
}
