import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {saveDraft,restoreDraft} from '../src/cms-storage.ts';
import {awaitingRoom,previewUpdate,approveUpdate} from '../src/awaiting-room.ts';
import {setOwnerPassword,ownerLogin} from '../src/owner-auth.ts';
import worker from '../src/index.ts';
function database(){
 const raw=new DatabaseSync(':memory:');
 for(const name of ['0001_cms.sql','0002_publications.sql','0003_owner_signin.sql','0006_awaiting_room.sql'])raw.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const db={raw,prepare(sql){let values=[];const statement={bind(...v){values=v;return statement},async first(){return raw.prepare(sql).get(...values)||null},async all(){return {results:raw.prepare(sql).all(...values)}},async run(){const r=raw.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}}}};return statement},async batch(statements){raw.exec('BEGIN');try{const results=[];for(const stmt of statements)results.push(await stmt.run());raw.exec('COMMIT');return results}catch(e){raw.exec('ROLLBACK');throw e}}};return db;
}
const location={site:'account1',kind:'page',key:'home'};
const document=value=>({schema:1,fields:[{key:'t_1234567',type:'text',value}]});
test('updates arrive immediately; exact-version preview is required per administrator; newer changes invalidate approval',async()=>{
 const db=database();const saved=await saveDraft(db,location,document('New'),0,'AI');assert.equal(saved.status,'awaiting_review');
 let row=(await awaitingRoom(db)).items[0];assert.equal(row.status,'new_update');assert.ok(row.arrivedAt);assert.equal(row.source,'AI');
 await assert.rejects(approveUpdate(db,location,1,'admin'),e=>e.status===409);
 await previewUpdate(db,location,1,'admin');await assert.rejects(approveUpdate(db,location,1,'other'),e=>e.status===409);
 await saveDraft(db,location,document('Changed'),1,'editor');await assert.rejects(approveUpdate(db,location,2,'admin'),e=>e.status===409);
 await assert.rejects(approveUpdate(db,location,1,'admin'),e=>e.status===409);
 assert.equal(db.raw.prepare('SELECT count(*) n FROM cms_publications').get().n,0);
 await previewUpdate(db,location,2,'admin');await approveUpdate(db,location,2,'admin');
 row=(await awaitingRoom(db)).items[0];assert.equal(row.status,'approved');assert.ok(row.approvedAt);
 await restoreDraft(db,location,1,2,'admin');row=(await awaitingRoom(db)).items[0];assert.equal(row.status,'new_update');assert.equal(row.approvedVersion,2);
});
test('accounts, community, Bible, individual apps and theme settings remain independent',async()=>{
 const db=database();for(const site of ['account1','account2','account3','account4','account5','account6'])await saveDraft(db,{...location,site},document(site),0,'admin');
 for(const key of ['apps/radio','apps/study','apps/community','apps/bible','apps/walk'])await saveDraft(db,{...location,site:'account5',key},document(key),0,'admin');
 const theme={schema:1,fields:[{key:'c_1234567',type:'tone',value:'wine'},{key:'s_1234567',type:'layout',value:'wide'}]};await saveDraft(db,location,theme,1,'admin');
 assert.equal((await awaitingRoom(db)).items.length,11);
 await previewUpdate(db,location,2,'admin');await approveUpdate(db,location,2,'admin');
 assert.equal(db.raw.prepare('SELECT count(*) n FROM cms_publications').get().n,1);
 assert.equal((await awaitingRoom(db)).items.filter(i=>i.status==='new_update').length,10);
});
test('AI edits enter the awaiting room directly, preserve existing fields, and never publish; stale AI results cannot overwrite',async()=>{
 const db=database(),origin='https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev';
 await setOwnerPassword(db,'a-long-owner-password-2026','admin');
 const login=await ownerLogin(new Request(origin,{headers:{'CF-Connecting-IP':'127.0.0.1'}}),db,'a-long-owner-password-2026');
 await saveDraft(db,location,{schema:1,fields:[...document('Old').fields,{key:'t_7654321',type:'text',value:'Keep'}]},0,'admin');
 const env={DB:db,AI:{run:async()=>({response:JSON.stringify(document('AI edit'))})}};
 const request=(version=1)=>new Request(origin+'/api/ai?site=account1&kind=page&key=home',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:login.cookie.split(';')[0]},body:JSON.stringify({mode:'edit',prompt:'Improve text',content:document('Old'),expectedVersion:version})});
 const response=await worker.fetch(request(),env);assert.equal(response.status,200);assert.equal((await response.json()).queued.version,2);
 const content=JSON.parse(db.raw.prepare('SELECT content FROM cms_entries').get().content);assert.equal(content.fields[0].value,'AI edit');assert.equal(content.fields[1].value,'Keep');
 assert.equal(db.raw.prepare('SELECT count(*) n FROM cms_publications').get().n,0);assert.equal((await worker.fetch(request(),env)).status,409);
 const denied=await worker.fetch(new Request(origin+'/api/approve?site=account1&kind=page&key=home',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{"expectedVersion":2}'}),env);assert.equal(denied.status,401);
});
