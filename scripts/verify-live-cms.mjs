import {chromium} from 'playwright';
import {readFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const origin='https://heavenlykey-cms-public.emmanuel2026miracle.workers.dev';
const browser=await chromium.launch({headless:true});mkdirSync('/tmp/heavenly-key-screenshots',{recursive:true});
let failures=[];
try{
 for(const [label,url,file] of [
 ['main','https://heavenlykey.org/','heavenly-key-website/index.html'],
 ['app-page','https://heavenlykey.org/pages/app','heavenly-key-website/pages/app.html'],
 ['community','https://global.heavenlykey.org/','global-community/public/index.html'],
 ['bible','https://bible.heavenlykey.org/','heavenly-key-website/bible/index.html']
 ]){
  try{
   let html='',http=0,matched=false;
   for(let attempt=0;attempt<12;attempt++){try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});http=r.status;html=await r.text();matched=r.ok&&hash(html)===hash(readFileSync(file,'utf8'));if(matched)break}catch{}await new Promise(r=>setTimeout(r,10000))}
   console.log(JSON.stringify({label,url,http,sourceMatch:matched,title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]}));
   if(!matched)throw Error(label+': deployed HTML differs from approved repository source');
   const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();const violations=[];page.on('console',msg=>{if(msg.type()==='error')violations.push(msg.text())});
   await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('#hkem-public-assistant').waitFor({timeout:25000});
   const renderer=await page.evaluate(()=>window.__hkemCentralCms===true);if(!renderer)throw Error(label+': CMS renderer not loaded');
   if(label==='community'){await page.locator('.hk-official-posts article').first().waitFor({timeout:15000});console.log('Community home renders actual official publications');}
   if(label==='main'){
    await page.locator('#hkem-public-assistant>button').click();await page.locator('#hkem-public-assistant textarea').fill('Where can I read the Heavenly Key Bible?');await page.locator('#hkem-public-assistant form button').click();
    await page.waitForFunction(()=>{const s=document.querySelector('#hkem-public-assistant [role=status]')?.textContent;return s&&s!=='Thinking…'},{},{timeout:60000});
    const answer=await page.locator('#hkem-public-assistant [role=status]').innerText();if(!/bible\.heavenlykey\.org/i.test(answer))throw Error('Website AI did not return the Bible portal link: '+answer);console.log('Public AI chat interface returned actual live response:',answer.slice(0,300));
   }
   await page.screenshot({path:'/tmp/heavenly-key-screenshots/'+label+'-desktop.png',fullPage:false});
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);console.log(JSON.stringify({label,mobileHorizontalOverflow:overflow,browserErrors:violations.slice(0,10)}));if(overflow)failures.push(label+': mobile horizontal overflow');
   await page.screenshot({path:'/tmp/heavenly-key-screenshots/'+label+'-mobile.png',fullPage:false});
   if(violations.some(v=>/Refused to connect.*heavenlykey-cms-public|Refused to load.*cms-runtime/.test(v)))throw Error(label+': CMS blocked by CSP');
   await context.close();
  }catch(error){failures.push(error.message);console.error(error.message)}
 }
 for(const url of ['https://app.heavenlykey.org/','https://heavenly-key-app.heavenlykeyapp.workers.dev/','https://heavenlykey-media.faithofourfatherstv.workers.dev/','https://heavenlykey.org/pages/admin#studio']){
  try{const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)}),text=await r.text();console.log(JSON.stringify({additionalPublicCheck:url,http:r.status,location:r.headers.get('location'),title:text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]}))}catch(error){console.log(JSON.stringify({additionalPublicCheck:url,error:error.message}))}
 }
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();await page.goto('https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev/');if(!page.url().includes('/login'))throw Error('Owner dashboard did not require login');await page.locator('input[type=password]').waitFor();await page.screenshot({path:'/tmp/heavenly-key-screenshots/owner-signin-mobile.png'});await context.close();
}finally{await browser.close()}
if(failures.length)throw Error(failures.join('\n'));
console.log('Live desktop/mobile CMS renderer, community home and public AI interface verification passed.');
