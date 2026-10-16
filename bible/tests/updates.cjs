const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('../../global-community/node_modules/jsdom');
test('waiting release offers explicit activation without modifying private reader data',async()=>{
 const dom=new JSDOM('<body></body>',{url:'https://bible.heavenlykey.org/',runScripts:'outside-only'}),w=dom.window;const messages=[],listeners={};let checks=0;
 const registration={waiting:{postMessage:m=>messages.push(m)},installing:null,addEventListener:()=>{},update:async()=>checks++};
 Object.defineProperty(w.navigator,'serviceWorker',{value:{controller:{},register:async(path,options)=>{assert.equal(path,'./sw.js');assert.equal(options.updateViaCache,'none');return registration},addEventListener:(n,f)=>listeners[n]=f}});
 w.localStorage.setItem('hk-bible-reader-location','["John",3]');w.eval(fs.readFileSync('bible/public/updates.js','utf8'));await new Promise(setImmediate);
 const box=w.document.querySelector('aside');assert.equal(box.hidden,false);assert.match(box.textContent,/new Bible update/);assert.equal(messages.length,0);assert.equal(checks,1);box.querySelector('button').click();assert.deepEqual(JSON.parse(JSON.stringify(messages)),[{type:'ACTIVATE_BIBLE_UPDATE'}]);assert.equal(w.localStorage.getItem('hk-bible-reader-location'),'["John",3]');dom.window.close();
});
test('an update activated in another tab requests refresh instead of discarding unfinished work',async()=>{
 const dom=new JSDOM('<body><textarea>unfinished note</textarea></body>',{url:'https://bible.heavenlykey.org/',runScripts:'outside-only'}),w=dom.window,listeners={};
 Object.defineProperty(w.navigator,'serviceWorker',{value:{controller:{},register:async()=>({waiting:null,installing:null,addEventListener:()=>{},update:async()=>{}}),addEventListener:(n,f)=>listeners[n]=f}});
 w.eval(fs.readFileSync('bible/public/updates.js','utf8'));await new Promise(setImmediate);assert.equal(w.document.querySelector('aside').hidden,true);listeners.controllerchange();assert.match(w.document.querySelector('aside').textContent,/Refresh Bible/);assert.equal(w.document.querySelector('textarea').value,'unfinished note');dom.window.close();
});
