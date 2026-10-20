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
  if(/\b(?:page|shareUrl)\.href\b/.test(shareBlock))failures.push({file:studyLibrary,error:'Share URLs are strings; stale .href access would break native-share fallback or social links.'});
  if(!source.includes("const verseAnchorPrefix='#verse-'+selectedBook.id+'-'+selectedChapter+'-'")||!source.includes("target.scrollIntoView({block:'start',behavior:'auto'})"))failures.push({file:studyLibrary,error:'Shared verse links must retain their matching anchor and scroll to the verse after loading.'});
}catch(e){failures.push({file:studyLibrary,error:'Unable to inspect Bible sharing controls: '+e.message});}

const speakerAnnotationsPath=join(appPublic,'speaker-annotations.json');
try{
  const annotations=JSON.parse(await readFile(speakerAnnotationsPath,'utf8'));
  for(const kind of ['jesus','god']){
    if(!Array.isArray(annotations[kind]))failures.push({file:speakerAnnotationsPath,error:'Speaker annotations must include a '+kind+' array.'});
    for(const item of annotations[kind]||[]){
      if(!item||typeof item.book!=='string'||!Number.isInteger(item.chapter)||item.chapter<1||!Number.isInteger(item.start)||item.start<1||!Number.isInteger(item.end)||item.end<item.start){
        failures.push({file:speakerAnnotationsPath,error:'Invalid '+kind+' speaker range: '+JSON.stringify(item)});
      }
    }
  }
  const reader=await readFile(studyLibrary,'utf8');
  const styles=await readFile(join(appPublic,'study-library.css'),'utf8');
  if(!reader.includes("loadJSON('speaker-annotations.json')")||!reader.includes("p.classList.add('kjv-verse--'+speaker)"))failures.push({file:studyLibrary,error:'Bible reader must load speaker annotations and apply speaker classes.'});
  if(!styles.includes('.kjv-verse.kjv-verse--jesus{color:#c62828}')||!styles.includes('.kjv-verse.kjv-verse--god{color:#1557b0}'))failures.push({file:join(appPublic,'study-library.css'),error:'Red-letter Jesus and blue God speech styles are required.'});
}catch(e){failures.push({file:speakerAnnotationsPath,error:'Unable to validate speaker annotations: '+e.message});}

const bibleManifestPath=join(appPublic,'kjv-manifest.json');
try{
  const manifest=JSON.parse(await readFile(bibleManifestPath,'utf8'));
  if(manifest.totalBooks!==66||!Array.isArray(manifest.books)||manifest.books.length!==66)failures.push({file:bibleManifestPath,error:'KJV manifest must describe all 66 books.'});
  const ids=new Set(),paths=new Set();
  let chapterCount=0,verseCount=0;
  for(const book of manifest.books||[]){
    if(!book?.id||!book?.name||!Number.isInteger(book.chapters)||book.chapters<1||typeof book.path!=='string'||!book.path.startsWith('reading/kjv/')||book.path.includes('..')){
      failures.push({file:bibleManifestPath,error:'Invalid or unsafe KJV book entry: '+JSON.stringify(book)});continue;
    }
    if(ids.has(book.id))failures.push({file:bibleManifestPath,error:'Duplicate KJV book ID: '+book.id});
    if(paths.has(book.path))failures.push({file:bibleManifestPath,error:'Duplicate KJV book path: '+book.path});
    ids.add(book.id);paths.add(book.path);
    try{
      const data=JSON.parse(await readFile(join(appPublic,book.path),'utf8'));
      if(data.book!==book.name||!Array.isArray(data.chapters)||data.chapters.length!==book.chapters){
        failures.push({file:join(appPublic,book.path),error:'Book identity or chapter count does not match the manifest.'});continue;
      }
      for(const [index,chapter] of data.chapters.entries()){
        if(!Array.isArray(chapter)||chapter.length===0||chapter.some(verse=>typeof verse!=='string'||!verse.trim())){
          failures.push({file:join(appPublic,book.path),error:'Invalid verse data in chapter '+(index+1)+'.'});continue;
        }
        chapterCount++;verseCount+=chapter.length;
      }
    }catch(e){failures.push({file:join(appPublic,book.path),error:'Missing or invalid KJV JSON: '+e.message});}
  }
  if(chapterCount!==manifest.totalChapters)failures.push({file:bibleManifestPath,error:'KJV chapter total mismatch: expected '+manifest.totalChapters+', found '+chapterCount+'.'});
  if(verseCount!==manifest.totalVerses)failures.push({file:bibleManifestPath,error:'KJV verse total mismatch: expected '+manifest.totalVerses+', found '+verseCount+'.'});
}catch(e){failures.push({file:bibleManifestPath,error:'Unable to validate KJV manifest: '+e.message});}

