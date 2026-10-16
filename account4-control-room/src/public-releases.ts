import {passwordTools} from "../../shared-security/page.ts";
import {RELEASE_TARGETS,releaseTarget,publicPath,protectedRoute,targetsFor,type ReleaseTarget} from './release-targets.ts';
type Env={DB:D1Database;MEDIA:R2Bucket;RELEASE_INGEST_TOKEN?:string};
type Asset={sha256:string;size:number;type:string};
type Manifest=Record<string,Asset>;
type Release={id:string;target:ReleaseTarget;title:string;source:string;source_sha:string;revision:number;arrived_at:string;ready:number;manifest:string;edits:string;theme:string;approved_at:string|null;approved_by:string|null};
const encoder=new TextEncoder(),err=(message:string,status=400)=>Object.assign(Error(message),{status});
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
export const digest=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource)),b=>b.toString(16).padStart(2,'0')).join('');
export async function ingestAuthorized(request:Request,env:Env){
 if(!env.RELEASE_INGEST_TOKEN||env.RELEASE_INGEST_TOKEN.length<32)return false;
 const expected=await digest(encoder.encode(env.RELEASE_INGEST_TOKEN)),actual=await digest(encoder.encode((request.headers.get('Authorization')||'').replace(/^Bearer /,'')));
 let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^actual.charCodeAt(i);return diff===0;
}
async function readJson(request:Request,max=2_000_000){const bytes=await limitedBytes(request,max);try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw err('Invalid update JSON.')}}
async function limitedBytes(request:Request,max:number){
 if(Number(request.headers.get('content-length')||0)>max)throw err('Update file is too large.',413);
 const reader=request.body?.getReader();if(!reader)throw err('No update was sent.');const parts:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw err('Update file is too large.',413)}parts.push(value)}const result=new Uint8Array(size);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.length}return result;
}
function manifestOf(value:unknown,target:ReleaseTarget):Manifest{
 if(!value||typeof value!=='object'||Array.isArray(value))throw err('A complete website file manifest is required.');const manifest=value as Manifest;
 if(!Object.hasOwn(manifest,RELEASE_TARGETS[target].entry)||Object.keys(manifest).length>6000)throw err('The update must include its starting page and at most 6,000 assets.');let size=0;
 for(const [path,asset] of Object.entries(manifest)){publicPath(path);if(protectedRoute(path)||!asset||!/^[a-f0-9]{64}$/.test(asset.sha256)||!Number.isSafeInteger(asset.size)||asset.size<0||asset.size>25_000_000||!/^[-\w.+]+\/[-\w.+]+$/.test(asset.type)||!/\.(?:html?|css|m?js|json|webmanifest|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|txt|xml|mp3|mp4|ogg|wav|pdf)$/i.test(path))throw err('The manifest contains a protected or invalid file.');size+=asset.size}
 if(size>250_000_000)throw err('The complete update exceeds 250 MB.',413);return manifest;
}
async function release(db:D1Database,id:string){if(!/^[a-f0-9-]{36}$/.test(id))throw err('Unknown update.',404);const row=await db.prepare('SELECT * FROM cms_releases WHERE id=?').bind(id).first<Release>();if(!row)throw err('Update not found.',404);return row}
export async function listReleases(db:D1Database){return {targets:RELEASE_TARGETS,items:(await db.prepare(`SELECT r.id,r.target,r.title,r.source,r.source_sha,r.revision,r.arrived_at,r.ready,r.approved_at,r.approved_by,
 a.release_id AS active_id,c.working,c.checked_at FROM cms_releases r LEFT JOIN cms_active_releases a ON a.target=r.target
 LEFT JOIN cms_release_checks c ON c.release_id=r.id AND c.revision=r.revision ORDER BY r.arrived_at DESC LIMIT 250`).all()).results}}
