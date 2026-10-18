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
 const context={messageTimer:12,activeConversation:9,inboxItems:[{conversation_id:9}],
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
 const context={activeConversation:1,threadRefreshGeneration:0,chatBodies:new Map(),
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
});