const studyToolsPath=join(appPublic,'bible-study-tools.js');
try{
  const dictionary=JSON.parse(await readFile(join(appPublic,'bible-dictionary.json'),'utf8'));
  if(!Array.isArray(dictionary.entries)||dictionary.entries.length<1)failures.push({file:join(appPublic,'bible-dictionary.json'),error:'Bible dictionary must contain entries.'});
  const manifest=JSON.parse(await readFile(bibleManifestPath,'utf8'));
  const bookNames=new Set((manifest.books||[]).map(book=>book.name.toLowerCase()));
  for(const entry of dictionary.entries||[]){
    if(typeof entry.term!=='string'||!entry.term.trim()||typeof entry.definition!=='string'||!entry.definition.trim()||!Array.isArray(entry.refs)||entry.refs.length===0){
      failures.push({file:join(appPublic,'bible-dictionary.json'),error:'Every dictionary entry needs a term, definition, and Scripture references.'});continue;
    }
    for(const ref of entry.refs){
      const match=String(ref).match(/^(.+?)\s+\d+/);
      if(!match||(!bookNames.has(match[1].toLowerCase())&&match[1].toLowerCase()!=='psalm'))failures.push({file:join(appPublic,'bible-dictionary.json'),error:'Unrecognized Bible book in dictionary reference: '+ref});
    }
  }
  const tools=await readFile(studyToolsPath,'utf8');
  const styles=await readFile(join(appPublic,'bible-study-tools.css'),'utf8');
  const page=await readFile(join(appPublic,'bible.html'),'utf8');
  for(const [label,pattern] of [
    ['dictionary lookup',/data-panel="dictionary"/],
    ['Bible concordance',/data-panel="concordance"/],
    ['green cross-reference section',/data-panel="crossrefs"/],
    ['preacher notes',/data-panel="notes"/],
    ['local-only notes storage',/heavenlykey-preacher-notes-v1/]
  ])if(!pattern.test(tools))failures.push({file:studyToolsPath,error:'Missing Bible study tool: '+label});
  if(!styles.includes('.bst-ref{color:#16803c'))failures.push({file:join(appPublic,'bible-study-tools.css'),error:'Scripture cross-reference links must be green.'});
  if(!page.includes('id="bible-study-tools"')||!page.includes('bible-study-tools.css')||!page.includes('bible-study-tools.js'))failures.push({file:join(appPublic,'bible.html'),error:'Bible study tools must be connected to the Bible reader page.'});
}catch(e){failures.push({file:studyToolsPath,error:'Unable to validate Bible study tools: '+e.message});}


const readingRoutinePath=join(appPublic,'bible-reading-routine.js');
try{
  const routine=await readFile(readingRoutinePath,'utf8');
  const styles=await readFile(join(appPublic,'bible-reading-routine.css'),'utf8');
  const page=await readFile(join(appPublic,'bible.html'),'utf8');
  for(const [label,pattern] of [
    ['routine settings saved locally',/hk-bible-reading-routine-v1/],
    ['local reading progress',/hk-bible-reading-progress-v1/],
    ['automated Read and Pray plan',/Automated Read and Pray daily plan/],
    ['topic-based prayer focus options',/destiny:\{label:'Purpose and calling'/],
    ['short daily devotion and prayer point',/Today’s short devotion[\s\S]*?Prayer point/],
    ['monthly date-based passage selection',/new Date\(\)\.getDate\(\)/],
    ['selected reminder time',/type='time'/],
    ['weekday scheduling',/Reading days/],
    ['browser notification permission requested by user',/Notification\.requestPermission\(\)/],
    ['user-selectable silent or ringing alarm',/\['silent','Silent — no alarm sound'\].*\['ring','Ringing alarm — play sound'\]/s],
    ['adjustable alarm volume control',/type='range'.*id='brr-volume'/s],
    ['ringing alarm sound generation',/function stopAlarm\(\)[\s\S]*?function startAlarm\(\)/],
    ['stop alarm control',/Stop alarm/],
    ['honest closed-browser reminder limitation',/browser is fully closed/],
    ['reading completion action',/Mark today’s reading complete/],
    ['no sign-in requirement',/no account is needed/]
  ])if(!pattern.test(routine))failures.push({file:readingRoutinePath,error:'Missing Bible reading routine requirement: '+label});
  if(!styles.includes('.brr-card')||!styles.includes('.brr-primary')||!styles.includes('.brr-devotion'))failures.push({file:join(appPublic,'bible-reading-routine.css'),error:'Reading routine responsive card styles are missing.'});
  if(!page.includes('id="bible-reading-routine"')||!page.includes('bible-reading-routine.css')||!page.includes('bible-reading-routine.js'))failures.push({file:join(appPublic,'bible.html'),error:'Bible reading routine must be connected to the Bible reader page.'});
}catch(e){failures.push({file:readingRoutinePath,error:'Unable to validate Bible reading routine: '+e.message});}

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

