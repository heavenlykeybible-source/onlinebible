import {test} from 'node:test';
import assert from 'node:assert/strict';
import {communityFixture} from './helpers/worker-fixture.mjs';

test('Member and owner journeys: registration, Space page, private group, posts, comments, messages and staff controls',async()=>{
 const f=await communityFixture(),req=f.request;
 const expect=(r,status)=>{assert.equal(r.status,status,JSON.stringify(r.data));return r.data;};
 try{
 const signup=(email,name)=>({email,fullName:name,displayName:name,password:'AuditOnlyPassphrase22',ageConfirmed:true,standardsAccepted:true});
 const member=await req('/api/auth/register',signup('member@example.invalid','Audit Member'));
 const friend=await req('/api/auth/register',signup('friend@example.invalid','Audit Friend'));
 const stranger=await req('/api/auth/register',signup('stranger@example.invalid','Audit Stranger'));
 const owner=await req('/api/auth/register',signup('owner@example.invalid','Audit Owner'));
 for(const a of [member,friend,stranger,owner])expect(a,201);
 const a=member.data.userId,b=friend.data.userId;
 assert.match(member.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
 expect(await req('/api/auth/register',signup('member@example.invalid','Duplicate')),409);
 const logged=await req('/api/auth/login',{email:'member@example.invalid',password:'AuditOnlyPassphrase22'});expect(logged,200);
 expect(await req('/api/auth/login',{email:'member@example.invalid',password:'Wrong passphrase'}),401);
 expect(await req('/api/me',null,logged.cookie),200);
 console.log('AUDIT PASS: registration, duplicate prevention, valid/invalid login and secure cookie flags');
 const space=expect(await req('/api/spaces',{name:'Audit Global Ministry',description:'Christ-centered encouragement across nations.',category:'ministry'},member.cookie),201);
 const page=expect(await req('/api/spaces/'+encodeURIComponent(space.slug),null,member.cookie),200).space;
 assert.equal(page.canManage,true);assert.equal(expect(await req('/api/spaces/'+space.slug,null,stranger.cookie),200).space.canManage,false);
 const presentation={postFormat:'article',title:'Welcome to fellowship',body:'Let us encourage one another and grow in Christ.'};
 const spost=expect(await req('/api/posts',{...presentation,authorSpaceId:space.spaceId},member.cookie),201);
 assert.notEqual((await req('/api/posts',{...presentation,authorSpaceId:space.spaceId},stranger.cookie)).status,201);
 assert.equal(expect(await req('/api/feed?spaceId='+space.spaceId),200).items[0].post_id,spost.postId);
 console.log('AUDIT PASS: Space public page, owner publishing and prevention of Space impersonation');
 const group=expect(await req('/api/groups',{name:'Audit Fellowship',groupType:'fellowship',christianPurpose:'Encourage believers through prayer and Bible study.',visibility:'private',joinApproval:true},member.cookie),201);
 const gid=group.groupId;
 expect(await req('/api/groups/'+gid+'/join',{},friend.cookie),200);
 const gp=expect(await req('/api/posts',{...presentation,groupId:gid},member.cookie),201);
 assert.equal(expect(await req('/api/feed?groupId='+gid,null,friend.cookie),200).items.length,0);
 assert.notEqual((await req('/api/posts',{...presentation,groupId:gid},friend.cookie)).status,201);
 assert.notEqual((await req('/api/groups/'+gid+'/requests/'+b,{decision:'accept'},stranger.cookie)).status,200);
 expect(await req('/api/groups/'+gid+'/requests/'+b,{decision:'accept'},member.cookie),200);
 assert.ok(expect(await req('/api/feed?groupId='+gid,null,friend.cookie),200).items.some(p=>p.post_id===gp.postId));
 expect(await req('/api/posts',{...presentation,groupId:gid},friend.cookie),201);
 assert.notEqual((await req('/api/groups/'+gid,{name:'Hijacked group'},stranger.cookie,'PATCH')).status,200);
 console.log('AUDIT PASS: private group creation, join approval, content privacy, member posting and manager boundary');
 const post=expect(await req('/api/posts',presentation,member.cookie),201);
 const comment=expect(await req('/api/posts/'+post.postId+'/comments',{body:'Thank you for this encouragement.'},friend.cookie),201);
 assert.ok(comment);assert.equal(expect(await req('/api/posts/'+post.postId+'/comments'),200).items.length,1);
 assert.notEqual((await req('/api/posts/'+gp.postId+'/comments',{body:'Uninvited comment'},stranger.cookie)).status,201);
 expect(await req('/api/posts/'+post.postId,{...presentation,body:'Updated encouragement in Christ.'},member.cookie,'PATCH'),200);
 expect(await req('/api/posts/'+post.postId,presentation,stranger.cookie,'PATCH'),403);
 console.log('AUDIT PASS: public post, comment, edit ownership and private-group comment access');
 assert.notEqual((await req('/api/messages/requests',{recipientUserId:b},member.cookie)).status,201);
 expect(await req('/api/global-connect/profile/'+a,{},friend.cookie),200);
 const chat=expect(await req('/api/messages/requests',{recipientUserId:b},member.cookie),201),cid=chat.conversation_id;
 assert.notEqual((await req('/api/messages/'+cid,{body:'Too early'},member.cookie)).status,201);
 expect(await req('/api/messages/'+cid+'/decision',{decision:'accept'},member.cookie),403);
 expect(await req('/api/messages/'+cid+'/decision',{decision:'accept'},friend.cookie),200);
 const message={body:'Peace to you · مرحبا · 敬拜',clientRequestId:'bd96dd2e-10b6-46c9-aa42-3ecc3c3cb281'};
 const sent=expect(await req('/api/messages/'+cid,message,member.cookie),201);
 assert.equal(expect(await req('/api/messages/'+cid,message,member.cookie),201).messageId,sent.messageId);
 assert.equal(expect(await req('/api/messages/'+cid,null,friend.cookie),200).items.length,1);
 assert.notEqual((await req('/api/messages/'+cid,null,stranger.cookie)).status,200);
 expect(await req('/api/members/'+a+'/block',{},friend.cookie),200);
 assert.notEqual((await req('/api/messages/'+cid,{body:'Blocked contact'},member.cookie)).status,201);
 console.log('AUDIT PASS: messaging consent, recipient-only acceptance, delivery, retry deduplication, outsider denial and blocking');
 expect(await req('/api/admin/adverts',null,member.cookie),403);
 expect(await req('/api/moderation/reports',null,member.cookie),403);
 f.db.prepare("UPDATE users SET role='owner' WHERE user_id=?").run(owner.data.userId);
 expect(await req('/api/admin/adverts',null,owner.cookie),200);
 expect(await req('/api/moderation/reports',null,owner.cookie),200);
 f.db.prepare("UPDATE users SET status='restricted' WHERE user_id=?").run(a);
 expect(await req('/api/posts',presentation,member.cookie),403);
 expect(await req('/api/me/safety',null,member.cookie),200);
 expect(await req('/api/calls',{},stranger.cookie),410);
 expect(await req('/api/me/profile',{bio:'Untrusted change'},stranger.cookie,'PATCH',{Origin:'https://attacker.example'}),403);
 expect(await req('/api/auth/logout',{},logged.cookie),200);expect(await req('/api/me',null,logged.cookie),401);
 console.log('AUDIT PASS: member/admin isolation, current role/status enforcement, appeals access, text-only calls, CSRF and logout');
 }finally{f.close();}
});


test('Space and group ownership are atomic when owner membership storage fails',async()=>{
 const f=await communityFixture();try{
  const a=await f.request('/api/auth/register',{email:'fault@example.invalid',fullName:'Fault Audit',password:'IsolatedAudit22',ageConfirmed:true,standardsAccepted:true});
  assert.equal(a.status,201);
  for(const kind of ['space','group']){
   f.db.exec(`CREATE TRIGGER reject_${kind}_owner BEFORE INSERT ON ${kind}_members BEGIN SELECT RAISE(ABORT,'Simulated owner storage failure'); END;`);
   const data=kind==='space'?{name:'Fault space',description:'Christ centered community test.',category:'ministry'}:{name:'Fault group',christianPurpose:'Christ centered community test.',groupType:'fellowship'};
   assert.notEqual((await f.request('/api/'+kind+'s',data,a.cookie)).status,201);
   assert.equal(f.db.prepare('SELECT COUNT(*) n FROM '+kind+'s').get().n,0,'Failed owner creation must leave no orphan '+kind);
   f.db.exec('DROP TRIGGER reject_'+kind+'_owner');
   assert.equal((await f.request('/api/'+kind+'s',data,a.cookie)).status,201,'Retry must create the complete '+kind);
   assert.equal(f.db.prepare('SELECT COUNT(*) n FROM '+kind+'_members').get().n,1);
  }
 }finally{f.close();}
});
