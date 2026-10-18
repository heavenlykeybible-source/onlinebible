import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const get=p=>readFileSync(new URL(p,root),'utf8');
test('Community AI stays disabled without changing production resources',()=>{
 const production=get('global-community/wrangler.toml');
 assert.ok(!/\\[ai\\]/.test(production),'No production AI binding');
 assert.ok(production.includes('94d70dc2-91fe-4c5d-afc2-ca9ccff04f28'),'Production D1 preserved');
 assert.ok(production.includes('daf1094e23c6494fb89a6e7bd232b52b'),'Production sessions preserved');
 assert.ok(production.includes('bucket_name = "heavenly-key-global-community-media"'),'Production media preserved');
 const route=get('global-community/src/index.ts');
 assert.ok(route.includes('if(p==="/api/community-ai")return error("AI features are disabled.",404)'));
 const app=get('global-community/public/app.js');
 assert.ok(!app.includes('openHeavenlyKeyAi'));
 assert.ok(!app.includes('/v1/assistant'));
 const html=get('global-community/public/index.html');
 assert.ok(!html.includes('heavenly-key-assistant.js'));
 assert.ok(!html.includes('heavenly-key-assistant.css'));
});
test('Preview isolation and account allowlist are preserved',()=>{
 const provision=get('review/provision.mjs');
 assert.ok(provision.includes("prefix='heavenlykey-review-'+a"));
 assert.ok(provision.includes("if(!['1','2','3'].includes(a))"));
});
