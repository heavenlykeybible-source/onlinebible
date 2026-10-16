import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {publicRoute} from '../cms-public/worker.mjs';
import {assistantStream} from '../cms-public/assistant-stream.mjs';
globalThis.crypto??=webcrypto;
const encode=s=>new TextEncoder().encode(s),event=o=>'data: '+JSON.stringify(o)+'\r\n\r\n';
const token=(text,finishReason)=>({candidates:[{content:{parts:[{text}]},...(finishReason?{finishReason}:{})}]});
const env={GEMINI_API_KEY:'test-only-key',DB:{prepare(){return{bind(){return this;}};},async batch(){return[{results:[{count:1}]},{results:[{count:1}]}];}}};
const request=(body,origin='https://heavenlykey.org')=>new Request('https://cms.example/v1/assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
await test('real stream parser handles fragmented UTF-8/CRLF, hides thoughts, preserves answer',async()=>{
 const bytes=encode(event({candidates:[{content:{parts:[{text:'PRIVATE THOUGHT',thought:true}]}}]})+event(token('Faith 🙏 '))+event(token('in Christ.','STOP')));
 const input=new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=3)c.enqueue(bytes.slice(i,i+3));c.close();}});
 const response=assistantStream(new Response(input));const result=await response.text();
 assert.ok(!result.includes('PRIVATE'));const lines=result.trim().split('\n').map(JSON.parse);assert.equal(lines.filter(x=>x.delta).map(x=>x.delta).join(''),'Faith 🙏 in Christ.');assert.equal(lines.at(-1).done,true);
});
await test('stream errors and missing finish are explicit, sanitized; never false success',async()=>{
 for(const content of [event(token('Partial answer.')),event({error:{message:'private-provider-key'}}),event({promptFeedback:{blockReason:'SAFETY'}})]){const result=await assistantStream(new Response(content)).text();assert.ok(result.includes('interrupted'));assert.ok(!result.includes('"done":true'));assert.ok(!result.includes('private-provider-key'));}
});
await test('upstream request streams with bounded concise generation and retains ministry policy',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url,init)=>{calls++;assert.ok(url.endsWith('streamGenerateContent?alt=sse'));const body=JSON.parse(init.body);assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'minimal');assert.equal(body.generationConfig.maxOutputTokens,500);assert.match(body.systemInstruction.parts[0].text,/Authorized King James Version/);assert.match(body.systemInstruction.parts[0].text,/40–80 words/);return new Response(event(token('Welcome.','STOP')));};
 try{const r=await publicRoute(request({message:'Hello',stream:true}),env);assert.match(r.headers.get('Content-Type'),/ndjson/);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://heavenlykey.org');assert.match(await r.text(),/Welcome/);assert.equal(calls,1);const denied=await publicRoute(request({message:'Hello',stream:true},'https://unrelated.example'),env);assert.equal(denied.status,403);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
await test('older JSON clients continue to work',async()=>{const original=globalThis.fetch;globalThis.fetch=async(url)=>{assert.ok(url.endsWith(':generateContent'));return Response.json(token('Welcome.','STOP'));};try{const r=await publicRoute(request({message:'Hello'}),env);assert.equal((await r.json()).response,'Welcome.');}finally{globalThis.fetch=original;}});
await test('browser displays first real words before generation finishes, handles JSON and interruption',async()=>{
 const http=await import('node:http'),fs=await import('node:fs/promises');const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);const {chromium}=require('playwright');
 let mode='stream';
 const js=(await fs.readFile('website/js/online-assistant.js','utf8')).replace('https://heavenlykey-cms-public.emmanuel2026miracle.workers.dev/v1/assistant','/assistant');
 const server=http.createServer(async(req,res)=>{if(req.url==='/assistant'){if(mode==='json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({response:'Older JSON response.'}));return;}res.setHeader('Content-Type','application/x-ndjson');res.flushHeaders();setTimeout(()=>res.write(JSON.stringify({delta:'First real words. '})+'\n'),150);setTimeout(()=>{if(mode==='error')res.end(JSON.stringify({error:'Interrupted'})+'\n');else res.end(JSON.stringify({delta:'Complete answer.'})+'\n'+JSON.stringify({done:true})+'\n');},1400);return;}if(req.url==='/assistant.js'){res.setHeader('Content-Type','application/javascript');res.end(js);return;}res.setHeader('Content-Type','text/html');res.end('<html><body><script src="/assistant.js"></script></body></html>');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.HK_CHROMIUM_EXECUTABLE||'/tmp/chromium',args:['--no-sandbox']});
 try{for(const width of [1440,390]){const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.getByRole('button',{name:'Open Online Assistant chat',exact:true}).click();
 for(const m of ['stream','json','error']){mode=m;await page.getByRole('textbox',{name:'Your message'}).fill('Hello '+m);const start=Date.now();await page.getByRole('button',{name:'Send',exact:true}).click();if(m!=='json'){await page.locator('.hkem-chat-bot').last().getByText('First real words.',{exact:false}).waitFor();const first=Date.now()-start;assert.ok(first<1100,'Answer must appear before final chunk');assert.equal(await page.getByRole('button',{name:'Send',exact:true}).isEnabled(),false);console.log(width+'px '+m+' first words: '+first+'ms (simulated provider)');}await page.waitForFunction(()=>!document.querySelector('.hkem-chat-form button').disabled);const text=await page.getByRole('log').innerText();assert.ok(text.includes(m==='json'?'Older JSON response.':m==='error'?'The reply was interrupted.':'Complete answer.'));assert.equal(await page.getByText('Typing…',{exact:true}).count(),0);}
 assert.deepEqual(errors,[]);await page.close();}
 }finally{await browser.close();await new Promise(r=>server.close(r));}
});
