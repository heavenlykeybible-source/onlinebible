import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('CMS image validation parses and accepts real assets without accepting unsafe URLs',()=>{
 const source=readFileSync('heavenly-key-website/js/site-cms.js','utf8');
 const start=source.indexOf('  function safeImage('),end=source.indexOf('  function safeLink(',start);
 const safe=vm.runInNewContext(source.slice(start,end)+'\nsafeImage;',{URL,location:{href:'https://heavenlykey.org/pages/about.html',origin:'https://heavenlykey.org'}});
 for(const url of ['/assets/ministry/logo.png','assets/photo.jpg','../assets/photo.jpg','https://images.example.org/photo.png'])assert.equal(safe(url),true,url);
 for(const url of ['javascript:alert(1)','data:image/svg+xml,abc','//tracker.example.org/pixel.png','https://user:pass@images.example.org/photo.png','image\\photo.png','photo".png','x\u0000.png','http://external.example/photo.png'])assert.equal(safe(url),false,url);
});
