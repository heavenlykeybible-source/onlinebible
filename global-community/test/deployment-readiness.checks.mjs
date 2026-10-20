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
test('both AI interfaces use the authenticated community endpoint',()=>{
 for(const source of [app,readFileSync(new URL('../public/heavenly-key-assistant.js',import.meta.url),'utf8')]){
  assert.ok(source.includes('/api/community-ai'));
  assert.ok(!source.includes('/v1/assistant'));
 }
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
