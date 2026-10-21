import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {stripTypeScriptTypes} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
const source=stripTypeScriptTypes(readFileSync(new URL('../src/ministry-editorial.ts',import.meta.url),'utf8'));
const editorial=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('Editorial publish, reply and edit roll back if their audit cannot be recorded',async()=>{
 const db=new DatabaseSync(':memory:');let failAudit=false;
 try{
  for(const file of readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  db.exec("INSERT INTO users(user_id,email,password_hash,password_salt,role) VALUES(1,'admin@example.invalid','unused','unused','administrator'),(2,'member@example.invalid','unused','unused','member')");
  const statement=(sql,params=[])=>({bind(...values){return statement(sql,values);},async first(){return db.prepare(sql).get(...params)||null;},async all(){return {results:db.prepare(sql).all(...params)};},async run(){if(failAudit&&sql.includes('INSERT INTO ministry_editorial_audit'))throw Error('Test audit unavailable');const r=db.prepare(sql).run(...params);return {meta:{last_row_id:Number(r.lastInsertRowid),changes:Number(r.changes)}};}});
  const env={DB:{prepare:sql=>statement(sql),async batch(queries){db.exec('BEGIN');try{const results=[];for(const q of queries)results.push(await q.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}}};
  const input={profileId:'heavenly-key-evangelistic-movement',title:'A ministry message',body:'Faithful Christian fellowship.'};
  failAudit=true;await assert.rejects(editorial.publish(env,input,1),/audit unavailable/);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM ministry_editorial_posts').get().n,0);
  failAudit=false;const published=await editorial.publish(env,input,1);assert.ok(published.id);
  failAudit=true;await assert.rejects(editorial.changePost(env,published.id,1,'edit',{title:'Changed title',body:'Changed teaching text.'}),/audit unavailable/);
  assert.equal(db.prepare('SELECT title FROM ministry_editorial_posts WHERE post_id=?').get(published.id).title,input.title);
  await assert.rejects(editorial.changePost(env,published.id,1,'remove',{}),/audit unavailable/);
  assert.equal(db.prepare('SELECT status FROM ministry_editorial_posts WHERE post_id=?').get(published.id).status,'published');
  db.prepare("INSERT INTO ministry_editorial_messages(profile_id,member_user_id,sender_kind,body) VALUES('hkem-editorial-01',2,'member','Please share an encouragement.')").run();
  await assert.rejects(editorial.reply(env,{profileId:'hkem-editorial-01',memberUserId:2,body:'Keep trusting Christ.'},1),/audit unavailable/);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM ministry_editorial_messages WHERE sender_kind='ministry'").get().n,0);
  failAudit=false;await editorial.changePost(env,published.id,1,'edit',{title:'Reviewed message',body:'An encouragement from Scripture.'});
  assert.equal(db.prepare("SELECT COUNT(*) n FROM ministry_editorial_audit").get().n,2);
  await editorial.reply(env,{profileId:'hkem-editorial-01',memberUserId:2,body:'Keep trusting Christ.'},1);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM ministry_editorial_messages WHERE sender_kind='ministry'").get().n,1);
  await editorial.changePost(env,published.id,1,'remove',{});
  assert.equal(db.prepare('SELECT status FROM ministry_editorial_posts WHERE post_id=?').get(published.id).status,'removed');
  const second=await editorial.publish(env,input,1);
  assert.equal(db.prepare("SELECT subject_id FROM ministry_editorial_audit WHERE action='publish' ORDER BY audit_id DESC LIMIT 1").get().subject_id,second.id);
 }finally{db.close();}
});
