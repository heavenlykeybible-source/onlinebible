import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const get=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('removed AI endpoint returns Gone before touching services',async()=>{
 const source=get('../src/index.ts');
 const start=source.indexOf('  const url=new URL(request.url),p=url.pathname,m=request.method;');
 const end=source.indexOf('  if(m==="OPTIONS")',start);
 const handler=vm.runInNewContext('(async function(request){'+source.slice(start,end)+'})',{
  URL,error:(message,status)=>({message,status})
 });
 for(const pathname of ['/api/community-ai','/api/ai/draft']){
  const result=await handler({url:'https://example.invalid'+pathname,method:'POST'});
  assert.equal(result.status,410);
 }
 assert.doesNotMatch(source,/communityAiDraft|validateAiDraftRequest/);
});
test('AI widgets cannot call providers, including the CMS widget',()=>{
 const cms=get('../public/cms-runtime-20261015.js'),assistant=get('../public/heavenly-key-assistant.js');
 assert.doesNotMatch(cms,/function assistant\(|\/v1\/assistant/);
 assert.doesNotMatch(assistant,/fetch\(|createElement|setInterval/);
});
