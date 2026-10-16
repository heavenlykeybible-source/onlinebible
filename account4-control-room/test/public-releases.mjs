import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {RELEASE_TARGETS} from '../src/release-targets.ts';
import {intakeRoute,adminReleaseRoute,previewReleaseRoute,publicReleaseRoute,digest,ingestAuthorized,activeReleaseTime} from '../src/public-releases.ts';
import {submitSnapshot,changedTargets} from '../../scripts/account4-intake.mjs';
import {route} from '../../portal-router/worker.mjs';
import {publicRoute} from '../../cms-public/worker.mjs';
import {saveDraft,publishDraft} from '../src/cms-storage.ts';
function database(){const raw=new DatabaseSync(':memory:');for(const name of ['0001_cms.sql','0002_publications.sql','0006_awaiting_room.sql','0007_public_releases.sql'])raw.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 raw.exec("CREATE TABLE users(id TEXT,password_hash TEXT);INSERT INTO users VALUES('existing-user','existing-password-hash');CREATE TABLE private_settings(key TEXT,value TEXT);INSERT INTO private_settings VALUES('api-key','private-value');");
 const db={raw,prepare(sql){let values=[];const statement={bind(...v){values=v;return statement},async first(){return raw.prepare(sql).get(...values)||null},async all(){return {results:raw.prepare(sql).all(...values)}},async run(){const r=raw.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}}}};return statement},async batch(stmts){raw.exec('BEGIN');try{const results=[];for(const s of stmts)results.push(await s.run());raw.exec('COMMIT');return results}catch(e){raw.exec('ROLLBACK');throw e}}};return db;}
