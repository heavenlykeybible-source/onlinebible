import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const helper=app.slice(app.indexOf('async function api('),app.indexOf('const dateTime='));
function client(response){
 return vm.runInNewContext(helper+'\napi;',{
  fetch:async()=>response,
  AbortController,
  setTimeout,
  clearTimeout
 });
}
test('HTML fallback and invalid JSON cannot appear as a successful API call',async()=>{
 for(const response of [
  {ok:true,status:200,json:async()=>{throw Error('HTML instead of JSON');}},
  {ok:true,status:200,json:async()=>null},
  {ok:true,status:200,json:async()=>[]}
 ])await assert.rejects(client(response)('/api/feed'),/invalid response/);
});
test('API responses preserve authentication errors and valid results',async()=>{
 await assert.rejects(client({ok:false,status:401,json:async()=>({error:{message:'Please sign in.'}})})('/api/me'),/Please sign in/);
 const result=await client({ok:true,status:200,json:async()=>({items:[]})})('/api/feed');
 assert.equal(result.items.length,0);
});

test('chat enhancement notifies only new incoming messages and never replaces the messenger',()=>{
 const messages=[],notices=[];let changed;
 const bubble=(id,received=true)=>({dataset:{messageId:String(id)},classList:{contains:name=>received&&name==='received'}});
 const history={dataset:{rendered:'true'},querySelectorAll:()=>messages};
 const root={querySelectorAll:()=>[history]};
 const document={
  getElementById:()=>root,querySelector:()=>null,
  body:{dataset:{page:'messages'},append:node=>notices.push(node)},
  createElement:()=>({setAttribute(){},remove(){}})
 };
 messages.push(bubble(10));
 vm.runInNewContext(readFileSync(new URL('../public/community-live-chat.js',import.meta.url),'utf8'),{
  document,window:{addEventListener(){}},
  MutationObserver:class{constructor(callback){changed=callback;}observe(){}disconnect(){}},
  queueMicrotask:callback=>callback(),setTimeout:()=>1,clearTimeout(){}
 });
 assert.equal(notices.length,0);
 messages.push(bubble(11,false));changed();assert.equal(notices.length,0);
 messages.push(bubble(12));changed();assert.equal(notices.length,1);
 messages.splice(0,messages.length,bubble(10));changed();
 messages.push(bubble(11,false),bubble(12));changed();assert.equal(notices.length,1);
});

test('a malformed timestamp does not prevent messages from rendering',()=>{
 const dateCode=app.slice(app.indexOf('const dateTime='),app.indexOf('const status='));
 const renderCode=app.slice(app.indexOf('function renderThread('),app.indexOf('async function mountSalvation('));
 class Node{
  constructor(tag,text){this.tag=tag;this.textContent=text||'';this.dataset={};this.children=[];this.scrollHeight=100;this.scrollTop=0;this.clientHeight=100;}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(){this.children=[];}
  setAttribute(){}
  addEventListener(){}
 }
 const history=new Node('div'),latest={hidden:true};
 const render=vm.runInNewContext(dateCode+renderCode+'\nrenderThread;',{
  activeConversation:7,threadHost:{querySelector:selector=>selector==='.chat-history'?history:latest},
  chatQuery:'',chatBodies:new Map([[7,[{message_id:1,sender_user_id:1,body:'Retained message',created_at:'invalid'}]]]),
  session:{user:{userId:1}},el:(tag,text)=>new Node(tag,text),reportPost(){}
 });
 render(7);
 assert.ok(history.children.some(node=>node.children.some(child=>child.textContent==='Retained message')));
});


test('messaging layout has viewport-height fallbacks for older mobile browsers',()=>{
 const css=readFileSync(new URL('../public/messaging-theme.css',import.meta.url),'utf8');
 assert.match(css,/height:calc\(100vh - 180px\);\s*height:calc\(100dvh - 180px\)/);
 assert.match(css,/height:calc\(100vh - 190px - env\(safe-area-inset-bottom\)\);\s*height:calc\(100dvh - 190px - env\(safe-area-inset-bottom\)\)/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/focus-visible/);
});
