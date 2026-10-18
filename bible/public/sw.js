"use strict";
const SHELL = "hk-bible-shell-v6-20261018";
const SCRIPTURE = "hk-bible-kjv-ae1f46af-v1";
const PREFIX = new URL("./", self.location.href).pathname;
self.addEventListener("install", event => {
 event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(["./index.html","./style.css","./app.js","./study-tools.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./data/hymns.json"])).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => {
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith("hk-bible-shell-")&&key!==SHELL)await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener("fetch", event => {
 const url = new URL(event.request.url);
 if(event.request.method!=="GET"||url.origin!==self.location.origin||!url.pathname.startsWith(PREFIX))return;
 const isScripture = url.pathname.startsWith(PREFIX+"data/kjv/");
 const isShell = [PREFIX,PREFIX+"index.html",PREFIX+"style.css",PREFIX+"app.js",PREFIX+"study-tools.js",PREFIX+"manifest.webmanifest",PREFIX+"icon.svg",PREFIX+"icon-192.png",PREFIX+"icon-512.png",PREFIX+"data/hymns.json"].includes(url.pathname);
 if(!isScripture&&!isShell)return;
 if(event.request.headers?.has?.("Authorization"))return;
 if(url.search&&[...url.searchParams.keys()].some(key=>!["v","book","chapter"].includes(key)))return;
 event.respondWith((async()=>{
  const cache=await caches.open(isScripture?SCRIPTURE:SHELL);
  const cacheKey=isScripture?event.request:new URL(url.pathname,self.location.origin).href;
  const cached=await cache.match(cacheKey);
  // Immutable KJV books stay available without downloading them on every visit.
  if(isScripture&&cached)return cached;
  try{
   const response=await timedFetch(event.request,async response=>{await response.clone().arrayBuffer();return response;},isScripture?15000:5000);
   if(response.ok&&response.type!=="opaque"&&!/(?:private|no-store)/i.test(response.headers.get("Cache-Control")||""))await cache.put(cacheKey,response.clone());
   if(!response.ok&&cached)return cached;
   return response;
  }catch(error){
   const saved=cached||(event.request.mode==="navigate"?await cache.match(new URL("index.html",self.location.href).href):null);
   if(saved)return saved;throw error;
  }
 })());
});
async function timedFetch(input, read, timeout=30000) {
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
 try{return await read(await fetch(input,{signal:controller.signal}));}
 finally{clearTimeout(timer);}
}
let download = null;
self.addEventListener("message", event=>{
 if(["ACTIVATE_REVIEWED_SHELL","SKIP_WAITING"].includes(event.data?.type)){event.waitUntil(self.skipWaiting());return;}
 if(event.data?.type!=="SAVE_BIBLE_OFFLINE")return;
 const port=event.ports[0];
 if(download){port?.postMessage({type:"busy"});return;}
 download=(async()=>{
  try{
   const manifest=await timedFetch(new URL("data/kjv/manifest.json",self.location.href),async response=>{
    if(!response.ok)throw new Error("Manifest unavailable");
    return response.json();
   });
   if(manifest.translation!=="KJV"||manifest.books?.length!==66||manifest.totalVerses!==31102||new Set(manifest.books.map(book=>book.code)).size!==66)throw new Error("Invalid scripture manifest");
   const cache=await caches.open(SCRIPTURE);let count=0;
   for(const book of manifest.books){
    if(!/^[A-Z0-9]{3}$/.test(book.code)||!/^[a-f0-9]{64}$/.test(book.sha256))throw new Error("Invalid book metadata");
    const url=new URL("data/kjv/"+book.code+".json",self.location.href);
    const {fetched,buffer}=await timedFetch(url,async fetched=>{
     if(!fetched.ok)throw new Error("Book unavailable");
     return {fetched,buffer:await fetched.clone().arrayBuffer()};
    });
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buffer)),x=>x.toString(16).padStart(2,"0")).join("");
    if(hash!==book.sha256)throw new Error("Scripture checksum failed");
    await cache.put(url,fetched);port?.postMessage({type:"progress",count:++count,total:66});
   }
   await cache.put(new URL("data/kjv/manifest.json",self.location.href),new Response(JSON.stringify(manifest),{headers:{"Content-Type":"application/json"}}));
   port?.postMessage({type:"complete",count:66});
  }catch{port?.postMessage({type:"error",message:"Offline download could not finish. Check your connection and available storage, then try again."});}
 })().finally(()=>{download=null;});
 event.waitUntil(download);
});
