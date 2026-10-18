import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {stripTypeScriptTypes} from 'node:module';
import {readFileSync,readdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
const base=fileURLToPath(new URL('..',import.meta.url));
test('API security: privacy, reporting, independent appeals, blocking and request boundaries',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'registration-')),db=new DatabaseSync(':memory:');
 try{
 for(const file of readdirSync(path.join(base,'migrations')).filter(x=>x.endsWith('.sql')).sort())db.exec(readFileSync(path.join(base,'migrations',file),'utf8'));
 for(const file of readdirSync(path.join(base,'src')).filter(x=>x.endsWith('.ts'))){
 let source=stripTypeScriptTypes(readFileSync(path.join(base,'src',file),'utf8'));
 source=source.replace(/from (["'])\.\/([a-z-]+)\1/g,(_,q,n)=>'from '+q+'./'+n+'.mjs'+q);
 source=source.replace(/from (["'])\.\.\/public\/([a-z-]+\.js)\1/g,(_,q,n)=>'from '+q+pathToFileURL(path.join(base,'public',n)).href+q);
 writeFileSync(path.join(dir,file.replace(/\.ts$/,'.mjs')),source);}
 const worker=(await import(pathToFileURL(path.join(dir,'index.mjs')).href)).default;
 const entries=new Map();let failAcknowledgement=false;
 const statement=(sql,params=[])=>({sql,params,bind(...p){return statement(sql,p);},async first(){return db.prepare(sql).get(...params)||null;},async all(){return {results:db.prepare(sql).all(...params)};},async run(){const r=db.prepare(sql).run(...params);return {meta:{changes:Number(r.changes)}};}});
 const env={DB:{prepare:sql=>statement(sql),async batch(items){db.exec('BEGIN');try{const result=[];for(const item of items){if(failAcknowledgement&&item.sql.includes('INSERT INTO account_acknowledgements'))throw new Error('Simulated profile acknowledgement failure');result.push({results:db.prepare(item.sql).all(...item.params),meta:{changes:db.prepare('SELECT changes() n').get().n}});}db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}},SESSIONS:{async get(k){return entries.get(k)||null;},async put(k,v){entries.set(k,v);},async delete(k){entries.delete(k);}},PASSWORD_PEPPER:'local-test-only',MEDIA:{}};
 const source=String(Date.now());
 async function req(path,data,cookie,method=data?'POST':'GET',headers={}){const r=await worker.fetch(new Request('https://example.invalid'+path,{method,headers:{'Content-Type':'application/json','CF-Connecting-IP':source,...(cookie?{Cookie:cookie}:{}),...headers},body:data?JSON.stringify(data):undefined}),env);return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 const sql=command=>db.exec(command);
 assert.equal((await req('/api/auth/register',{email:'underage@example.invalid',password:'TestingAudit8825',fullName:'Age test',ageConfirmed:false,standardsAccepted:true})).status,400);
 const accounts=[];for(let i=0;i<4;i++){const a=await req('/api/auth/register',{ageConfirmed:true,standardsAccepted:true,email:`audit-${source}-${i}@example.invalid`,password:'TestingAudit8825',fullName:i===0?'Unsearchable Legal Identity':'Audit User '+i,displayName:'Audit display '+i,country:'Nigeria'});assert.equal(a.status,201,JSON.stringify(a));accounts.push(a);}
 const [a,b,admin,independent]=accounts,uid=a.data.userId,bid=b.data.userId;
 const mine=(await req('/api/me',null,a.cookie)).data.profile;assert.equal(mine.locationVisibility,'private');assert.equal(mine.messagingVisibility,'connections');
 await req('/api/me/profile',{city:'Private city',church:'Private church',work:'Private job',locationVisibility:'connections',churchVisibility:'private',workVisibility:'private'},a.cookie,'PATCH');
 await req('/api/me/profile',{bio:'Changed bio only'},a.cookie,'PATCH');
 assert.equal((await req('/api/me',null,a.cookie)).data.profile.churchVisibility,'private');
 assert.equal((await req('/api/me/profile',{locationVisibility:'invalid'},a.cookie,'PATCH')).status,400);
 const guest=(await req('/api/profiles/'+uid)).data.profile;assert.equal(guest.fullName,undefined);assert.equal(guest.city,null);assert.equal((await req('/api/discover?q=Unsearchable%20Legal%20Identity')).data.items.length,0);
 await req('/api/global-connect/profile/'+uid,{},b.cookie);
 assert.equal((await req('/api/profiles/'+uid,null,b.cookie)).data.profile.city,null);
 const post=await req('/api/posts',{postFormat:'design_card',body:'Connections teaching in Christ',visibility:'connections'},a.cookie);assert.equal(post.status,201,JSON.stringify(post));const pid=post.data.postId;
 assert.equal((await req('/api/feed?postId='+pid,null,b.cookie)).data.items.length,0);assert.equal((await req('/api/feed?postId='+pid,null,a.cookie)).data.items.length,1);
 const prayer=await req('/api/prayer-items',{title:'Prayer',requestText:'Connections prayer to God',visibility:'connections'},a.cookie);assert.equal(prayer.status,201);
 assert.ok(!(await req('/api/prayer-items',null,b.cookie)).data.items.some(x=>x.prayer_item_id===prayer.data.prayerItemId));
 await req('/api/global-connect/profile/'+bid,{},a.cookie);
 assert.equal((await req('/api/profiles/'+uid,null,b.cookie)).data.profile.city,'Private city');assert.equal((await req('/api/feed?postId='+pid,null,b.cookie)).data.items.length,1);
 assert.ok((await req('/api/prayer-items',null,b.cookie)).data.items.some(x=>x.prayer_item_id===prayer.data.prayerItemId));
 const spaceInput={name:'Audit space',category:'ministry',description:'A ministry for Christians.',website:'javascript:alert(1)'};assert.equal((await req('/api/spaces',spaceInput,a.cookie)).status,400);const space=await req('/api/spaces',{...spaceInput,website:'https://example.org',contactEmail:'private@example.invalid'},a.cookie);assert.equal(space.status,201);assert.equal((await req('/api/spaces/'+space.data.slug)).data.space.contact_email,undefined);
 assert.equal((await req('/api/reports',{targetType:'message',targetId:999999,reason:'harassment'},b.cookie)).status,400);
 const conversation=await req('/api/messages/requests',{recipientUserId:bid},a.cookie);await req('/api/messages/'+conversation.data.conversation_id+'/decision',{decision:'accept'},b.cookie);
 const msg=await req('/api/messages/'+conversation.data.conversation_id,{body:'A reported message'},a.cookie);assert.equal(msg.status,201);
 assert.equal((await req('/api/reports',{targetType:'message',targetId:msg.data.messageId,reason:'harassment'},independent.cookie)).status,400);
 const mr=await req('/api/reports',{targetType:'message',targetId:msg.data.messageId,reason:'harassment'},b.cookie);assert.equal(mr.status,201);
 const group=await req('/api/groups',{name:'Audit private group',groupType:'prayer',christianPurpose:'Prayer and fellowship with Christ.',visibility:'private'},a.cookie);const gp=await req('/api/posts',{postFormat:'design_card',body:'Private group message',groupId:group.data.groupId},a.cookie);assert.equal(gp.status,201);
 assert.equal((await req('/api/reports',{targetType:'post',targetId:gp.data.postId,reason:'harassment'},b.cookie)).status,400);
 assert.equal((await req('/api/reports',{targetType:'group',targetId:group.data.groupId,reason:'harassment'},b.cookie)).status,400);
 await req('/api/reports',{targetType:'post',targetId:pid,reason:'harassment'},b.cookie);
 sql(`UPDATE users SET role='administrator' WHERE user_id IN (${admin.data.userId},${independent.data.userId})`);
 const queue=(await req('/api/moderation/reports',null,admin.cookie)).data.items;const report=queue.find(x=>x.target_type==='post'&&x.target_id===pid),messageReport=queue.find(x=>x.target_type==='message'&&x.target_id===msg.data.messageId);assert.equal(messageReport.target_body,'A reported message');
 assert.equal((await req('/api/moderation/reports/'+report.report_id+'/review',{action:'remove'},admin.cookie)).status,400);
 assert.equal((await req('/api/moderation/reports/'+report.report_id+'/review',{action:'remove',note:'Removed for local safety verification.'},admin.cookie)).status,200);
 const decision=(await req('/api/me/safety',null,a.cookie)).data.decisions[0];assert.ok(decision.reason);assert.equal((await req('/api/me/requests',{kind:'appeal',decisionId:decision.decision_id,details:'I request another human review.'},b.cookie)).status,400);
 const appeal=await req('/api/me/requests',{kind:'appeal',decisionId:decision.decision_id,details:'I request another human review.'},a.cookie);assert.equal(appeal.status,201);
 assert.equal((await req('/api/moderation/requests',null,b.cookie)).status,403);
 assert.equal((await req('/api/moderation/requests/'+appeal.data.requestId,{response:'Review complete.',restore:true},admin.cookie)).status,403);
 assert.equal((await req('/api/moderation/requests/'+appeal.data.requestId,{response:'Appeal accepted after independent review.',restore:true},independent.cookie)).status,200);
 assert.equal((await req('/api/feed?postId='+pid,null,a.cookie)).data.items.length,1);
 assert.equal((await req('/api/me/safety',null,b.cookie)).data.requests.length,0);
 assert.throws(()=>db.exec("UPDATE safety_audit SET reason='changed'"),/append-only/);
 assert.equal((await req('/api/moderation/reports/'+messageReport.report_id+'/review',{action:'remove',note:'Removed after local verification.'},admin.cookie)).status,200);
 assert.equal((await req('/api/messages/'+conversation.data.conversation_id,null,b.cookie)).data.items.length,0);
 await req('/api/members/'+uid+'/block',{},b.cookie);assert.equal((await req('/api/profiles/'+uid,null,b.cookie)).status,404);assert.equal((await req('/api/global-connect/profile/'+uid,{},b.cookie)).status,400);
 assert.equal((await req('/api/me',null,'gc_session=%ZZ')).status,401);
 assert.equal((await req('/api/me/profile',{bio:'hello'},a.cookie,'PATCH',{'Sec-Fetch-Site':'cross-site'})).status,403);
 assert.equal((await req('/api/me/profile',{description:'a'.repeat(140000)},a.cookie,'PATCH')).status,413);
 assert.equal((await req('/api/media/1')).status,404);


 // Calling stays disabled even if old relay secrets remain configured.
 env.CALL_TURN_URLS='turn:relay.example.invalid';env.CALL_TURN_SECRET='disposable-test-secret';
 assert.equal((await req('/api/calls/config')).status,401);
 const callConfig=await req('/api/calls/config',null,a.cookie);
 assert.equal(callConfig.status,200);assert.equal(callConfig.data.enabled,false);
 assert.equal(callConfig.data.iceServers,undefined);
 assert.deepEqual((await req('/api/calls',null,a.cookie)).data.items,[]);
 assert.equal((await req('/api/calls',{conversationId:1,mode:'voice',offer:'v=0 m=audio'},a.cookie)).status,410);
 assert.equal((await req('/api/calls/11111111-1111-1111-1111-111111111111',null,a.cookie)).status,410);
 assert.equal((await req('/api/calls/11111111-1111-1111-1111-111111111111',{action:'accept',answer:'v=0 m=audio'},a.cookie)).status,410);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM network_calls').get().n,0);
 const health=await worker.fetch(new Request('https://example.invalid/api/health'),env);
 assert.match(health.headers.get('Permissions-Policy'),/camera=\(\), microphone=\(\)/);
 // International Space names must remain reachable through their encoded links.
 for(const name of ['基督徒团契','مجتمع المؤمنين','विश्वास संगति']){
  const created=await req('/api/spaces',{name,category:'ministry',description:'Christian fellowship across the nations.'},a.cookie);
  assert.equal(created.status,201,JSON.stringify(created));
  const detail=await req('/api/spaces/'+encodeURIComponent(created.data.slug));
  assert.equal(detail.status,200,JSON.stringify(detail));assert.equal(detail.data.space.name,name);
 }
 assert.equal((await req('/api/spaces/%ZZ')).status,400);
 assert.equal((await req('/api/spaces/a%2Fb')).status,400);
 // Never silently shorten an email into another account's identifier.
 const longEmail='a'.repeat(149)+'@example.org';
 assert.equal((await req('/api/auth/register',{email:longEmail,password:'TestingAudit8825',fullName:'Long Email',ageConfirmed:true,standardsAccepted:true})).status,400);
 assert.equal((await req('/api/auth/login',{email:longEmail,password:'TestingAudit8825'})).status,401);
 }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
