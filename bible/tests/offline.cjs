const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict"),{webcrypto}=require("node:crypto");
async function run(tamper=false,stall=false,invalidManifest=false){
 const listeners={},stores=new Map(),messages=[];let online=true,revision="",activated=false,shellStall=false;
 const key=x=>typeof x==="string"?new URL(x,"https://example.test/bible/sw.js").href:x.url||x.href;
 const caches={keys:async()=>[...stores.keys()],delete:async k=>stores.delete(k),open:async name=>{
  if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);
  return{match:async x=>store.get(key(x))?.clone(),put:async(x,r)=>{store.set(key(x),r.clone());},addAll:async paths=>{for(const path of paths){const r=await fetcher(new URL(path,"https://example.test/bible/sw.js"));store.set(key(path),r);}}};
 }};
 const fetcher=async (input,options)=>{if(stall&&key(input).endsWith("/GEN.json"))return new Promise((_,reject)=>options.signal.addEventListener("abort",()=>reject(Error("Timed out")),{once:true}));if(shellStall&&key(input).endsWith("/index.html"))return new Response(new ReadableStream({start(controller){options.signal.addEventListener("abort",()=>controller.error(Error("Stalled shell")),{once:true});}}));if(!online)throw Error("Offline");const url=new URL(key(input));const path="bible/public"+url.pathname.replace(/^\/bible/,"");let text=fs.readFileSync(path,"utf8");if(path.endsWith("/index.html"))text+=revision;if(tamper&&path.endsWith("/GEN.json"))text=text.replace("In the beginning","Edited beginning");if(invalidManifest&&path.endsWith("manifest.json")){const manifest=JSON.parse(text);manifest.books[1]=manifest.books[0];text=JSON.stringify(manifest);}return new Response(text,{headers:{"Content-Type":path.endsWith(".json")?"application/json":"text/plain"}});};
 const self={location:{href:"https://example.test/bible/sw.js",origin:"https://example.test"},skipWaiting:async()=>{activated=true;},clients:{claim:async()=>{}},addEventListener:(name,handler)=>listeners[name]=handler};
 vm.runInNewContext(fs.readFileSync("bible/public/sw.js","utf8"),{self,caches,fetch:fetcher,URL,Response,crypto:webcrypto,AbortController,setTimeout:(fn,ms)=>setTimeout(fn,stall||shellStall?1:ms),clearTimeout});
 let pending;listeners.install({waitUntil:p=>pending=p});await pending;assert.equal(activated,true,"New public shell activates without a forced page reload");
 const oldShell=await caches.open("hk-bible-shell-old");await oldShell.put("old",new Response("old"));await caches.open("hk-bible-audio-downloads-v1");await caches.open("hk-bible-kjv-preserved-downloads");listeners.activate({waitUntil:p=>pending=p});await pending;assert(!stores.has("hk-bible-shell-old"));assert(stores.has("hk-bible-audio-downloads-v1"));assert(stores.has("hk-bible-kjv-preserved-downloads"));
 listeners.message({data:{type:"SAVE_BIBLE_OFFLINE"},ports:[{postMessage:m=>messages.push(m)}],waitUntil:p=>pending=p});await pending;
 if(tamper||stall||invalidManifest){assert.equal(messages.at(-1).type,"error");assert(!messages.some(m=>m.type==="complete"));tamper=false;stall=false;invalidManifest=false;
 listeners.message({data:{type:"SAVE_BIBLE_OFFLINE"},ports:[{postMessage:m=>messages.push(m)}],waitUntil:p=>pending=p});await pending;
 assert.equal(messages.at(-1).type,"complete","Failed download must allow retry");return;}
 assert.equal(messages.at(-1).type,"complete");assert.equal(messages.filter(m=>m.type==="progress").length,66);
 let responded;revision="NEW-PUBLISHED-SHELL";
 listeners.fetch({request:{url:"https://example.test/bible/index.html",method:"GET",mode:"navigate"},respondWith:p=>responded=p});assert((await(await responded).text()).includes(revision),"Published online updates must not be trapped behind an old shell cache");
 shellStall=true;responded=undefined;listeners.fetch({request:{url:"https://example.test/bible/index.html",method:"GET",mode:"navigate"},respondWith:p=>responded=p});assert((await(await responded).text()).includes(revision),"A stalled online shell must promptly fall back to the saved public app");shellStall=false;
 responded=undefined;listeners.fetch({request:{url:"https://example.test/bible/index.html?token=private",method:"GET",mode:"navigate"},respondWith:p=>responded=p});assert.equal(responded,undefined,"Never intercept token-bearing app URLs");
 online=false;
 listeners.fetch({request:{url:"https://example.test/bible/data/kjv/JOH.json",method:"GET"},respondWith:p=>responded=p});assert.equal(JSON.parse(await(await responded).text()).book,"John");
 responded=undefined;listeners.fetch({request:{url:"https://example.test/api/auth/profile",method:"GET"},respondWith:p=>responded=p});assert.equal(responded,undefined);
 responded=undefined;listeners.fetch({request:{url:"https://another.test/bible/app.js",method:"GET"},respondWith:p=>responded=p});assert.equal(responded,undefined);
 responded=undefined;listeners.fetch({request:{url:"https://example.test/bible/index.html",method:"GET",mode:"navigate"},respondWith:p=>responded=p});assert((await(await responded).text()).includes("HEAVENLY KEY BIBLE"));
}
(async()=>{await run();await run(true);await run(false,true);await run(false,false,true);console.log("PASS: 66-book offline download, checksum rejection, stalled-network recovery, duplicate-manifest rejection, offline chapter/shell recovery, fresh online releases, preserved downloaded books/audio and private API exclusion.");})().catch(e=>{console.error(e);process.exitCode=1;});
