import {repairScope,pathWithinRepairScope} from './repair-scopes';

type Env={DB:D1Database;CODE_INTAKE:R2Bucket};
const encoder=new TextEncoder();
const hex=(b:ArrayBuffer)=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const json=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const safePath=/^[a-zA-Z0-9_.@/-]+\.(?:ts|tsx|js|jsx|css|html|json|md|txt)$/;
const forbidden=/(?:^|\/)(?:\.git|node_modules|\.env(?:\.[^/]*)?|\.ssh|secrets?|private-keys?|migrations?)(?:\/|$)/i;

/**
 * Intake used only after an authenticated AI connector selects one repair scope.
 * It permits ordinary application source in that scope, including Account 1 backend
 * broadcast/social code, while Account 4, credentials, migrations and deployment
 * infrastructure remain outside every scope.
 */
export async function acceptScopedRepair(input:any,env:Env,actor:string){
 const account=String(input?.account||''),scope=repairScope(String(input?.repairScope||''),account);
 const name=String(input?.name||'');
 if(input?.schemaVersion!==1||!scope)return json({error:'Choose a valid repair scope for Account 1, 2 or 3.'},400);
 if(name.length<3||name.length>80||!/^[-\w .()/]+$/.test(name))return json({error:'Provide a safe repair title.'},400);
 if(!Array.isArray(input.files)||input.files.length<1||input.files.length>25)return json({error:'Repair must contain 1–25 source files.'},400);
 const seen=new Set<string>();let bytes=0;
 for(const f of input.files){
  const path=String(f?.path||''),content=f?.content;
  if(typeof content!=='string'||path.length>180||!safePath.test(path)||forbidden.test(path)||path.startsWith('/')||path.includes('\\')||path.split('/').some((p:string)=>!p||p==='.'||p==='..'))return json({error:'Unsafe repair file path.'},422);
  if(seen.has(path.toLowerCase()))return json({error:'Duplicate repair file path.'},422);seen.add(path.toLowerCase());
  if(!pathWithinRepairScope(path,scope))return json({error:'Repair contains a file outside '+scope.label+'. Split unrelated work into a separate work order.'},422);
  if(content.length>140000)return json({error:'A repair file exceeds 140 KB.'},413);bytes+=encoder.encode(content).length;
 }
 if(bytes>230000)return json({error:'Repair source exceeds 230 KB.'},413);
 const canonical=encoder.encode(JSON.stringify({schemaVersion:1,account,repairScope:scope.id,name,files:input.files}));
 const sha=hex(await crypto.subtle.digest('SHA-256',canonical)),id=crypto.randomUUID(),key='account4-intake/repairs/'+sha+'.json';
 if(!await env.CODE_INTAKE.head(key))await env.CODE_INTAKE.put(key,canonical,{httpMetadata:{contentType:'application/json'},customMetadata:{sha256:sha,repairScope:scope.id,account}});
 const note='Feature-scoped repair saved in quarantine. Only '+scope.label+' is authorized. Existing API keys, databases, media, CMS data and unrelated features are outside this repair. No code was executed or deployed.';
 await env.DB.batch([
  env.DB.prepare('INSERT INTO account4_packages(id,account_no,name,source,package_kind,sha256,object_key,size_bytes,file_count,status,validation_summary) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,account,name,actor,'source-proposal',sha,key,canonical.length,input.files.length,'quarantined',note),
  env.DB.prepare('INSERT INTO account4_package_events(package_id,event_type,actor,message) VALUES(?,?,?,?)').bind(id,'scoped_repair_received',actor,note)
 ]);
 return json({ok:true,id,status:'quarantined',sha256:sha,repairScope:scope.id,scopeLabel:scope.label,fileCount:input.files.length,note},201);
}
