import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Resolve test fixtures from this file, not the runner working directory.
const repositoryRoot=new URL('../',import.meta.url);
const get=p=>readFileSync(new URL(p,repositoryRoot),'utf8');
test('shared Heavenly Key AI is bound only in Account 4 isolated Community preview',()=>{
 const provision=get('review/provision.mjs');
 assert.ok(provision.includes("if(a==='3')lines.push('[ai]','binding = \"AI\"')"),'Account 3 sandbox AI binding present');
 assert.ok(provision.includes("prefix='heavenlykey-review-'+a"),'Always isolate preview resource names');
 assert.ok(provision.includes("if(!['1','2','3'].includes(a))"),'Explicit account allowlist remains');
 assert.ok(!get('global-community/wrangler.toml').includes('[ai]'),'No production binding modifications');
 assert.ok(!get('global-community/wrangler.staging.toml').includes('[ai]'),'No unrelated staging binding modifications');
});
test('AI remains authenticated, limited and subordinate to member draft approval',()=>{
 const route=get('global-community/src/index.ts'),backend=get('global-community/src/heavenly-key-ai.ts'),frontend=get('global-community/public/app.js');
 assert.ok(route.includes('if(p==="/api/community-ai"&&m==="POST")'));
 assert.ok(route.includes('await me(request,env);'),'Session required for protected actions');
 assert.ok(route.includes('hkem-ai:'),'Limit AI requests by user identity');
 assert.ok(backend.includes('requiresReview:true'),'Generated content never automatically published');
 assert.ok(!backend.includes('env.DB.prepare'),'AI has no database write authority');
 assert.ok(frontend.includes('apply:result=>'),'Inserting a suggestion requires member interaction');
 assert.ok(frontend.includes("'/api/community-ai'"),'Search and posting tools share the same route');
});
