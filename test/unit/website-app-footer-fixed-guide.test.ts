import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
const read=(path:string)=>readFile('heavenly-key-website/'+path,'utf8');
describe('approved App and Community footer',()=>{
 it('keeps the app and global community promotions in the homepage footer',async()=>{
  const html=await read('index.html'),footer=html.slice(html.indexOf('<footer'));
  expect(footer).toContain('id="footer-app-heading">Heavenly Key App');expect(footer).toContain('Discipleship and Global Christian Community');expect(footer).toContain('hk-footer-community');
 });
 it('uses canonical app and community destinations without embedding private sessions',async()=>{
  const html=await read('index.html'),footer=html.slice(html.indexOf('<footer'),html.indexOf('</footer>'));
  expect(footer).toContain('https://app.heavenlykey.org/');expect(footer).toContain('https://global.heavenlykey.org/');expect(footer).not.toContain('<iframe');expect(footer).not.toMatch(/gc_session|password|access_token/);
 });
 it('retains clickjacking protection and explicitly scoped frame sources',async()=>{
  const headers=await read('_headers');expect(headers).toContain('X-Frame-Options: DENY');expect(headers).toContain("frame-ancestors 'none'");expect(headers).not.toContain('frame-src https:;');expect(headers).not.toContain('frame-src *');
 });
 it('shares the approved footer instead of installing the legacy floating guide',async()=>{
  const home=await read('index.html');expect(home).toContain('js/footer-approved-cleanup.js');expect(home).not.toContain('src="js/site-footer.js');expect(home).not.toContain('src="js/ministry-care.js');
 });
});
