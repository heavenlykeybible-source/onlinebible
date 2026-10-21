import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),js=readFileSync(new URL('../public/heavenly-key-assistant.js',import.meta.url),'utf8');
assert.match(html,/heavenly-key-assistant\.js/);assert.match(html,/heavenly-key-assistant\.css/);
assert.match(js,/\/v1\/assistant/);assert.match(js,/credentials:'omit'/);assert.match(js,/maxLength=1900/);assert.match(js,/AbortSignal\.timeout\(30000\)/);
assert.match(js,/hk-ai-small-icon/);assert.match(js,/Check scripture references against the KJV/);assert.doesNotMatch(js,/getUserMedia|localStorage|env\.DB|\/api\/posts/);
console.log('Bounded Heavenly Key assistant contract: passed');
