import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=path=>readFileSync(new URL(path,root),'utf8');
function registry(){const context={URL};vm.runInNewContext(read('heavenly-key-website/js/app-catalog.js'),context);vm.runInNewContext(read('heavenly-key-website/js/app-session-state.js'),context);return context}
test('One foreground app; switching and minimizing retain radio and other sessions',()=>{
 const {HKAppSessions,HKApps}=registry(),state=new HKAppSessions(HKApps.apps.map(app=>app.id));
 state.open('radio');state.open('bible');assert.equal(state.active,'bible');assert.equal(state.opened.has('radio'),true);assert.deepEqual(Array.from(state.snapshot().minimized),['radio']);
 state.open('radio');assert.equal(state.opened.size,2);state.minimize();assert.equal(state.active,null);assert.equal(state.opened.size,2);
 state.close('radio');assert.equal(state.opened.has('radio'),false);assert.equal(state.opened.has('bible'),true);assert.throws(()=>state.open('untrusted'));
});
test('Every app and device has a matching, unique installation destination and manifest',()=>{
 const {HKApps:C}=registry();assert.equal(C.apps.length,10);assert.equal(C.apps.filter(a=>a.id!=='all').length,9);const seen=new Set();
 for(const app of C.apps){
  assert.ok(!['audio','studio','control'].includes(app.id));
  const manifest=JSON.parse(read('heavenly-key-website/pages/apps/'+app.id+'/manifest.webmanifest'));
  assert.equal(manifest.name,app.name);assert.equal(manifest.id,'/pages/apps/'+app.id+'/');assert.equal(manifest.start_url,manifest.id);assert.equal(manifest.scope,manifest.id);
  assert.ok(existsSync(new URL('heavenly-key-website/pages/apps/'+app.id+'/index.html',root)));
  assert.equal(new URL(C.shareURL(app.id)).searchParams.get('app'),app.id);
  for(const device of C.devices){const url=new URL(C.installURL(app.id,device.id));assert.equal(url.origin,'https://heavenlykey.org');assert.equal(url.pathname,manifest.start_url);assert.equal(url.searchParams.get('install'),device.id);assert.equal(seen.has(url.href),false);seen.add(url.href)}
 }
 assert.equal(seen.size,70);assert.equal(C.get('walk').name,'My Walk with God Calculator');assert.throws(()=>C.installURL('all','invalid'));
});
test('Embedding is limited to the ministry; private API/admin responses stay unframeable',()=>{
 const main=read('heavenly-key-website/_headers');assert.ok(main.includes("frame-ancestors 'self'"));assert.ok(main.includes("frame-src 'self' https://app.heavenlykey.org https://global.heavenlykey.org"));assert.ok(main.includes("/pages/admin*\n  X-Frame-Options: DENY"));
 for(const path of ['heavenly-key-app/public/_headers','global-community/public/_headers']){const headers=read(path);assert.ok(headers.includes("frame-ancestors 'self' https://heavenlykey.org https://www.heavenlykey.org"));assert.ok(headers.includes("/api/*\n  X-Frame-Options: DENY"));assert.ok(!headers.includes('frame-ancestors *'));}
});
test('Launcher worker does not delete existing caches, activate itself or cache remote member data',()=>{
 const source=read('heavenly-key-website/pages/apps/app-shell-sw.js');const handlers={};const ctx={URL,Set,self:{location:{href:'https://heavenlykey.org/pages/apps/app-shell-sw.js?app=walk',origin:'https://heavenlykey.org'},addEventListener:(name,fn)=>handlers[name]=fn}};vm.runInNewContext(source,ctx);
 let intercepts=0;const event=url=>({request:new Request(url),respondWith:()=>intercepts++});
 handlers.fetch(event('https://global.heavenlykey.org/api/messages'));handlers.fetch(event('https://heavenlykey.org/api/auth/me'));handlers.fetch(event('https://heavenlykey.org/pages/apps/walk/?account=private'));assert.equal(intercepts,0);
 assert.ok(!source.includes('caches.delete'));assert.ok(!source.includes('skipWaiting'));assert.ok(!source.includes('clients.claim'));
});
test('Versioned public launcher scripts fall back offline without intercepting private query strings',async()=>{
 const callbacks={},cached=[];const context={URL,Set,Response,self:{location:{href:'https://heavenlykey.org/pages/apps/app-shell-sw.js?app=walk',origin:'https://heavenlykey.org'},addEventListener:(key,fn)=>callbacks[key]=fn},fetch:async()=>{throw Error('offline')},caches:{match:async key=>{cached.push(key);return new Response('saved shell')}}};
 vm.runInNewContext(read('heavenly-key-website/pages/apps/app-shell-sw.js'),context);
 for(const path of ['/js/app-hub.js?v=20261019','/css/app-hub.css?v=app-hub-20261019','/pages/apps/walk/?install=iphone']){let task;callbacks.fetch({request:new Request('https://heavenlykey.org'+path),respondWith:value=>task=value});assert.ok(task);assert.equal(await(await task).text(),'saved shell');}
 assert.deepEqual(cached,['/js/app-hub.js','/css/app-hub.css','/pages/apps/walk/']);let intercepted=false;callbacks.fetch({request:new Request('https://heavenlykey.org/js/app-hub.js?token=secret'),respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
test('Blog bridge uses a fixed public feed and rejects malformed, oversized and failed upstreams',async()=>{
 const {handleAppBlog}=await import('../src/routes/app-blog.ts');let destination;
 const valid=async(url,options)=>{destination=url;assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');return Response.json({feed:{entry:[{title:{$t:'Ministry message'},content:{$t:'<p>Hello</p>'},published:{$t:'2026-10-19'}}]}})};
 const response=await handleAppBlog(valid);assert.equal(response.status,200);assert.equal(destination,'https://blog.heavenlykey.org/feeds/posts/default?alt=json&max-results=12');assert.equal((await response.json()).entries[0].title,'Ministry message');
 for(const upstream of [async()=>Response.json({wrong:true}),async()=>new Response('x',{status:503}),async()=>new Response('x'.repeat(1500001))]){const fail=await handleAppBlog(upstream);assert.equal(fail.status,502);assert.equal(fail.headers.get('cache-control'),'no-store');}
});
