const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('../../global-community/node_modules/jsdom');
const root=path.resolve(__dirname,'../public');
test('all 31,102 canonical verses can attach commentary without altering KJV text or claiming an imported corpus',async()=>{
 const dom=new JSDOM('<main></main>',{url:'https://bible.heavenlykey.org/',runScripts:'outside-only'}),w=dom.window,manifest=JSON.parse(fs.readFileSync(root+'/data/kjv/manifest.json','utf8'));w.fetch=async()=>({ok:false});
 w.eval(fs.readFileSync(root+'/verse-commentary.js','utf8'));let total=0;
 for(const book of manifest.books){assert.equal(w.HKVerseCommentary.codeByBook[book.name],book.code);const bytes=fs.readFileSync(root+'/data/kjv/'+book.code+'.json');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),book.sha256);const data=JSON.parse(bytes);
  for(const verses of Object.values(data.chapters))total+=verses.length;
  const row=w.document.createElement('p'),text=data.chapters['1'][0].text;row.textContent=text;w.HKVerseCommentary.attach(row,{book:book.name,chapter:1,verse:1,text});assert.equal(row.firstChild.nodeValue,text);const panel=row.querySelector('details');assert.ok(panel);panel.open=true;panel.dispatchEvent(new w.Event('toggle'));await new Promise(setImmediate);assert.match(panel.textContent,/has not yet been imported/);assert.equal(panel.querySelector('a').href,'https://askkumuyi.ai/');assert.equal(panel.querySelector('a').target,'_blank');
 }
 assert.equal(total,31102);assert.equal(JSON.parse(fs.readFileSync(root+'/data/commentary/catalog.json')).importedVerseCount,0);w.close();
});
test('approved commentary keeps attribution, escapes text, and rejects untrusted source links',async()=>{
 const dom=new JSDOM('<main></main>',{url:'https://bible.heavenlykey.org/',runScripts:'outside-only'}),w=dom.window;w.fetch=async()=>({ok:true,json:async()=>({schema:1,book:'John',entries:{'3:16':[{text:'Test commentary <script>not executable</script>',author:'Test attribution',sourceTitle:'Test study',sourceUrl:'https://dclm.org/'},{text:'Not trusted',author:'Other',sourceTitle:'Other',sourceUrl:'https://untrusted.example/'}]}})});
 w.eval(fs.readFileSync(root+'/verse-commentary.js','utf8'));const row=w.document.createElement('p');w.HKVerseCommentary.attach(row,{book:'John',chapter:3,verse:16,text:'KJV text'});const panel=row.querySelector('details');panel.open=true;panel.dispatchEvent(new w.Event('toggle'));await new Promise(setImmediate);assert.equal(panel.querySelectorAll('article').length,1);assert.equal(panel.querySelectorAll('script').length,0);assert.match(panel.textContent,/Test attribution/);assert.doesNotMatch(panel.textContent,/Not trusted/);w.close();
});
