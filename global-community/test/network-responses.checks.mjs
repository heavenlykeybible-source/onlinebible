import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const apiSource=source.slice(source.indexOf('async function api('),source.indexOf('const dateTime='));
test('Network responses cannot falsely report a successful save; writes are not retried',async()=>{
 let response,calls=0;
 const api=vm.runInNewContext(apiSource+'\napi;',{
  AbortController,setTimeout,clearTimeout,
  fetch:async()=>{calls++;if(response instanceof Error)throw response;return response;}
 });
 response=new Response('<html>Gateway error</html>',{status:200});
 await assert.rejects(api('/api/posts','POST',{}),/incomplete response/);assert.equal(calls,1);
 for(const value of [null,[],true,'ok']){response=Response.json(value);await assert.rejects(api('/api/posts','POST',{}),/invalid response/);}
 response=Response.json({error:{message:'Please sign in.'}},{status:401});
 await assert.rejects(api('/api/me'),/Please sign in/);
 response=new Error('offline');await assert.rejects(api('/api/feed'),/Network unavailable/);
 response=Response.json({ok:true});assert.equal((await api('/api/posts','POST',{})).ok,true);
});
test('Forms detect text direction and announce status messages accessibly',()=>{
 const start=source.indexOf('function field('),end=source.indexOf('function requireSignIn(',start);
 const el=(tag,text)=>({tag,text,children:[],append(...nodes){this.children.push(...nodes);}});
 const field=vm.runInNewContext(source.slice(start,end)+'\nfield;',{el});
 const form=el('form');
 assert.equal(field(form,'Name','name').dir,'auto');
 assert.equal(field(form,'Message','body','textarea').dir,'auto');
 assert.equal(field(form,'Email','email','email').dir,undefined);
 const statusSource=source.slice(source.indexOf('const status='),source.indexOf('let session='));
 const status=vm.runInNewContext(statusSource+'\nstatus;');
 const attributes={},node={setAttribute:(k,v)=>attributes[k]=v};
 status(node,'Saved.');assert.equal(node.textContent,'Saved.');
 assert.equal(attributes.role,'status');assert.equal(attributes['aria-live'],'polite');
});
