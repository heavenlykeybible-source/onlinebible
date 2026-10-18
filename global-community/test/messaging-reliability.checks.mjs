import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('Sign-in checks distinguish connection failure from signed-out state and ignore late responses',async()=>{
 const start=source.indexOf('let session='),end=source.indexOf('function renderAuth()',start),requests=[];let clears=0;
 const state=vm.runInNewContext(source.slice(start,end)+'\n({load:sessionLoad,get:()=>({session,problem:sessionProblem})});',{
  api:()=>new Promise((resolve,reject)=>requests.push({resolve,reject})),renderAuth:()=>{},clearPrivateChatState:()=>clears++,
  window:{dispatchEvent:()=>{}},CustomEvent:class{}
 });
 let check=state.load();requests[0].reject(Object.assign(Error('Temporary outage'),{status:503}));await check;
 assert.match(state.get().problem,/Unable to verify/);assert.equal(state.get().session,null);
 check=state.load();requests[1].reject(Object.assign(Error('Please sign in'),{status:401}));await check;
 assert.equal(state.get().problem,'');assert.equal(state.get().session,null);
 const older=state.load(),newer=state.load();
 requests[3].resolve({user:{userId:2}});await newer;
 requests[2].resolve({user:{userId:1}});await older;
 assert.equal(state.get().session.user.userId,2);
 assert.equal(clears,1);
 check=state.load();requests[4].reject(Object.assign(Error('Expired'),{status:401}));await check;
 assert.equal(clears,2);assert.equal(state.get().session,null);
});
test('Identity changes clear private drafts, history, retry keys and message polling',()=>{
 const start=source.indexOf('function clearPrivateChatState('),end=source.indexOf('const chatName=',start);
 const context={inboxRefreshGeneration:0,threadRefreshGeneration:0,messageTimer:12,activeConversation:9,inboxItems:[{conversation_id:9}],
  chatDrafts:new Map([[9,'unsent private draft']]),chatBodies:new Map([[9,['private history']]]),chatRetries:new Map([[9,'private key']]),
  clearInterval:id=>assert.equal(id,12)};
 vm.runInNewContext(source.slice(start,end)+'\nclearPrivateChatState();',context);
 assert.equal(context.activeConversation,null);assert.equal(context.messageTimer,null);
 assert.equal(context.inboxItems.length,0);
 for(const key of ['chatDrafts','chatBodies','chatRetries'])assert.equal(context[key].size,0);
});
test('Late chat refreshes cannot replace newer messages',async()=>{
 const start=source.indexOf('async function refreshThread('),end=source.indexOf('function renderThread(',start);
 const requests=[],history={dataset:{}},renders=[];
 const context={activeConversation:1,threadRefreshGeneration:0,sessionGeneration:1,session:{user:{userId:1}},chatBodies:new Map(),
  threadHost:{querySelector:()=>history},api:()=>new Promise(resolve=>requests.push(resolve)),
  renderThread:id=>renders.push(context.chatBodies.get(id)[0].body)};
 const refresh=vm.runInNewContext(source.slice(start,end)+'\nrefreshThread;',context);
 const older=refresh(),newer=refresh();
 requests[1]({items:[{message_id:2,body:'Newer'}]});await newer;
 requests[0]({items:[{message_id:1,body:'Older'}]});await older;
 assert.deepEqual(renders,['Newer']);
 const away=refresh();context.activeConversation=2;
 requests[2]({items:[{message_id:3,body:'Wrong conversation'}]});await away;
 assert.deepEqual(renders,['Newer']);
 const signedOut=refresh();context.sessionGeneration++;context.session=null;
 requests[3]({items:[{message_id:4,body:'Previous member private history'}]});await signedOut;
 assert.deepEqual(renders,['Newer']);
});

test('Inbox responses cannot cross sign-out, account switches or a replaced view, and older reads cannot win',async()=>{
 const start=source.indexOf('async function messageList('),end=source.indexOf('function renderInbox(',start),requests=[],renders=[];
 const context={sessionGeneration:1,session:{user:{userId:1}},page:'messages',inboxRefreshGeneration:0,
  inboxHost:{},inboxItems:[],activeConversation:null,api:()=>new Promise(resolve=>requests.push(resolve)),
  renderInbox:()=>renders.push(context.inboxItems[0]?.requester_name)};
 const list=vm.runInNewContext(source.slice(start,end)+'\nmessageList;',context);
 const older=list(),newer=list();requests[1]({items:[{requester_name:'Current'}]});await newer;
 requests[0]({items:[{requester_name:'Outdated'}]});await older;assert.deepEqual(renders,['Current']);
 const privateRead=list();context.sessionGeneration++;context.session=null;context.inboxItems=[];
 requests[2]({items:[{requester_name:'Signed-out private contact'}]});await privateRead;
 assert.equal(context.inboxItems.length,0);assert.deepEqual(renders,['Current']);
 context.session={user:{userId:2}};const switched=list();context.sessionGeneration++;
 requests[3]({items:[{requester_name:'Other account'}]});await switched;assert.equal(context.inboxItems.length,0);
 const detached=list();context.inboxHost={};requests[4]({items:[{requester_name:'Detached view'}]});await detached;
 assert.equal(context.inboxItems.length,0);
 const away=list();context.page='home';requests[5]({items:[{requester_name:'Closed inbox'}]});await away;
 assert.equal(context.inboxItems.length,0);
});

test('A delayed send cannot erase a new member draft or a newer retry key',async()=>{
 const start=source.indexOf("form.addEventListener('submit'",source.indexOf('async function openConversation(')),end=source.indexOf(' renderInbox();history.append',start);
 let submit,resolve;
 const context={form:{addEventListener:(_,fn)=>submit=fn},ta:{value:'Original draft',style:{}},send:{},st:{},
  id:7,sessionGeneration:1,session:{user:{userId:1}},threadHost:{},activeConversation:null,
  chatRetries:new Map(),chatDrafts:new Map([[7,'Original draft']]),crypto:{randomUUID:()=>'original-key'},status:()=>{},
  api:()=>new Promise(r=>resolve=r)};
 vm.runInNewContext(source.slice(start,end),context);
 let pending=submit({preventDefault(){}});context.sessionGeneration++;context.session={user:{userId:2}};
 context.chatDrafts.set(7,'New member private draft');context.chatRetries.set(7,{key:'new-member-key'});
 resolve({status:'sent'});await pending;
 assert.equal(context.chatDrafts.get(7),'New member private draft');assert.equal(context.chatRetries.get(7).key,'new-member-key');
 context.ta.value='Original draft';pending=submit({preventDefault(){}});
 context.chatDrafts.set(7,'New text in reopened chat');context.chatRetries.set(7,{key:'new-send-key'});
 resolve({status:'sent'});await pending;
 assert.equal(context.chatDrafts.get(7),'New text in reopened chat');assert.equal(context.chatRetries.get(7).key,'new-send-key');
});
