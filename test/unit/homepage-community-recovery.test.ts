import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
const read=(path:string)=>readFile(path,'utf8');
describe('approved homepage and bounded community assistance',()=>{
 it('keeps the current spiritual-caution section before sharing and the footer',async()=>{
  const html=await read('heavenly-key-website/index.html'),start=html.indexOf('data-cms-section="spiritual-caution"'),end=html.indexOf('<section class="hk-share-bless"');
  expect(start).toBeGreaterThan(html.indexOf('data-cms-section="president"'));expect(end).toBeGreaterThan(start);
  const caution=html.slice(start,end);expect((caution.match(/<article\b/g)||[])).toHaveLength(6);
  for(const scripture of ['John 3:3','Hebrews 12:14','Matthew 26:41','Jude 1:3','Matthew 24:44'])expect(caution).toContain(scripture);
 });
 it('loads the approved controls and keeps community writing subordinate to member review',async()=>{
  const [home,app,assistant]=await Promise.all([read('heavenly-key-website/index.html'),read('global-community/public/app.js'),read('global-community/src/heavenly-key-ai.ts')]);
  expect(home).toContain('js/floating-radio.js');expect(home).toContain('js/footer-approved-cleanup.js');
  expect(home).not.toContain('src="js/site-footer.js');
  for(const entry of ['openHeavenlyKeyAi','hk-ai-composer','hk-ai-search-suggestion'])expect(app).toContain(entry);
  expect(assistant).toContain('requiresReview:true');expect(assistant).not.toContain('env.DB.prepare');
 });
});
