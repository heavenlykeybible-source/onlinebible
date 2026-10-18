import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
test('Link audit resolves versioned assets but still rejects a genuinely missing page',()=>{
 const file='heavenly-key-website/index.html',original=readFileSync(file);
 const check=()=>spawnSync(process.execPath,['scripts/site-link-audit.mjs'],{encoding:'utf8'});
 assert.equal(check().status,0);
 try{
  writeFileSync(file,Buffer.concat([original,Buffer.from('\n<a href="/missing-regression-page.html?v=test">Probe</a>\n')]));
  const result=check();assert.notEqual(result.status,0);assert.match(result.stderr,/missing-regression-page/);
 }finally{writeFileSync(file,original);}
});
