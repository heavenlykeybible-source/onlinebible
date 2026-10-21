import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../public/heavenly-key-assistant.js',import.meta.url),'utf8');
assert.doesNotMatch(html,/heavenly-key-assistant\.(js|css)/);
assert.doesNotMatch(js,/fetch\(|createElement|addEventListener/);
console.log('AI removal contract: ok');
