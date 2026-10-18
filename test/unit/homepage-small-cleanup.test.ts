import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
const read=(path:string)=>readFile('heavenly-key-website/'+path,'utf8');
describe('approved homepage shell without legacy controllers',()=>{
 it('has one approved carousel controller and an accessible pause control',async()=>{
  const html=await read('index.html');expect((html.match(/src="js\/home-renewal\.js/g)||[])).toHaveLength(1);
  expect(html).not.toContain('src="js/home-slider.js');expect(html).toContain('aria-roledescription="carousel"');expect(html).toContain('Pause');
 });
 it('keeps real media destinations in the approved navigation',async()=>{
  const html=await read('index.html');expect(html).toContain('href="pages/radio.html"');expect(html).toContain('href="pages/grdpc.html"');expect(html).toContain('href="https://global.heavenlykey.org/"');
 });
 it('retains the nations banner without depending on the legacy footer injector',async()=>{
  const html=await read('index.html');expect(html).toContain('REACHING EVERY NATION FOR CHRIST');expect(html).not.toContain('flagcdn.com');expect(html).not.toContain('src="js/site-footer.js');
 });
 it('keeps one footer and the explicit CMS and sharing hooks',async()=>{
  const html=await read('index.html');expect((html.match(/<footer\b/g)||[])).toHaveLength(1);
  expect(html).toContain('class="site-footer"');expect(html).toContain('js/site-cms.js');expect(html).toContain('/js/approved-sharing.js');expect(html).toContain('SHARE TO BLESS OTHERS');
 });
});
