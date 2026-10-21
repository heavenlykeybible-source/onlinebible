import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../src/rate-limit.ts',import.meta.url),'utf8'));
const {rate}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('Rate limits expire at a fixed deadline, hide identifiers and recover malformed state',async()=>{
 const original=Date.now,values=new Map(),writes=[];let clock=1000000;Date.now=()=>clock;
 const env={SESSIONS:{get:async k=>values.get(k)||null,put:async(k,v,options)=>{values.set(k,v);writes.push({k,v,options});}}};
 try{
  assert.equal(await rate(env,'login:private@example.org',2,900),true);
  clock+=300000;assert.equal(await rate(env,'login:private@example.org',2,900),true);
  assert.equal(writes[1].options.expirationTtl,600);
  assert.equal(JSON.parse(writes[1].v).expiresAt,1900000);
  assert.ok(!writes[0].k.includes('private@example.org'));
  assert.equal(await rate(env,'login:private@example.org',2,900),false);
  assert.equal(writes.length,2);
  clock=1900000;assert.equal(await rate(env,'login:private@example.org',2,900),true);
  values.set(writes[0].k,'broken');assert.equal(await rate(env,'login:private@example.org',2,900),true);
 }finally{Date.now=original;}
});
