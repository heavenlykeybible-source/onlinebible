import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
const read=(path:string)=>readFile(path,'utf8');
describe('approved ministry and community entry points',()=>{
 it('keeps the five-picture outreach carousel and ministry gateways',async()=>{
  const home=await read('heavenly-key-website/index.html');
  expect(home).toContain('id="hero-heading"');expect(home).toContain('aria-roledescription="carousel"');
  expect((home.match(/class="tv-slide(?: is-active)?"/g)||[])).toHaveLength(5);
  for(const target of ['https://global.heavenlykey.org/','https://app.heavenlykey.org/','pages/grdpc.html','pages/radio.html','pages/steps-to-salvation.html'])expect(home).toContain('href="'+target+'"');
  expect(home).toContain('data-cms-section="president"');
 });
 it('uses the dedicated community instead of the retired ministry-page feed',async()=>{
  const [home,community,app]=await Promise.all([read('heavenly-key-website/index.html'),read('global-community/public/index.html'),read('global-community/public/app.js')]);
  expect(home).toContain('href="https://global.heavenlykey.org/"');
  expect(community).toContain('id="page-root"');expect(community).toContain('data-page="home"');
  for(const page of ['fellowship.html','prayer.html','groups.html','messages.html'])expect(app).toContain(page);
  expect(app).toContain('Text only');expect(community).not.toContain('pages/community.html');
 });
});