export async function intakeRoute(request:Request,env:Env,actor:string){
 const u=new URL(request.url);
 if(u.pathname==='/api/releases/ingest'&&request.method==='POST'){
  const data=await readJson(request),target=releaseTarget(data.target),manifest=manifestOf(data.manifest,target);
  if(typeof data.title!=='string'||data.title.length<3||data.title.length>160||!/^[-a-zA-Z0-9/_.]{1,100}$/.test(data.source||'')||!/^[a-f0-9]{40,64}$/.test(data.sourceSha||''))throw err('Include a title, source and immutable source hash.');
  const previous=await env.DB.prepare('SELECT * FROM cms_releases WHERE target=? AND source_sha=?').bind(target,data.sourceSha).first<Release>();
  if(previous){if(previous.manifest!==JSON.stringify(manifest))throw err('This source hash already has different files.',409);return json({id:previous.id,revision:previous.revision,ready:!!previous.ready})}
  const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO cms_releases(id,target,title,source,source_sha,arrived_at,manifest) VALUES(?,?,?,?,?,?,?)').bind(id,target,data.title,data.source,data.sourceSha,new Date().toISOString(),JSON.stringify(manifest)).run();return json({id,revision:1,status:'new_update'},201);
 }
 const match=u.pathname.match(/^\/api\/releases\/([a-f0-9-]{36})\/(asset|ready)$/);if(!match)return null;
 const row=await release(env.DB,match[1]);if(row.ready||row.approved_at)throw err('This file snapshot is sealed. Send a new update.',409);
 const manifest:Manifest=JSON.parse(row.manifest);
 if(match[2]==='asset'&&request.method==='PUT'){
  const path=publicPath(u.searchParams.get('path')||''),expected=manifest[path];if(!expected)throw err('File is not listed in this update.');
  const bytes=await limitedBytes(request,25_000_000);if(bytes.length!==expected.size||await digest(bytes)!==expected.sha256)throw err('File checksum does not match the submitted update.',422);
  await env.MEDIA.put('releases/blobs/'+expected.sha256,bytes,{httpMetadata:{contentType:expected.type},customMetadata:{sha256:expected.sha256}});await env.DB.prepare('INSERT INTO cms_release_uploads(release_id,sha256,size) VALUES(?,?,?) ON CONFLICT(release_id,sha256) DO NOTHING').bind(row.id,expected.sha256,bytes.length).run();return json({ok:true});
 }
 if(match[2]==='ready'&&request.method==='POST'){
  const received=await env.DB.prepare('SELECT sha256,size FROM cms_release_uploads WHERE release_id=?').bind(row.id).all<{sha256:string;size:number}>(),verified=new Map(received.results.map(item=>[item.sha256,item.size]));
  for(const asset of Object.values(manifest))if(verified.get(asset.sha256)!==asset.size)throw err('Some update files have not arrived yet.',409);
  await env.DB.batch([env.DB.prepare('UPDATE cms_releases SET ready=1 WHERE id=? AND ready=0').bind(row.id),env.DB.prepare('INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)').bind(actor,'release-arrived',row.id)]);return json({ok:true,status:'new_update',previewReady:true});
 }return null;
}
async function previewToken(env:Env,id:string,revision:number,expires:number){
 if(!env.RELEASE_INGEST_TOKEN)throw err('Release preview signing is not configured.',503);
 const key=await crypto.subtle.importKey('raw',encoder.encode(env.RELEASE_INGEST_TOKEN),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(`preview:${id}:${revision}:${expires}`))),b=>b.toString(16).padStart(2,'0')).join('');
}
function themeOf(value:any){const result:Record<string,string>={};for(const key of Object.keys(value||{})){if(!['background','text','accent'].includes(key)||!/^#[a-fA-F0-9]{6}$/.test(value[key]))throw err('Choose valid theme colours.');result[key]=value[key]}return result}
export async function adminReleaseRoute(request:Request,env:Env,actor:string){
 const u=new URL(request.url);if(u.pathname==='/api/releases'&&request.method==='GET')return json(await listReleases(env.DB));
 const upload=u.pathname.match(/^\/api\/releases\/([a-f0-9-]{36})\/picture$/);
 if(upload&&request.method==='PUT'){
  const row=await release(env.DB,upload[1]);if(row.approved_at||Number(u.searchParams.get('revision'))!==row.revision)throw err('The update changed. Reopen it before uploading.',409);
  const bytes=await limitedBytes(request,8_000_000),type=request.headers.get('content-type')||'';
  const sig=Array.from(bytes.slice(0,12)),valid=type==='image/png'?sig.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':type==='image/jpeg'?sig[0]===255&&sig[1]===216&&sig[2]===255:type==='image/gif'?new TextDecoder().decode(bytes.slice(0,6)).match(/^GIF8[79]a$/):type==='image/webp'?new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP':false;
  if(!valid)throw err('Choose a PNG, JPEG, GIF or WebP picture.');
  const sha=await digest(bytes),extension=type.split('/')[1],path='/cms-pictures/'+sha+'.'+extension,edits=JSON.parse(row.edits);await env.MEDIA.put('releases/blobs/'+sha,bytes,{httpMetadata:{contentType:type},customMetadata:{sha256:sha}});edits[path]={sha256:sha,size:bytes.length,type};
  const result=await env.DB.prepare('UPDATE cms_releases SET edits=?,revision=revision+1 WHERE id=? AND revision=? AND approved_at IS NULL').bind(JSON.stringify(edits),row.id,row.revision).run();if(!result.meta.changes)throw err('The update changed. Reopen it.',409);return json({path,revision:row.revision+1});
 }
 const match=u.pathname.match(/^\/api\/releases\/([a-f0-9-]{36})\/(preview|viewed|settings|approve|check|edit)$/);if(!match||request.method!=='POST')return null;
 const row=await release(env.DB,match[1]),data=await readJson(request);
 if(data.expectedRevision!==row.revision)throw err('The update changed. Preview the latest version.',409);
 if(!row.ready)throw err('Files are still arriving. Preview will open as soon as they are complete.',409);
 if(match[2]==='edit'){
  const id=crypto.randomUUID(),manifest={...JSON.parse(row.manifest),...JSON.parse(row.edits)};
  await env.DB.batch([env.DB.prepare('INSERT INTO cms_releases(id,target,title,source,source_sha,arrived_at,manifest,ready,theme) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,row.target,'Edit · '+row.title.slice(0,145),'control-room',await digest(encoder.encode(id)),new Date().toISOString(),JSON.stringify(manifest),1,row.theme),env.DB.prepare('INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)').bind(actor,'release-edit',id)]);
  return json({id,revision:1,target:row.target,title:'Edit · '+row.title,ready:1});
 }
 if(match[2]==='preview'){
  const expires=Math.floor(Date.now()/1000)+3600,token=await previewToken(env,row.id,row.revision,expires);
  const entryPath=data.path?publicPath(data.path):RELEASE_TARGETS[row.target].entry,asset={...JSON.parse(row.manifest),...JSON.parse(row.edits)}[entryPath],html=asset?.type==='text/html'?await (await env.MEDIA.get('releases/blobs/'+asset.sha256))!.text():null;if(html===null)throw err('Choose an HTML page from this update.');
  return json({id:row.id,revision:row.revision,theme:JSON.parse(row.theme),html,pages:Object.keys({...JSON.parse(row.manifest),...JSON.parse(row.edits)}).filter(p=>p.endsWith('.html')),entry:entryPath,url:`/api/release-preview/${row.id}/${row.revision}/${expires}/${token}${entryPath}`});
 }
 if(match[2]==='viewed'){
  await env.DB.prepare('INSERT INTO cms_release_previews(release_id,actor,revision) VALUES(?,?,?) ON CONFLICT(release_id,actor) DO UPDATE SET revision=excluded.revision').bind(row.id,actor,row.revision).run();return json({ok:true});
 }
 if(match[2]==='settings'){
  if(row.approved_at)throw err('An approved snapshot cannot be edited. Send a new update.',409);
  const theme=themeOf(data.theme),edits=JSON.parse(row.edits),manifest:Manifest=JSON.parse(row.manifest);
  if(data.pages!==undefined){
   if(!data.pages||typeof data.pages!=='object'||Array.isArray(data.pages)||Object.keys(data.pages).length>150)throw err('Choose up to 150 pages per shared update.');
   for(const [raw,html] of Object.entries(data.pages)){const path=publicPath(raw);if(!path.endsWith('.html')||(!manifest[path]&&!edits[path])||typeof html!=='string'||html.length>1_000_000||protectedRoute(path))throw err('Choose existing HTML pages for shared menus and footers.');const bytes=encoder.encode(html),sha=await digest(bytes);await env.MEDIA.put('releases/blobs/'+sha,bytes,{httpMetadata:{contentType:'text/html'},customMetadata:{sha256:sha}});edits[path]={sha256:sha,size:bytes.length,type:'text/html'};}
  }
  if(data.html!==undefined){const path=publicPath(data.path||'');if(!path.endsWith('.html')||(!manifest[path]&&!edits[path]&&!data.createPage)||protectedRoute(path)||typeof data.html!=='string'||data.html.length>1_000_000)throw err('Choose an HTML page from this update.');const bytes=encoder.encode(data.html),sha=await digest(bytes);await env.MEDIA.put('releases/blobs/'+sha,bytes,{httpMetadata:{contentType:'text/html'},customMetadata:{sha256:sha}});edits[path]={sha256:sha,size:bytes.length,type:'text/html'}}
  const result=await env.DB.prepare('UPDATE cms_releases SET theme=?,edits=?,revision=revision+1 WHERE id=? AND revision=? AND approved_at IS NULL').bind(JSON.stringify(theme),JSON.stringify(edits),row.id,row.revision).run();if(!result.meta.changes)throw err('Another administrator changed this update.',409);return json({ok:true,revision:row.revision+1,status:'new_update'});
 }
 if(match[2]==='approve'){
  const seen=await env.DB.prepare('SELECT revision FROM cms_release_previews WHERE release_id=? AND actor=?').bind(row.id,actor).first<{revision:number}>();if(seen?.revision!==row.revision)throw err('Preview this exact version before approving.',409);
  const now=new Date().toISOString();const result=await env.DB.batch([
   env.DB.prepare('UPDATE cms_releases SET approved_at=?,approved_by=? WHERE id=? AND revision=? AND ready=1 AND approved_at IS NULL').bind(now,actor,row.id,row.revision),
   env.DB.prepare('INSERT INTO cms_active_releases(target,release_id,revision,activated_at) SELECT target,id,revision,? FROM cms_releases WHERE id=? AND approved_at=? AND changes()>0 ON CONFLICT(target) DO UPDATE SET release_id=excluded.release_id,revision=excluded.revision,activated_at=excluded.activated_at').bind(now,row.id,now),
   env.DB.prepare("INSERT INTO cms_audit(actor,action,target) SELECT ?,'release-approved',? WHERE changes()>0").bind(actor,row.id),
   env.DB.prepare('INSERT INTO cms_release_baselines(release_id,site,kind,entry_key,revision_version) SELECT ?,site,kind,entry_key,revision_version FROM cms_publications WHERE site=? AND changes()>0').bind(row.id,RELEASE_TARGETS[row.target].site)
  ]);if(!result[0].meta.changes)throw err('This update was already approved or changed.',409);return json({ok:true,approved:true,revision:row.revision,working:'verification_pending'});
 }
 if(!row.approved_at)throw err('Approve the update before checking its live status.',409);
 const target=RELEASE_TARGETS[row.target];const response=await fetch(`https://${target.host}${target.scope}?hkem-check=${row.id}-${row.revision}`,{redirect:'manual',cache:'no-store'});
 const working=response.ok&&response.headers.get('x-hkem-release')===`${row.id}:${row.revision}`;
 await env.DB.prepare('INSERT INTO cms_release_checks(release_id,revision,working,checked_at) VALUES(?,?,?,?) ON CONFLICT(release_id) DO UPDATE SET revision=excluded.revision,working=excluded.working,checked_at=excluded.checked_at').bind(row.id,row.revision,working?1:0,new Date().toISOString()).run();return json({ok:true,working});
}
function htmlOutput(html:string,prefix:string,row:Release,preview:boolean,path:string){
 // New designs do not load obsolete server CMS overlays. Later CMS edits still apply.

 html=html.replace(/<(?:script|link|img|source|video|audio)\b[^>]*>/gi,tag=>{
  if(/^<link/i.test(tag)&&/rel=['"]canonical['"]/i.test(tag))return tag;
  return tag.replace(/\b(src|href|poster|srcset)=(['"])([^'"]+)\2/gi,(_,attribute,quote,url)=>{
   const resolveAsset=(value:string)=>{if(/^(?:https?:|data:|#|\/\/)/.test(value))return value;const resolved=new URL(value,'https://snapshot.invalid'+path);return prefix+resolved.pathname.slice(1)+resolved.search+resolved.hash};
   const value=attribute.toLowerCase()==='srcset'&&!url.startsWith('data:')?url.split(',').map((part:string)=>{const [src,...descriptor]=part.trim().split(/\s+/);return [resolveAsset(src),...descriptor].join(' ')}).join(', '):resolveAsset(url);
   return attribute+'='+quote+value+quote;
  });
 });
 const tag=`<meta name="hkem-release" content="${row.id}:${row.revision}"><link rel="stylesheet" href="${prefix}__hkem-theme.css">`;
 html=html.replace(/<head([^>]*)>/i,`<head$1>${tag}`);html=html.replace(/<\/body>/i,`<script src="${prefix}__hkem-password-tools.js" defer></script></body>`);
 if(preview){html=html.replace(/(<a\b[^>]*?\shref=['"])([^'"]+)(['"])/gi,(_,a,href,z)=>{try{const link=new URL(href,'https://'+RELEASE_TARGETS[row.target].host+path);return a+(link.host===RELEASE_TARGETS[row.target].host?prefix+link.pathname.slice(1)+link.search+link.hash:'#')+z}catch{return a+'#'+z}});html=html.replace(/<\/body>/i,`<script src="${prefix}__hkem-preview.js"></script></body>`)}
 return html;
}
function themeCss(row:Release){
 const theme=JSON.parse(row.theme);return Object.entries(theme).map(([key,value])=>key==='accent'?`:root{--hkem-accent:${value};--accent:${value}}a{color:${value}!important}button,.btn,.button{background:${value}!important}`:key==='text'?`body,h1,h2,h3,p,li{color:${value}!important}`:`body{background:${value}!important}`).join('');
}
async function serveAsset(request:Request,env:Env,row:Release,path:string,prefix:string,preview:boolean){
 path=publicPath(decodeURIComponent(path));
 if(path==='/__hkem-password-tools.js')return new Response(request.method==='HEAD'?null:passwordTools,{headers:{'content-type':'application/javascript','cache-control':'no-cache','x-content-type-options':'nosniff'}});
 if(path==='/__hkem-theme.css')return new Response(request.method==='HEAD'?null:themeCss(row),{headers:{'content-type':'text/css','cache-control':preview?'no-store':'no-cache','x-content-type-options':'nosniff','x-hkem-release':`${row.id}:${row.revision}`}});
 if(path==='/__hkem-preview.js'&&preview)return new Response(`(()=>{const id=${JSON.stringify(row.id)},revision=${row.revision};window.parent.postMessage({type:'hkem-release-loaded',id,revision},'*');document.addEventListener('click',event=>{let node=event.target;if(!(node instanceof Element))return;event.preventDefault();event.stopImmediatePropagation();const parts=[];while(node&&node!==document.documentElement){const tag=node.tagName.toLowerCase(),parent=node.parentElement;if(!parent)break;parts.unshift(tag+':nth-of-type('+([...parent.children].filter(e=>e.tagName===node.tagName).indexOf(node)+1)+')');node=parent;}window.parent.postMessage({type:'hkem-release-select',id,revision,selector:parts.join('>')},'*');},true);})();`,{headers:{'content-type':'application/javascript','cache-control':'no-store','x-content-type-options':'nosniff'}});
 const files:Manifest={...JSON.parse(row.manifest),...JSON.parse(row.edits)};let asset=files[path];
 if(!asset){for(const alternative of [path.replace(/\/$/,'')+'/index.html',path+'.html'])if(files[alternative]){asset=files[alternative];path=alternative;break}}
 if(!asset)return new Response('This page is not included in the approved update.',{status:404,headers:{'cache-control':'no-store','x-hkem-release':`${row.id}:${row.revision}`}});
 const object=await env.MEDIA.get('releases/blobs/'+asset.sha256);if(!object)throw err('Update asset is unavailable.',503);
 const headers=new Headers({'content-type':asset.type,'cache-control':preview?'no-store':(/\/__hkem\/assets\//.test(new URL(request.url).searchParams.get('path')||request.url)?'public, max-age=31536000, immutable':'no-cache, max-age=0, must-revalidate'),'x-content-type-options':'nosniff','x-hkem-release':`${row.id}:${row.revision}`,'access-control-allow-origin':'*'});
 if(!preview){
  headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  if(row.target==='account5'){
   headers.set('X-Frame-Options','DENY');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
   headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://audio.heavenlykey.org; media-src 'self' https://audio.heavenlykey.org blob:; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'");
  }else if(row.target==='account3')headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src https://heavenlykey.alldaywow247.workers.dev/api/broadcast/community-player https://www.youtube-nocookie.com https://www.youtube.com https://www.facebook.com; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
 }
 if(preview)headers.set('content-security-policy' ,`sandbox allow-scripts; default-src 'none'; script-src https://control.heavenlykey.org https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev https://heavenlykey-cms-public.emmanuel2026miracle.workers.dev 'unsafe-inline'; style-src https: 'unsafe-inline'; img-src https: data:; font-src https: data:; media-src https:; connect-src 'none'; form-action 'none'; frame-src 'none'; base-uri 'none'; frame-ancestors 'self' https://control.heavenlykey.org https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev`);
 let body:BodyInit|null=object.body;
 if(row.target==='account6'&&path==='/sw.js'){body='self.HK_RELEASE='+JSON.stringify(`${row.id}:${row.revision}`)+';\n'+await object.text();headers.set('Service-Worker-Allowed','/');headers.set('cache-control','no-cache, max-age=0, must-revalidate');}
 if(asset.type==='text/html')body=htmlOutput(await object.text(),prefix,row,preview,path);
 if(['application/javascript','text/javascript'].includes(asset.type)&&!/(?:^|\/)sw\.js$/.test(path))body=(await object.text()).replace(/(['"`])(\/[^/][^'"`\s]*)\1/g,(all,q,link)=>files[link]&&!protectedRoute(link)?q+prefix+link.slice(1)+q:all);
 if(asset.type==='text/css')body=(await object.text()).replace(/url\(\s*(['"]?)(\/[^/][^)'"\s]*)\1\s*\)/g,(_,q,path)=>`url(${q}${prefix}${path.slice(1)}${q})`);
 return new Response(request.method==='HEAD'?null:body,{headers});
}
export async function previewReleaseRoute(request:Request,env:Env){
 const u=new URL(request.url),m=u.pathname.match(/^\/api\/release-preview\/([a-f0-9-]{36})\/(\d+)\/(\d+)\/([a-f0-9]{64})(\/.*)$/);if(!m||!['GET','HEAD'].includes(request.method))return null;
 if(Number(m[3])<Date.now()/1000||Number(m[3])>Date.now()/1000+3610||await previewToken(env,m[1],Number(m[2]),Number(m[3]))!==m[4])return new Response('Preview link expired.',{status:403});
 const row=await release(env.DB,m[1]);if(row.revision!==Number(m[2])||!row.ready)return new Response('This preview changed. Reopen it from the awaiting room.',{status:409});
 const prefix=u.origin+u.pathname.slice(0,-m[5].length)+'/';return serveAsset(request,env,row,m[5],prefix,true);
}
export async function publicReleaseRoute(request:Request,env:Env){
 const u=new URL(request.url);if(u.pathname!=='/v1/release-asset'||!['GET','HEAD'].includes(request.method))return null;
 const host=u.searchParams.get('host')||'',path=publicPath(decodeURIComponent(u.searchParams.get('path')||'/'));if(protectedRoute(path))return new Response(null,{status:204});
 const immutable=path.match(/^(?:\/pages\/apps\/[^/]+)?\/__hkem\/assets\/([a-f0-9-]{36})(\/.*)$/);
 let row:Release|null=null;
 if(immutable){const candidate=await release(env.DB,immutable[1]);const target=RELEASE_TARGETS[candidate.target];if(!candidate.approved_at||![target.host,'www.'+target.host].includes(host))return new Response('Unknown release asset.',{status:404});row=candidate;return serveAsset(request,env,row,immutable[2],`https://${host}/__hkem/assets/${row.id}/`,false)}
 const targets=targetsFor(host,path);
 if(targets.length)row=await env.DB.prepare(`SELECT r.* FROM cms_active_releases a JOIN cms_releases r ON r.id=a.release_id AND r.revision=a.revision WHERE a.target IN (${targets.map(()=>'?').join(',')}) ORDER BY a.activated_at DESC LIMIT 1`).bind(...targets).first<Release>();
 if(!row)return new Response(null,{status:204});
 const actual=path==='/'?RELEASE_TARGETS[row.target].entry:path;
 const t=RELEASE_TARGETS[row.target],prefix=t.scope==='/'?`https://${host}/`:`https://${host}${t.scope}__hkem/assets/${row.id}/`;
 return serveAsset(request,env,row,actual,prefix,false);
}
/** Retire old presentation overrides without deleting a row or changing user data. */
export async function activeReleaseTime(db:D1Database,site:string,page:string){
 const matches=Object.entries(RELEASE_TARGETS).filter(([,t])=>t.site===site&&(t.scope==='/'||('/'+page+'/').startsWith(t.scope))).map(([key])=>key);
 if(!matches.length)return null;const rows=await db.prepare(`SELECT activated_at FROM cms_active_releases WHERE target IN (${matches.map(()=>'?').join(',')}) ORDER BY activated_at DESC LIMIT 1`).bind(...matches).first<{activated_at:string}>();return rows?.activated_at||null;
}

export async function retiredPublicationVersions(db:D1Database,site:string,page:string){
 const targets=Object.entries(RELEASE_TARGETS).filter(([,t])=>t.site===site&&(t.scope==='/'||('/'+page+'/').startsWith(t.scope))).map(([id])=>id);if(!targets.length)return new Map<string,number>();
 const rows=await db.prepare(`SELECT kind,entry_key,revision_version FROM cms_release_baselines WHERE release_id=(SELECT release_id FROM cms_active_releases WHERE target IN (${targets.map(()=>'?').join(',')}) ORDER BY activated_at DESC LIMIT 1)`).bind(...targets).all<{kind:string;entry_key:string;revision_version:number}>();
 return new Map(rows.results.map(row=>[row.kind+'/'+row.entry_key,row.revision_version]));
}
