import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root='heavenly-key-website/js';
const files=(await readdir(root,{recursive:true})).filter(name=>name.endsWith('.js')).map(name=>join(root,name)).sort();
const appPublic=join('heavenly-key-app','public');
const appFiles=(await readdir(appPublic,{recursive:true})).filter(name=>name.endsWith('.js')).map(name=>join(appPublic,name)).sort();
const failures=[];
for(const file of files){
  const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(r.status!==0)failures.push({file,error:(r.stderr||r.stdout||'Syntax check failed').trim()});
  const source=await readFile(file,'utf8');
  if(/(?<!\$)\$\([^()\n]*\)\.forEach\(/.test(source))failures.push({file,error:'Use $(...) for multi-element iteration; $(...) returns only one element and .forEach will fail at runtime.'});
}
for(const file of appFiles){
  const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(r.status!==0)failures.push({file,error:(r.stderr||r.stdout||'Syntax check failed').trim()});
}
const studyLibrary=join(appPublic,'study-library.js');
try{
  const source=await readFile(studyLibrary,'utf8');
  for(const [label,pattern] of [
    ['verse copy action',/aria-label','Copy /],
    ['sharing slogan',/Share to bless others/],
    ['ministry slogan',/Together we take Christ to the nations of the world\./],
    ['full Bible export action',/Copy full Bible/],
    ['verse-specific sharing anchor',/id='verse-'/]
  ])if(!pattern.test(source))failures.push({file:studyLibrary,error:'Missing Bible sharing requirement: '+label});
  const shareBlock=source.slice(source.indexOf('function passageUrl'),source.indexOf('async function copyFullBible'));
  if(!shareBlock.includes("searchParams.set('book',currentBook.id)")||!shareBlock.includes("searchParams.set('chapter',String(currentChapter))"))failures.push({file:studyLibrary,error:'Shared Bible links must preserve the selected book and chapter.'});
  if(/(?:url|page)\\.href/.test(shareBlock))failures.push({file:studyLibrary,error:'Share URLs are strings; stale .href access would break native-share fallback or social links.'});
}catch(e){failures.push({file:studyLibrary,error:'Unable to inspect Bible sharing controls: '+e.message});}

const studioPath=join(root,'production-studio.js');
try{
  const studio=await readFile(studioPath,'utf8');
  const declarations=['const quickLocalVideo=','const quickLibraryVideo='];
  for(const declaration of declarations){
    const name=declaration.match(/const (\w+)/)?.[1];
    const declaredAt=studio.indexOf(declaration);
    const usedAt=studio.indexOf(name+'.addEventListener');
    if(declaredAt<0||usedAt<0||usedAt<declaredAt)failures.push({file:studioPath,error:name+' must be declared before its browser event listener is attached.'});
  }
  if(!studio.includes("directCameraFallback=!programmeCanvas.captureStream"))failures.push({file:studioPath,error:'Direct-camera fallback for browsers without canvas captureStream is missing.'});
  if(!studio.includes("studio-final-check"))failures.push({file:studioPath,error:'Studio final confirmation panel is missing.'});
}catch(e){failures.push({file:studioPath,error:'Unable to inspect Production Studio runtime invariants: '+e.message});}

const shell=spawnSync('python3',['scripts/sync-account1-approved-shell.py','--check'],{encoding:'utf8'});
if(shell.status!==0)failures.push({file:'Account 1 approved homepage menu/footer',error:(shell.stderr||shell.stdout||'Approved shell verification failed').trim()});

if(failures.length){
  console.error('FRONTEND SYNTAX CHECK FAILED');
  for(const f of failures)console.error('\n'+f.file+'\n'+f.error);
  process.exit(1);
}
console.log('FRONTEND SYNTAX CHECK PASSED — '+(files.length+appFiles.length)+' browser JavaScript files parsed successfully.');

