/** The explicit owner alias uses the owner's normal Control Room credentials.
 * Existing members retain their existing authentication. No roles or passwords
 * are created, copied or changed in the website database. */
export async function centralOwnerLogin(env:{DB:D1Database},password:string,upstream:typeof fetch=fetch):Promise<number|null>{
 if(typeof password!=='string'||password.length<14||password.length>200)return null;
 const records=await env.DB.prepare("SELECT u.user_id FROM users u JOIN roles r ON r.role_id=u.role_id WHERE r.role_name='Super Administrator' AND u.status='active' ORDER BY u.user_id LIMIT 2").all<{user_id:number}>();
 if(records.results.length!==1)return null;
 const origin='https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev';
 try{
  const response=await upstream(origin+'/api/owner/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'owner',password}),redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)return null;
  const data=await response.json() as {ok?:boolean};
  const cookie=response.headers.get('set-cookie')?.split(';')[0];
  if(data.ok!==true||!cookie||!/^__Host-hkem-owner=[a-f0-9]{64}$/.test(cookie))return null;
  const checked=await upstream(origin+'/api/me',{headers:{Cookie:cookie},redirect:'error',signal:AbortSignal.timeout(10000)});
  const identity=await checked.json() as {actor?:string;role?:string};
  try{await upstream(origin+'/api/owner/logout',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:'{}',redirect:'error',signal:AbortSignal.timeout(5000)})}catch{}
  if(!checked.ok||identity.role!=='administrator'||!identity.actor)return null;
  return records.results[0].user_id;
 }catch{return null}
}
