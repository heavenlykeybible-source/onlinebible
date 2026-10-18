const {chromium,webkit}=require(process.env.HK_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../bible/public');
(async()=>{for(const engine of (process.env.HK_BIBLE_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,webkit}[engine]).launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}: {})});
 for(const viewport of [{width:1440,height:1000},{width:1024,height:768},{width:768,height:1024},{width:390,height:844},{width:360,height:800}]){
 const page=await browser.newPage({viewport,serviceWorkers:'block'});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.pathname.startsWith('/api/'))return route.fulfill({json:{success:true,items:[],chapterId:1}});if(url.hostname!=='bible.heavenlykey.org')return route.fulfill({body:''});let filename=path.join(root,url.pathname==='/'?'index.html':url.pathname);if(fs.existsSync(filename)&&fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename))return route.fulfill({status:404,body:''});return route.fulfill({body:fs.readFileSync(filename),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(filename)]||'application/octet-stream'});});
 await page.goto('https://bible.heavenlykey.org/');await page.locator('#verses>p').first().waitFor();
 assert.equal(await page.locator('#book option').count(),66);assert.equal(await page.locator('#chapter-title').textContent(),'John 1');
 assert.ok(await page.locator('#verses').textContent().then(t=>t.includes('In the beginning was the Word')));
 await page.getByRole('button',{name:'Explore Apps ▾',exact:true}).click();
 const links=await page.locator('.hk-family-links a').evaluateAll(es=>es.map(e=>e.href));assert.ok(links.includes('https://bible.heavenlykey.org/'));assert.ok(links.includes('https://heavenlykey.org/pages/radio'));assert.ok(links.includes('https://app.heavenlykey.org/walk-offline.html'));assert.ok(links.includes('https://app.heavenlykey.org/creation-to-eternity.html'));
 await page.getByRole('button',{name:'Explore Apps ▾',exact:true}).click();
 await page.locator('#book').selectOption({label:'Psalms'});await page.locator('#chapter').selectOption('150');await page.getByRole('button',{name:'Open chapter',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#chapter-title').textContent==='Psalms 150');assert.ok((await page.locator('#verses').textContent()).includes('Let every thing that hath breath praise the LORD'));
 await page.getByRole('button',{name:'Study verse 1',exact:true}).click();await page.locator('#study-note').fill('Keep this personal study note through an app update.');await page.getByRole('button',{name:'Save verse and note',exact:true}).click();assert.ok((await page.locator('#saved-verses').textContent()).includes('Keep this personal study note'));
 await page.reload();await page.locator('#verses>p').first().waitFor();assert.ok((await page.locator('#saved-verses').textContent()).includes('Keep this personal study note'),'Saved study data survives a page update');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,engine+' '+viewport.width+' no horizontal overflow');
 const badTargets=await page.locator('#reader-form button,#reader-form select,.verse-action').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().height<43).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height})));assert.equal(badTargets.length,0,engine+' '+viewport.width+' reading controls remain comfortable to tap: '+JSON.stringify(badTargets.slice(0,3)));
 fs.mkdirSync('bible-device-screenshots',{recursive:true});await page.screenshot({path:'bible-device-screenshots/'+engine+'-'+viewport.width+'.png',fullPage:true});console.log('PASS Bible reader, chapter navigation, app links, saved notes and responsive controls',engine,viewport.width);await page.close();
 }
 await browser.close();
}})().catch(error=>{console.error(error);process.exit(1)});
