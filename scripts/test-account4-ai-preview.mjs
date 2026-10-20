import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const repositoryRoot=new URL('../',import.meta.url);
const get=path=>readFileSync(new URL(path,repositoryRoot),'utf8');
test('community retains existing storage while AI is removed',()=>{
 const config=get('global-community/wrangler.toml');
 assert.ok(config.includes('94d70dc2-91fe-4c5d-afc2-ca9ccff04f28'));
 assert.ok(config.includes('daf1094e23c6494fb89a6e7bd232b52b'));
 assert.ok(config.includes('bucket_name = "heavenly-key-global-community-media"'));
 assert.doesNotMatch(config,/^\s*\[ai\]/m);
});
test('community AI cannot invoke a provider or expose member controls',()=>{
 const app=get('global-community/public/app.js'),routes=get('global-community/src/index.ts');
 assert.doesNotMatch(app,/openHeavenlyKeyAi|hk-ai-composer|hk-ai-search-suggestion|\/v1\/assistant|\/api\/community-ai/);
 assert.doesNotMatch(routes,/communityAiDraft|validateAiDraftRequest|hkem-ai:/);
 assert.match(routes,/AI features are currently unavailable\.",410/);
});
