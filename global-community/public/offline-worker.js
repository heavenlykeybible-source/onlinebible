/* Public offline reading only. Never store sessions, private feeds or API responses. */
const VERSION='hk-community-public-v2';
const PUBLIC=new Set(['/','/index.html','/offline.html']);
const ASSETS=['/','/index.html','/offline.html','/styles.css','/community-maturity.css','/community-reference.css','/royal-community.css','/community-app-promo.css','/heavenly-key-assistant.css','/official-community-feed.css','/clean-community.css'];
const eligible=(req,url)=>req.method==='GET'&&url.origin===self.location.origin&&!url.search&&
 !req.headers.has('authorization')&&!req.headers.has('range')&&req.credentials!=='include'&&
 !/(?:\/api\/|\/admin|\/account|\/profile|\/messages|\/login|\/auth|\/private)/i.test(url.pathname);
const safe=res=>res.ok&&res.type==='basic'&&!res.headers.has('set-cookie')&&!/private|no-store/i.test(res.headers.get('cache-control')||'');
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(VERSION);
 await Promise.allSettled(ASSETS.map(async url=>{const res=await fetch(url,{credentials:'omit'});if(safe(res))await cache.put(url,res)}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('hk-community-public-')&&key!==VERSION)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(!eligible(req,url))return;
 if(req.mode==='navigate'&&!PUBLIC.has(url.pathname))return;
 if(req.mode!=='navigate'&&!/\.(?:css|js|png|svg|webp|jpg|jpeg|woff2?|ico)$/i.test(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  if(req.mode!=='navigate'){const old=await cache.match(req);if(old)return old;}
  try{const res=await fetch(req);if(safe(res))event.waitUntil(cache.put(req,res.clone()));return res;}
  catch{return (await cache.match(req))||(req.mode==='navigate'?await cache.match('/offline.html'):null)||Response.error();}
 })());
});
