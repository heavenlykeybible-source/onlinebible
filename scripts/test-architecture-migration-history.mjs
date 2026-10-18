import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const check=()=>spawnSync(process.execPath,['scripts/architecture-check.mjs'],{encoding:'utf8'});
test('recorded root history passes without renaming either 0032 migration',()=>{
 const result=check();assert.equal(result.status,0,result.stderr);
});
test('unknown migrations and modifications of the historical supplement fail closed',()=>{
 const extra='migrations/0032_unreviewed_probe.sql';
 try{writeFileSync(extra,'-- Test only\n');assert.notEqual(check().status,0);}finally{unlinkSync(extra);}
 const original='migrations/0032_website_ai_inbox.sql',backup=readFileSync(original);
 try{writeFileSync(original,Buffer.concat([backup,Buffer.from('\n-- unexpected edit\n')]));const result=check();assert.notEqual(result.status,0);assert.match(result.stderr,/Historical website inbox migration changed/);}finally{writeFileSync(original,backup);}
});
