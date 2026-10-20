import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../public/index.html');
const js = read('../public/heavenly-key-assistant.js');
const css = read('../public/heavenly-key-assistant.css');
const backend = read('../src/index.ts');
const ai = read('../src/heavenly-key-ai.ts');

assert.ok(html.includes('heavenly-key-assistant.js'), 'assistant script is included');
assert.ok(html.includes('heavenly-key-assistant.css'), 'assistant stylesheet is included');
assert.ok(js.includes("fetch('/api/community-ai'"), 'frontend calls the current same-origin AI route');
assert.ok(js.includes("credentials:'same-origin'"), 'same-origin session cookie is used');
assert.ok(js.includes('action:action.value'), 'frontend sends a supported writing action');
assert.ok(js.includes('requiresReview'), 'frontend explains draft review');
assert.ok(js.includes('AbortController'), 'request timeout is supported');
assert.ok(js.includes('textContent=data.draft'), 'AI output is rendered as text, not HTML');
assert.ok(!js.includes('heavenlykey-cms-public.emmanuel2026miracle.workers.dev'), 'legacy external endpoint is not used');
assert.ok(backend.includes('p==="/api/community-ai"&&m==="POST"'), 'backend route exists');
assert.ok(backend.includes('const u=await me(request,env)'), 'backend requires a session');
assert.ok(backend.includes('"hkem-ai:"'), 'backend has per-member AI rate limiting');
assert.ok(ai.includes('requiresReview:true'), 'backend flags AI output for review');
assert.ok(css.includes('min-height:64px'), 'chat output has a readable minimum height');
assert.ok(css.includes('@media(max-width:600px)'), 'phone layout is responsive');
assert.ok(css.includes(':focus-visible'), 'keyboard focus is visible');
assert.ok(css.includes('prefers-reduced-motion'), 'reduced-motion preference is respected');

console.log('Heavenly Key AI assistant contract: ok');
