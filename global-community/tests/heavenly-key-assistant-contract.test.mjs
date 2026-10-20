import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../public/index.html');
const js = read('../public/heavenly-key-assistant.js');
const css = read('../public/heavenly-key-assistant.css');
const backend = read('../src/index.ts');
const ai = read('../src/heavenly-key-ai.ts');
const packageJson = JSON.parse(read('../package.json'));

assert.ok(html.includes('heavenly-key-assistant.js?v=ai-audit-20261020'), 'HTML cache-busts the current assistant script');
assert.ok(html.includes('heavenly-key-assistant.css?v=ai-audit-20261020'), 'HTML cache-busts the current assistant styles');
assert.ok(js.includes("fetch('/api/community-ai'"), 'frontend calls the current same-origin AI route');
assert.ok(js.includes("credentials:'same-origin'"), 'same-origin session cookie is used');
assert.ok(js.includes('action:action.value'), 'frontend sends a supported writing action');
assert.ok(js.includes('requiresReview'), 'frontend explains draft review');
assert.ok(js.includes('AbortController'), 'request timeout is supported');
assert.ok(js.includes('textContent=data.draft'), 'AI output is rendered as text, not HTML');
assert.ok(js.includes('response.status===401'), 'sign-in expiry is handled');
assert.ok(js.includes('finally{clearTimeout(timeout)'), 'request timeout is always cleared');
assert.ok(!js.includes('heavenlykey-cms-public.emmanuel2026miracle.workers.dev'), 'legacy external endpoint is not used');
assert.ok(backend.includes('p==="/api/community-ai"&&m==="POST"'), 'backend route exists');
assert.ok(backend.includes('const u=await me(request,env)'), 'backend requires a session');
assert.ok(backend.includes('"hkem-ai:"'), 'backend has per-member AI rate limiting');
assert.ok(backend.includes('validateAiDraftRequest(input)'), 'backend validates input before generation');
assert.ok(ai.includes('requiresReview:true'), 'backend flags AI output for review');
assert.ok(ai.includes('containsSensitiveAiData'), 'backend filters sensitive data');
assert.ok(css.includes('min-height:64px'), 'chat output has a readable minimum height');
assert.ok(css.includes('max-width:600px'), 'phone layout is responsive');
assert.ok(css.includes(':focus-visible'), 'keyboard focus is visible');
assert.ok(css.includes('prefers-reduced-motion'), 'reduced-motion preference is respected');
assert.ok(css.includes('100vh'), 'viewport fallback supports older mobile browsers');
assert.ok(packageJson.scripts['test:assistant'], 'assistant contract test has a package script');
assert.ok(packageJson.scripts.buildcheck.includes('test:assistant'), 'assistant test runs in buildcheck');

console.log('Heavenly Key AI assistant source contract: ok');
