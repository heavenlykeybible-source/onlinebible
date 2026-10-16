import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handlePublicBlogFeed} from '../src/routes/public-blog-feed.ts';
const request=()=>new Request('https://heavenlykey.org/api/public/blog-feed');
const post=(href)=>({title:{$t:'Ministry message'},content:{$t:'<p>Message</p>'},link:[{rel:'alternate',href}]});
test('fixed public upstream; no user-supplied URL, credentials or arbitrary links',async()=>{
 let called;
 const response=await handlePublicBlogFeed(request(),async(url,options)=>{called={url,options};return Response.json({feed:{entry:[post('https://blog.heavenlykey.org/2026/message.html'),post('javascript:alert(1)'),post('https://attacker.example/')]}})});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.feed.entry.length,1);
 assert.equal(called.url,'https://blog.heavenlykey.org/feeds/posts/default?alt=json&max-results=5');assert.equal(called.options.redirect,'error');
 assert.match(response.headers.get('Cache-Control'),/max-age=300/);
});
test('upstream errors and malformed feeds produce recoverable 503',async()=>{
 for(const result of [new Response('offline',{status:500}),new Response('<html>error</html>'),Response.json({feed:{}})]){
  const response=await handlePublicBlogFeed(request(),async()=>result);assert.equal(response.status,503);assert.equal((await response.json()).feed,undefined);
 }
});
test('oversized responses are rejected',async()=>{
 const response=await handlePublicBlogFeed(request(),async()=>new Response('x'.repeat(524289)));assert.equal(response.status,503);
});
test('write methods cannot trigger upstream work',async()=>{
 const response=await handlePublicBlogFeed(new Request(request(),{method:'POST'}),async()=>{throw Error('Must not fetch')});assert.equal(response.status,405);
});
