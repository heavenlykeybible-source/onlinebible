import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('./worker.mjs',import.meta.url),'utf8');
const configured=source.replaceAll('upstream: "", enabled: false','upstream: "https://verified-upstream.example", enabled: true');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(configured).toString('base64'))).default;
const unconfigured=(await import('./worker.mjs')).default;
for(const host of ['studio','control','admin']){
 test(host+' reaches the application login instead of an outer 403',async()=>{
  const previous=globalThis.fetch;let forwarded;
  globalThis.fetch=async req=>{forwarded=req;return new Response('<form><input type="password"><button>Sign in</button></form>',{headers:{'content-type':'text/html'}})};
  try{const result=await worker.fetch(new Request('https://'+host+'.heavenlykey.org/login?next=studio'));
   assert.equal(result.status,200);assert.match(await result.text(),/type="password"/);
   assert.equal(forwarded.url,'https://verified-upstream.example/login?next=studio');
  }finally{globalThis.fetch=previous;}
 });
}
test('application authorization remains enforced',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=async()=>new Response('Administrator login required',{status:401});
 try{const result=await worker.fetch(new Request('https://control.heavenlykey.org/api/status'));assert.equal(result.status,401);}
 finally{globalThis.fetch=previous;}
});
test('missing configuration is not replaced with an invented upstream',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Must not call upstream')};
 try{const result=await unconfigured.fetch(new Request('https://control.heavenlykey.org/'));assert.equal(result.status,502);}
 finally{globalThis.fetch=previous;}
});
test('apex and unrecognized hosts are not routed',async()=>{
 for(const host of ['heavenlykey.org','www.heavenlykey.org','unknown.heavenlykey.org']){
 assert.equal((await worker.fetch(new Request('https://'+host+'/'))).status,404);
 }
});
