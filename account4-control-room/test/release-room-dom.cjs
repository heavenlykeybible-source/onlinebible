const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../../global-community/node_modules/jsdom');
const root=path.resolve(__dirname,'../public');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('release table and preview settings require a fresh preview after edits before approval',async()=>{
 const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'https://control.heavenlykey.org',runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 let revision=1,approved=false,viewed=0,theme={},html='<html><head></head><body>Pending Bible</body></html>';const calls=[];
 w.fetch=async(url,options={})=>{calls.push(url);const body=options.body?JSON.parse(options.body):{};
 if(url==='/api/releases')return {ok:true,json:async()=>({targets:{account6:{label:'Account 6 · Bible'}},items:[{id:'test-id',target:'account6',title:'New Bible interface',source_sha:'a'.repeat(40),revision,ready:1,arrived_at:'2026-10-16T09:00:00Z',approved_at:approved?'2026-10-16T10:00:00Z':null,active_id:approved?'test-id':null,working:approved}]})};
 if(url.endsWith('/preview'))return {ok:true,json:async()=>({id:'test-id',revision,theme,html,pages:['/index.html','/study.html'],entry:body.path||'/index.html',url:'/sandbox-preview'})};
 if(url.endsWith('/viewed')){viewed=body.expectedRevision;return {ok:true,json:async()=>({ok:true})}}
 if(url.endsWith('/settings')){assert.equal(body.expectedRevision,revision);revision++;theme=body.theme;if(body.html)html=body.html;return {ok:true,json:async()=>({revision})}}
 if(url.endsWith('/approve')){assert.equal(body.expectedRevision,viewed);approved=true;return {ok:true,json:async()=>({ok:true})}}
 if(url.endsWith('/check'))return {ok:true,json:async()=>({working:true})};throw Error('Unexpected URL '+url);
 };
 w.eval(fs.readFileSync(root+'/release-room.js','utf8'));await flush();
 assert.match(doc.querySelector('#release-rows').textContent,/New update/);assert.equal(doc.querySelectorAll('#release-rows button').length,2);
 doc.querySelector('#release-rows button').click();await flush();assert.equal(doc.querySelector('#release-dialog').open,true);assert.equal(doc.querySelector('#release-approve').disabled,true);
 const acknowledge=async()=>{const frame=doc.querySelector('#release-frame');w.dispatchEvent(new w.MessageEvent('message',{source:frame.contentWindow,origin:'null',data:{type:'hkem-release-loaded',id:'test-id',revision}}));await flush()};
 await acknowledge();assert.equal(doc.querySelector('#release-approve').disabled,false);
 doc.querySelector('#release-theme-enabled').checked=true;doc.querySelector('#release-background').value='#ffff00';doc.querySelector('#release-background').dispatchEvent(new w.Event('change'));await flush();await flush();assert.equal(revision,2);assert.equal(doc.querySelector('#release-approve').disabled,true);
 await acknowledge();doc.querySelector('#release-html').value='<html><head></head><body>Corrected Bible</body></html>';doc.querySelector('#release-html').dispatchEvent(new w.Event('input'));assert.equal(doc.querySelector('#release-approve').disabled,true);
 doc.querySelector('#release-html-apply').click();await flush();await flush();assert.equal(revision,3);await acknowledge();doc.querySelector('#release-approve').click();await flush();await flush();assert.equal(approved,true);assert.equal(doc.querySelector('#release-dialog').open,false);assert.match(doc.querySelector('#release-rows').textContent,/Working · verified/);assert.equal(calls.filter(p=>p.endsWith('/approve')).length,1);w.close();
});