function env(){const objects=new Map();return {DB:database(),RELEASE_INGEST_TOKEN:'test-only-release-ingest-token-long-enough',MEDIA:{async put(key,bytes,options){objects.set(key,{bytes:new Uint8Array(bytes),...options})},async head(key){const o=objects.get(key);return o?{size:o.bytes.length,customMetadata:o.customMetadata}:null},async get(key){const o=objects.get(key);return o?{body:o.bytes,text:async()=>new TextDecoder().decode(o.bytes),httpMetadata:o.httpMetadata}:null}}}}
const request=(path,data,method='POST')=>new Request('https://control.heavenlykey.org'+path,{method,headers:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
async function submit(e,target='account1',text='New design',sha='a'.repeat(40)){
 const path=RELEASE_TARGETS[target].entry,html=`<html><head><link href="/style.css" rel="stylesheet"></head><body><h1>${text}</h1><img src="/new.png"></body></html>`,data=new TextEncoder().encode(html),css=new TextEncoder().encode('body{color:green}'),image=new Uint8Array([1,2,3]);
 const manifest={[path]:{sha256:await digest(data),size:data.length,type:'text/html'},'/style.css':{sha256:await digest(css),size:css.length,type:'text/css'},'/new.png':{sha256:await digest(image),size:3,type:'image/png'}};
 const sw=new TextEncoder().encode('/* worker fixture */');if(target==='account6')manifest['/sw.js']={sha256:await digest(sw),size:sw.length,type:'application/javascript'};
 const response=await intakeRoute(request('/api/releases/ingest',{target,title:'Approved redesign',source:'direct-ai',sourceSha:sha,manifest}),e,'ai-intake');assert.equal(response.status,201);const {id}=await response.json();
 for(const [p,bytes] of [[path,data],['/style.css',css],['/new.png',image]])await intakeRoute(new Request('https://control.heavenlykey.org/api/releases/'+id+'/asset?path='+p,{method:'PUT',body:bytes}),e,'ai-intake');
 if(target==='account6')await intakeRoute(new Request('https://control.heavenlykey.org/api/releases/'+id+'/asset?path=/sw.js',{method:'PUT',body:sw}),e,'ai-intake');
 await intakeRoute(request('/api/releases/'+id+'/ready',{}),e,'ai-intake');return id;
}
async function admin(e,id,action,version=1,extra={},actor='admin'){return adminReleaseRoute(request('/api/releases/'+id+'/'+action,{expectedRevision:version,...extra}),e,actor)}
const asset=(host,path)=>new Request('https://public.test/v1/release-asset?'+new URLSearchParams({host,path}));
test('all six accounts and every app arrive directly, preview then approve independently, preserving users and API settings',async()=>{
 const e=env();for(const target of Object.keys(RELEASE_TARGETS)){
  const id=await submit(e,target);await assert.rejects(admin(e,id,'approve'),x=>x.status===409);
  const preview=await (await admin(e,id,'preview')).json(),rendered=await previewReleaseRoute(new Request('https://control.heavenlykey.org'+preview.url),e);assert.match(rendered.headers.get('content-security-policy'),/connect-src 'none'/);assert.match(await rendered.text(),/New design/);
  await admin(e,id,'viewed');await assert.rejects(admin(e,id,'approve',1,{},'other-admin'),x=>x.status===409);await admin(e,id,'approve');
  const t=RELEASE_TARGETS[target],live=await publicReleaseRoute(asset(t.host,t.scope),e);assert.equal(live.status,200);assert.equal(live.headers.get('x-hkem-release'),id+':1');
 }
 assert.equal(e.DB.raw.prepare('SELECT count(*) n FROM cms_active_releases').get().n,Object.keys(RELEASE_TARGETS).length);
 assert.deepEqual({...e.DB.raw.prepare('SELECT * FROM users').get()},{id:'existing-user',password_hash:'existing-password-hash'});
 assert.equal(e.DB.raw.prepare('SELECT value FROM private_settings').get().value,'private-value');
});
test('a new complete snapshot replaces the old snapshot, removed files do not fall back, edits invalidate preview, old CMS remains stored',async()=>{
 const e=env();const first=await submit(e);await admin(e,first,'viewed');await admin(e,first,'approve');
 await e.DB.prepare("INSERT INTO cms_publications(site,kind,entry_key,content,revision_version,published_by) VALUES('account1','page','home','{}',1,'old')").run();
 const second=await submit(e,'account1','Replacement','b'.repeat(40));await admin(e,second,'viewed');
 const settings=await (await admin(e,second,'settings',1,{theme:{background:'#ffff00'},path:'/index.html',html:'<html><head></head><body>Edited replacement</body></html>'})).json();assert.equal(settings.revision,2);
 await assert.rejects(admin(e,second,'approve',2),x=>x.status===409);await assert.rejects(admin(e,second,'preview',1),x=>x.status===409);
 await admin(e,second,'viewed',2);await admin(e,second,'approve',2);
 const response=await publicReleaseRoute(asset('heavenlykey.org','/'),e);assert.match(await response.text(),/Edited replacement/);assert.equal(response.headers.get('x-hkem-release'),second+':2');
 assert.equal((await publicReleaseRoute(asset('heavenlykey.org','/deleted-old-page.html'),e)).status,404);
 assert.ok(await activeReleaseTime(e.DB,'account1','home'));assert.equal(e.DB.raw.prepare('SELECT count(*) n FROM cms_publications').get().n,1);
 await assert.rejects(admin(e,second,'settings',2,{theme:{text:'#000000'}}),x=>x.status===409);
});
test('ingest cannot approve; mismatched checksums, unknown targets, protected paths and expired previews fail',async()=>{
 const e=env(),id=await submit(e);assert.equal(await intakeRoute(request('/api/releases/'+id+'/approve',{}),e,'ai'),null);
 assert.equal(await ingestAuthorized(new Request('https://control.heavenlykey.org',{headers:{Authorization:'Bearer wrong-token'}}),e),false);
 await assert.rejects(intakeRoute(request('/api/releases/ingest',{target:'unknown'}),e,'ai'),x=>x.status===400);
 const preview=await (await admin(e,id,'preview')).json();const expired=preview.url.replace(/\/\d{10}\//,'/1000000000/');assert.equal((await previewReleaseRoute(new Request('https://control.heavenlykey.org'+expired),e)).status,403);
 assert.equal((await publicReleaseRoute(asset('heavenlykey.org','/api/users'),e)).status,204);
 assert.equal((await publicReleaseRoute(asset('heavenlykey.org','/'),e)).status,204);
});
test('gateway serves approved assets, never falls back to old design, and forwards user/password/key APIs untouched',async()=>{
 const e=env(),id=await submit(e);await admin(e,id,'viewed');await admin(e,id,'approve');const forwarded=[];
 const fetcher=async req=>{if(req.url.startsWith('https://heavenlykey-cms-public.'))return publicReleaseRoute(req,e);forwarded.push(req);return Response.json({ok:true})};
 const response=await route(new Request('https://heavenlykey.org/'),fetcher);assert.match(await response.text(),/New design/);assert.equal(forwarded.length,0);
 assert.equal((await route(new Request('https://heavenlykey.org/old-page'),fetcher)).status,404);assert.equal(forwarded.length,0);
 for(const path of ['/api/users','/api/owner/password','/api/settings/api-key']){const request=new Request('https://control.heavenlykey.org'+path,{method:'POST',headers:{Origin:'https://control.heavenlykey.org','Content-Type':'application/json'},body:'{"keep":"unchanged"}'});await route(request,fetcher);const forwardedRequest=forwarded.at(-1);assert.equal(await forwardedRequest.text(),'{"keep":"unchanged"}');assert.equal(new URL(forwardedRequest.url).pathname,path)}
 assert.equal((await route(new Request('https://heavenlykey.org/api/admin/cms/page',{method:'POST'}),fetcher)).status,409);
});
test('source/AI build uploader finishes in awaiting room and has no approval/deployment request',async()=>{
 const root=mkdtempSync(join(tmpdir(),'hkem-release-')),e=env(),base=join(root,'heavenly-key-app/public');mkdirSync(base,{recursive:true});writeFileSync(join(base,'index.html'),'<html><head></head><body>New app</body></html>');writeFileSync(join(base,'app.js'),'console.log("app ready");');const calls=[];
 const result=await submitSnapshot({root,target:'account5',sourceSha:'c'.repeat(40),origin:'https://control.heavenlykey.org',token:e.RELEASE_INGEST_TOKEN},async(url,options)=>{calls.push(url);const req=new Request(url,options);assert.equal(await ingestAuthorized(req,e),true);return intakeRoute(req,e,'source')});
 assert.equal(result.published,false);assert.equal(e.DB.raw.prepare('SELECT ready FROM cms_releases').get().ready,1);assert.equal(e.DB.raw.prepare('SELECT count(*) n FROM cms_active_releases').get().n,0);assert.ok(calls.every(url=>!url.includes('approve')&&!url.includes('deploy')));
 assert.deepEqual(changedTargets(['heavenly-key-website/bible/app.js']),['account6']);assert.deepEqual(changedTargets(['heavenly-key-website/pages/apps/radio/index.html']),['app-radio']);
});

test('old CMS presentation overrides retire without deletion and later approvals remain visible',async()=>{
 const e=env(),loc={site:'account5',kind:'page',key:'home'},doc=value=>({schema:1,fields:[{key:'t_1234567',type:'text',value}]});
 await saveDraft(e.DB,loc,doc('Old overlay'),0,'owner');await publishDraft(e.DB,loc,1,'owner');const id=await submit(e,'account5');await admin(e,id,'viewed');await admin(e,id,'approve');
 const read=async()=>(await (await publicRoute(new Request('https://public.test/v1/content?site=account5&page=home'),e)).json()).content;
 assert.equal(await read(),null);assert.equal(e.DB.raw.prepare('SELECT count(*) n FROM cms_publications').get().n,1);
 await saveDraft(e.DB,loc,doc('New approved edit'),1,'owner');await publishDraft(e.DB,loc,2,'owner');assert.equal((await read()).fields[0].value,'New approved edit');
 const live=await publicReleaseRoute(asset('app.heavenlykey.org','/'),e);assert.match(live.headers.get('Content-Security-Policy'),/script-src 'self'; style-src 'self';/);assert.doesNotMatch(await live.text(),/<style|<script>/);assert.doesNotMatch(live.headers.get('Cache-Control'),/no-store/);
});

test('wrong file bytes and protected database files cannot enter a ready public snapshot',async()=>{
 const e=env(),bytes=new TextEncoder().encode('<html>different bytes</html>'),manifest={'/index.html':{sha256:'0'.repeat(64),size:bytes.length,type:'text/html'}};
 const arrival=await (await intakeRoute(request('/api/releases/ingest',{target:'account1',title:'Checksum test',source:'ai',sourceSha:'d'.repeat(40),manifest}),e,'ai')).json();
 await assert.rejects(intakeRoute(new Request('https://control.heavenlykey.org/api/releases/'+arrival.id+'/asset?path=/index.html',{method:'PUT',body:bytes}),e,'ai'),x=>x.status===422);
 await assert.rejects(intakeRoute(request('/api/releases/'+arrival.id+'/ready',{}),e,'ai'),x=>x.status===409);
 await assert.rejects(intakeRoute(request('/api/releases/ingest',{target:'account1',title:'Protected path',source:'ai',sourceSha:'e'.repeat(40),manifest:{...manifest,'/database.sql':{sha256:'0'.repeat(64),size:1,type:'text/plain'}}}),e,'ai'),x=>x.status===400);
});

test('every approved Bible release changes worker identity even when worker source is unchanged',async()=>{
 const e=env();let last='';for(let i=0;i<2;i++){const id=await submit(e,'account6','Bible '+i,String(i+1).repeat(40));await admin(e,id,'viewed');await admin(e,id,'approve');const r=await publicReleaseRoute(asset('bible.heavenlykey.org','/sw.js'),e);const body=await r.text();assert.ok(body.includes('self.HK_RELEASE="'+id+':1"'));assert.notEqual(body,last);assert.equal(r.headers.get('Service-Worker-Allowed'),'/');assert.match(r.headers.get('cache-control'),/no-cache/);last=body;}
});
test('Bible reader links from all public portals resolve to the same approved Bible host',async()=>{
 for(const host of ['heavenlykey.org','global.heavenlykey.org','app.heavenlykey.org','studio.heavenlykey.org']){const r=await route(new Request('https://'+host+'/bible/?chapter=3'),()=>{throw Error('unexpected upstream')});assert.equal(r.status,302);assert.equal(r.headers.get('location'),'https://bible.heavenlykey.org/?chapter=3');}
});
test('an approved website can be edited without changing the active version; new pages and pictures require a fresh preview',async()=>{
 const e=env(),id=await submit(e);await admin(e,id,'viewed');await admin(e,id,'approve');const clone=await (await admin(e,id,'edit')).json();assert.notEqual(clone.id,id);assert.equal((await publicReleaseRoute(asset('heavenlykey.org','/'),e)).headers.get('x-hkem-release'),id+':1');
 const bytes=new Uint8Array([137,80,78,71,13,10,26,10,0]);let r=await adminReleaseRoute(new Request('https://control.heavenlykey.org/api/releases/'+clone.id+'/picture?revision=1',{method:'PUT',headers:{'content-type':'image/png'},body:bytes}),e,'admin');const picture=await r.json();assert.equal(picture.revision,2);assert.match(picture.path,/cms-pictures/);
 await admin(e,clone.id,'settings',2,{theme:{},path:'/pages/new.html',html:'<html><head></head><body>New page<img src="'+picture.path+'"></body></html>',createPage:true});const preview=await(await admin(e,clone.id,'preview',3,{path:'/pages/new.html'})).json();assert.ok(preview.pages.includes('/pages/new.html'));await assert.rejects(admin(e,clone.id,'approve',3),x=>x.status===409);await admin(e,clone.id,'viewed',3);await admin(e,clone.id,'approve',3);assert.equal((await publicReleaseRoute(asset('heavenlykey.org',picture.path),e)).status,200);assert.match(await(await publicReleaseRoute(asset('heavenlykey.org','/pages/new.html'),e)).text(),/New page/);
});
