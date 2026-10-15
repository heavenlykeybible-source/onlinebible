import {SITES,planDeployment} from "./deployment-engine";
interface Env {DB:D1Database; MEDIA:R2Bucket; AI:Ai; ASSETS:Fetcher; ACCESS_TEAM_DOMAIN:string; ACCESS_AUD:string}
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const fail=(message:string,status=400)=>json({error:message},status);
const allowedKinds=new Set(["menu","footer","page","image","section","settings"]);
function b64url(s:string){const p=s.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(p+"=".repeat((4-p.length%4)%4)),c=>c.charCodeAt(0))}
async function authenticate(request:Request,env:Env):Promise<string|null>{
 const token=request.headers.get("Cf-Access-Jwt-Assertion");if(!token||!env.ACCESS_AUD||!env.ACCESS_TEAM_DOMAIN||env.ACCESS_AUD.startsWith("REPLACE_"))return null;
 const parts=token.split(".");if(parts.length!==3)return null;
 try{
 const header=JSON.parse(new TextDecoder().decode(b64url(parts[0]))),claims=JSON.parse(new TextDecoder().decode(b64url(parts[1])));
 if(header.alg!=="RS256"||!header.kid||!Array.isArray(claims.aud)||!claims.aud.includes(env.ACCESS_AUD)||claims.exp<=Date.now()/1000||(typeof claims.nbf==="number"&&claims.nbf>Date.now()/1000))return null;
 const domain=env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//,"").replace(/\/$/,"");
 if(!/^[a-z0-9.-]+\.cloudflareaccess\.com$/i.test(domain)||claims.iss!=="https://"+domain)return null;
 const jwks=await fetch("https://"+domain+"/cdn-cgi/access/certs");if(!jwks.ok)return null;
 const keys=(await jwks.json() as {keys:JsonWebKey[]}).keys;const key=keys.find(k=>(k as JsonWebKey & {kid?:string}).kid===header.kid);if(!key)return null;
 const cryptoKey=await crypto.subtle.importKey("jwk",key,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
 if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",cryptoKey,b64url(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1])))return null;
 return String(claims.email||claims.sub||"unknown");
 }catch{return null}
}
function keyOf(u:URL){const site=u.searchParams.get("site")||"account1",kind=u.searchParams.get("kind")||"page",key=u.searchParams.get("key")||"home";if(!/^account[1-6]$/.test(site)||!allowedKinds.has(kind)||!(/^[a-zA-Z0-9_/-]{1,100}$/.test(key)))throw Error("Invalid CMS location");return {site,kind,key}}
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const u=new URL(request.url);if(!u.pathname.startsWith("/api/"))return env.ASSETS.fetch(request);
 const actor=await authenticate(request,env);if(!actor)return fail("Cloudflare Access administrator authentication required",401);
 try{
 if(u.pathname==="/api/me")return json({actor,role:"administrator"});
 if(u.pathname==="/api/system/health"&&request.method==="GET"){let cms="unavailable";try{await env.DB.prepare("SELECT 1 FROM cms_entries LIMIT 1").first();cms="ready"}catch{}return json({cms,ai:env.AI?"binding_present":"binding_missing",media:env.MEDIA?"binding_present":"binding_missing",deployment:"disabled",note:"AI binding presence does not guarantee successful inference. CMS drafts are not published to other websites."})}
 if(u.pathname==="/api/deploy/sites"&&request.method==="GET")return json({sites:SITES,executionEnabled:false});
 if(u.pathname==="/api/deploy/plan"&&request.method==="POST"){if(Number(request.headers.get("content-length")||0)>4096)return fail("Request too large",413);const raw=await request.text();if(raw.length>4096)return fail("Request too large",413);try{return json({plan:planDeployment(JSON.parse(raw))})}catch(e){return fail(e instanceof Error?e.message:"Invalid request",400)}}
 if(u.pathname==="/api/entry"&&request.method==="GET"){const {site,kind,key}=keyOf(u);const entry=await env.DB.prepare("SELECT content,version,updated_at FROM cms_entries WHERE site=? AND kind=? AND entry_key=?").bind(site,kind,key).first();return json({entry:entry||null})}
 if(u.pathname==="/api/revisions"&&request.method==="GET"){const {site,kind,key}=keyOf(u);return json({items:(await env.DB.prepare("SELECT id,version,editor,created_at FROM cms_revisions WHERE site=? AND kind=? AND entry_key=? ORDER BY id DESC LIMIT 30").bind(site,kind,key).all()).results})}
 if(u.pathname==="/api/save"&&request.method==="POST"){
 const {site,kind,key}=keyOf(u);const body=await request.json() as {content:unknown;expectedVersion:number};
 const content=JSON.stringify(body.content);if(!content||content.length>200000||!Number.isInteger(body.expectedVersion)||body.expectedVersion<0)return fail("Invalid content or revision");
 const old=await env.DB.prepare("SELECT version FROM cms_entries WHERE site=? AND kind=? AND entry_key=?").bind(site,kind,key).first<{version:number}>();
 if((old?.version||0)!==body.expectedVersion)return fail("Version conflict: reload before editing",409);
 const version=(old?.version||0)+1;
 const batch=await env.DB.batch([
 env.DB.prepare("INSERT INTO cms_entries(site,kind,entry_key,content,version) VALUES(?,?,?,?,?) ON CONFLICT(site,kind,entry_key) DO UPDATE SET content=excluded.content,version=excluded.version,updated_at=CURRENT_TIMESTAMP WHERE cms_entries.version=?").bind(site,kind,key,content,version,body.expectedVersion),
 env.DB.prepare("INSERT INTO cms_revisions(site,kind,entry_key,version,content,editor) VALUES(?,?,?,?,?,?)").bind(site,kind,key,version,content,actor),
 env.DB.prepare("INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)").bind(actor,"save",site+"/"+kind+"/"+key)
 ]);if(!batch[0].meta.changes)return fail("Concurrent edit; reload",409);return json({ok:true,version});
 }
 if(u.pathname==="/api/restore"&&request.method==="POST"){const {site,kind,key}=keyOf(u);const body=await request.json() as {revisionId:number;expectedVersion:number};if(!Number.isInteger(body.revisionId)||body.revisionId<1||!Number.isInteger(body.expectedVersion)||body.expectedVersion<1)return fail("Invalid revision");
 const previous=await env.DB.prepare("SELECT content FROM cms_revisions WHERE id=? AND site=? AND kind=? AND entry_key=?").bind(body.revisionId,site,kind,key).first<{content:string}>();if(!previous)return fail("Revision not found",404);
 const old=await env.DB.prepare("SELECT version FROM cms_entries WHERE site=? AND kind=? AND entry_key=?").bind(site,kind,key).first<{version:number}>();if(old?.version!==body.expectedVersion)return fail("Version conflict",409);
 const version=body.expectedVersion+1;const result=await env.DB.prepare("UPDATE cms_entries SET content=?,version=?,updated_at=CURRENT_TIMESTAMP WHERE site=? AND kind=? AND entry_key=? AND version=?").bind(previous.content,version,site,kind,key,body.expectedVersion).run();if(!result.meta.changes)return fail("Version conflict",409);
 await env.DB.batch([env.DB.prepare("INSERT INTO cms_revisions(site,kind,entry_key,version,content,editor) VALUES(?,?,?,?,?,?)").bind(site,kind,key,version,previous.content,actor),env.DB.prepare("INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)").bind(actor,"restore",site+"/"+kind+"/"+key)]);return json({ok:true,version});
 }
 if(u.pathname==="/api/media"&&request.method==="POST"){const type=request.headers.get("content-type")||"";if(!/^image\/(png|jpeg|webp|gif)$/.test(type))return fail("Only PNG/JPEG/WebP/GIF images allowed");const bytes=await request.arrayBuffer();if(bytes.byteLength>5_000_000||!bytes.byteLength)return fail("Image exceeds 5 MB");const id=crypto.randomUUID(),path="cms/"+id;await env.MEDIA.put(path,bytes,{httpMetadata:{contentType:type}});await env.DB.prepare("INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)").bind(actor,"upload",path).run();return json({path})}
 if(u.pathname.startsWith("/api/media/")&&request.method==="GET"){const path=u.pathname.slice(5);if(!/^media\/cms\/[0-9a-f-]{36}$/.test(path))return fail("Invalid media path");const obj=await env.MEDIA.get(path.replace(/^media\//,""));if(!obj)return fail("Image not found",404);return new Response(obj.body,{headers:{"content-type":obj.httpMetadata?.contentType||"application/octet-stream","cache-control":"private, max-age=60"}})}
 if(u.pathname==="/api/ai"&&request.method==="POST"){const {prompt}=await request.json() as {prompt:string};if(typeof prompt!=="string"||!prompt.trim()||prompt.length>2000)return fail("Prompt too long");const output=await env.AI.run("@cf/meta/llama-3.1-8b-instruct" as any,{messages:[{role:"system",content:"You assist a Christian ministry CMS administrator. Return suggestions only; never claim changes were published."},{role:"user",content:prompt}]});return json({suggestion:output,requiresApproval:true})}
 return fail("Route not found",404)
 }catch(e){return fail(e instanceof Error?e.message:"Unexpected error",500)}
}} satisfies ExportedHandler<Env>;
