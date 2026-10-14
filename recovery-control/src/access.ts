/** Verify Access JWT, not a spoofable identity header or ExecutionContext property. */
const dec=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));
export async function accessIdentity(request:Request,env:{ACCESS_TEAM_DOMAIN?:string;ACCESS_POLICY_AUD?:string}):Promise<string|null>{
 const team=(env.ACCESS_TEAM_DOMAIN||'').toLowerCase().replace(/^https:\/\//,'').replace(/\/$/,'');
 const audience=env.ACCESS_POLICY_AUD||'';
 if(!team.endsWith('.cloudflareaccess.com')||!audience)return null;
 const token=request.headers.get('Cf-Access-Jwt-Assertion')||'';
 const bits=token.split('.');if(bits.length!==3)return null;
 try{
  const header=JSON.parse(new TextDecoder().decode(dec(bits[0])));
  const body=JSON.parse(new TextDecoder().decode(dec(bits[1])));
  const now=Math.floor(Date.now()/1000);
  if(header.alg!=='RS256'||!header.kid||body.iss!=='https://'+team||
    !(Array.isArray(body.aud)?body.aud.includes(audience):body.aud===audience)||
    !Number.isInteger(body.exp)||body.exp<=now||
    (body.nbf&&body.nbf>now)||!body.email)return null;
  const response=await fetch('https://'+team+'/cdn-cgi/access/certs',{headers:{Accept:'application/json'}});
  if(!response.ok)return null;
  const keys=await response.json() as {keys?:Array<any>};
  const jwk=keys.keys?.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)return null;
  const publicKey=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const ok=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,dec(bits[2]),new TextEncoder().encode(bits[0]+'.'+bits[1]));
  return ok?String(body.email):null;
 }catch{return null;}
}
