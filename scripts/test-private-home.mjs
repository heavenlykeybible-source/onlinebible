import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {readFile} from 'node:fs/promises';
const worker=(await import(pathToFileURL(process.argv[2]).href)).default;
for(const path of ['/index1','/index1/','/index1.html']){const r=await worker.fetch(new Request('https://heavenlykey.org'+path),{});assert.equal(r.status,401);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.match(r.headers.get('X-Robots-Tag'),/noindex/);assert.doesNotMatch(await r.text(),/home-slider|hk-primary-footer/);}
const home=await readFile('heavenly-key-website/index.html','utf8');assert.doesNotMatch(home,/Under Construction/);assert.match(home,/Taking Christ to the Nations/);assert.match(home,/<header\b/);assert.match(home,/<footer\b/);console.log('PASS private preview still requires authentication; public homepage contains the reviewed ministry website');

process.exit(0); // Imported platform modules retain background timers after assertions.
