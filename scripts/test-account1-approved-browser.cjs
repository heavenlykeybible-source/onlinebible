const {chromium}=require(process.env.HK_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../heavenly-key-website');
(async()=>{const browser=await chromium.launch({executablePath:process.env.HK_BROWSER_PATH,headless:true,args:['--no-sandbox']});fs.mkdirSync('approved-shell-screenshots',{recursive:true});
for(const size of [{width:1440,height:1000},{width:768,height:1024},{width:390,height:844},{width:360,height:800}]){
let expected;
for(const file of ['index.html',...fs.readdirSync(path.join(root,'pages')).filter(f=>f.endsWith('.html')&&f!=='admin.html').map(f=>'pages/'+f)]){
const page=await browser.newPage({viewport:size,serviceWorkers:'block'});
await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/v1/content')return route.fulfill({json:{content:{fields:[]},menu:{items:[{label:'UNAPPROVED',href:'/junk',visible:true}]},footer:{copyright:'WRONG',designer:{label:'WRONG',href:'https://example.com'}}}});if(u.pathname==='/v1/assistant')return route.fulfill({json:{response:'Jesus Christ is our Saviour.'}});if(u.pathname.startsWith('/api/'))return route.fulfill({json:{items:[],posts:[],content:{}}});if(u.hostname!=='heavenlykey.org')return route.fulfill({body:''});const p=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.fulfill({status:404,body:''});const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};return route.fulfill({body:fs.readFileSync(p),contentType:types[path.extname(p)]||'application/octet-stream'});});
await page.goto('https://heavenlykey.org/'+(file==='index.html'?'':file));await page.waitForTimeout(1000);
assert.equal(await page.locator('.main-nav>ul>li').count(),7,file);
assert.equal(await page.locator('footer.site-footer').count(),1,file);
assert.equal(await page.locator('#hkem-public-assistant').count(),0,file);
assert.equal(await page.locator('a[href="/junk"]').count(),0,file);
const radio=file==='pages/radio.html';assert.equal(await page.locator('#hkem-assistant').count(),radio?0:1,file);assert.equal(await page.locator('#hk-floating-radio').count(),radio?0:1,file);
const signature=await page.evaluate(()=>{const s=selector=>{const c=getComputedStyle(document.querySelector(selector));return [c.backgroundColor,c.color,c.fontFamily,c.fontSize,c.fontWeight,c.display,c.gridTemplateColumns]};return {nav:s('.main-nav'),link:s('.main-nav summary'),footer:s('footer.site-footer'),footerTitle:s('footer.site-footer h2'),columns:s('.hk-primary-footer')}});
if(!expected)expected=signature;else assert.deepEqual(signature,expected,file+' homepage shell computed styles at '+size.width);
for(const menu of await page.locator('.main-nav details').all()){await menu.locator('summary').click();assert.equal(await menu.getAttribute('open'),'');await menu.locator('.dropdown a').first().click({trial:true,timeout:5000});await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('open'),null);}
if(!radio){for(const sel of ['.hkem-launcher img','.hkr-bubble img'])assert.ok(await page.locator(sel).evaluate(i=>i.complete&&i.naturalWidth>0),file+' official artwork '+sel);await page.locator('.hkem-launcher').click();await page.getByRole('textbox',{name:'Your message',exact:true}).fill('Who is Jesus?');await page.locator('.hkem-chat-form button').click();await page.getByText('Jesus Christ is our Saviour.',{exact:true}).waitFor();const box=await page.locator('.hkem-iphone-chat').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,file+' chat viewport');await page.locator('.hkem-close').click();await page.locator('.hkr-bubble').click();await page.locator('.hkr-art-player').waitFor({state:'visible'});await page.locator('.hkr-min').click();}
if(['index.html','pages/about.html','pages/radio.html'].includes(file))await page.screenshot({path:'approved-shell-screenshots/'+file.replaceAll('/','-')+'-'+size.width+'.png',fullPage:true});
console.log('PASS',size.width,file);await page.close();}}
await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
