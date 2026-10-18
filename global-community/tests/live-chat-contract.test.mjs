import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=get('public/messages.html'),app=get('public/app.js');
assert.match(html,/app\.js/);
assert.doesNotMatch(html,/<script[^>]+community-live-chat\.js/);
assert.match(app,/api\('\/api\/messages'\)/);
assert.match(app,/clientRequestId:retry\.key/);
assert.match(app,/maxLength:3000/);
assert.match(app,/!e\.isComposing/);
// Cached documents may still load the retired script. It must stay inert.
vm.runInNewContext(get('public/community-live-chat.js'),{});
assert.doesNotMatch(get('public/calling.js'),/getUserMedia|RTCPeerConnection|fetch\(/);
assert.match(get('public/_headers'),/camera=\(\), microphone=\(\)/);
console.log('Canonical text-only messaging contract: passed');
