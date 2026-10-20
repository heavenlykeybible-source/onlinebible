import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join,resolve,dirname} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);}
for(const file of [...files(join(root,'src')),...files(join(root,'public'))].filter(f=>f.endsWith('.js'))){
 const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);
 const source=readFileSync(file,'utf8');
 for(const match of source.matchAll(/(?:from\s*|import\s*\()\s*['"](\.\/[^'"]+)['"]/g))if(!existsSync(resolve(dirname(file),match[1])))throw Error('Missing module '+match[1]+' in '+file);
}
for(const file of files(join(root,'public')).filter(f=>f.endsWith('.html'))){
 const html=readFileSync(file,'utf8');
 for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
  const raw=match[1].replaceAll('&amp;','&');if(/^(?:https?:|#|mailto:|tel:|data:)/.test(raw))continue;
  const path=raw.split(/[?#]/)[0];if(!path||path==='/')continue;
  const target=path.startsWith('/')?join(root,'public',path):resolve(dirname(file),path);
  if(!existsSync(target))throw Error('Missing page/asset '+raw+' in '+file);
 }
}

/* Bible-reader regression guards: removed Audio Bible pages must not be linked or precached. */
const biblePublic=join(root,'public');
const bibleReader=readFileSync(join(biblePublic,'study-library.js'),'utf8');
const bibleDownloads=readFileSync(join(biblePublic,'bible-downloads.html'),'utf8');
const biblePage=readFileSync(join(biblePublic,'bible.html'),'utf8');
const bibleHome=readFileSync(join(biblePublic,'index.html'),'utf8');
const serviceWorker=readFileSync(join(biblePublic,'sw.js'),'utf8');
for(const [label,source] of [['Bible reader',bibleReader],['Bible downloads page',bibleDownloads],['Bible page',biblePage],['App home page',bibleHome],['service-worker cache',serviceWorker]]){
 if(source.includes('audio-bible.html')||source.includes("'/audio-bible.js'"))throw Error('Removed Audio Bible route/player is still referenced in '+label+'.');
}
/* Core doctrine entries are regression-checked; this is not a replacement for pastoral review. */
const dictionary=JSON.parse(readFileSync(join(biblePublic,'bible-dictionary.json'),'utf8'));
const entry=term=>dictionary.entries.find(item=>item.term.toLowerCase()===term.toLowerCase());
for(const term of ['Entire Sanctification','Holy Ghost Baptism','Restitution',"Lord's Supper",'Personal Evangelism','Rapture']){
 if(!entry(term))throw Error('Missing core doctrinal study entry: '+term);
}
if(!/definite act of God's grace/i.test(entry('Sanctification')?.definition||''))throw Error('Sanctification entry must preserve Heavenly Key’s definite-act doctrine.');
if(!/one immersion/i.test(entry('Baptism')?.definition||''))throw Error('Water baptism entry must preserve the one-immersion doctrine.');
if(!/not previously learned/i.test(entry('Holy Ghost Baptism')?.definition||''))throw Error('Holy Ghost baptism entry must preserve the stated initial-evidence doctrine.');


/* Responsive/accessibility smoke checks; real device/browser testing is still required. */
for(const pageName of ['index.html','bible.html','bible-downloads.html']){
 const html=readFileSync(join(biblePublic,pageName),'utf8');
 if(!/<meta\s+name=["']viewport["'][^>]*width=device-width/i.test(html))throw Error('Missing responsive viewport meta in '+pageName+'.');
}
const readerStyles=readFileSync(join(biblePublic,'study-library.css'),'utf8');
for(const [label,pattern] of [
 ['mobile breakpoint',/@media\s*\(max-width:\s*600px\)/],
 ['fluid typography',/clamp\(/],
 ['touch-safe chapter navigation',/min-height:\s*46px/],
 ['safe-area-aware bottom navigation',/env\(safe-area-inset-bottom\)/]
])if(!pattern.test(readerStyles))throw Error('Bible reader responsive check failed: '+label+'.');
if(!/aria-live=["']polite["']/.test(readFileSync(join(biblePublic,'bible.html'),'utf8')))throw Error('Bible reader must announce loading/status updates accessibly.');


/* PWA installation metadata and all-book KJV integrity checks. */
const pwaManifest=JSON.parse(readFileSync(join(biblePublic,'manifest.webmanifest'),'utf8'));
if(pwaManifest.display!=='standalone'||pwaManifest.start_url!=='/'||pwaManifest.scope!=='/')throw Error('PWA install metadata must keep standalone display and root scope.');
if(!Array.isArray(pwaManifest.icons)||!pwaManifest.icons.some(icon=>icon.sizes==='192x192')||!pwaManifest.icons.some(icon=>icon.sizes==='512x512'))throw Error('PWA manifest needs 192px and 512px app icons.');
for(const icon of pwaManifest.icons){
 const target=join(biblePublic,icon.src.replace(/^\//,''));
 if(!existsSync(target))throw Error('PWA manifest icon is missing: '+icon.src);
}
const png192=pwaManifest.icons.some(icon=>icon.src==='/icons/icon-192.png'&&icon.sizes==='192x192'&&icon.type==='image/png');
const png512=pwaManifest.icons.some(icon=>icon.src==='/icons/icon-512.png'&&icon.sizes==='512x512'&&icon.type==='image/png');
if(!png192||!png512)throw Error('PWA installability needs real 192px and 512px PNG icons.');
if(!pwaManifest.icons.some(icon=>icon.purpose==='maskable'&&icon.sizes==='512x512'&&icon.type==='image/png'))throw Error('PWA manifest needs a 512px maskable PNG icon.');
const appHtml=readFileSync(join(biblePublic,'index.html'),'utf8');
if(!appHtml.includes('<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">'))throw Error('iOS Home Screen needs a PNG Apple touch icon.');
const serviceWorker=readFileSync(join(biblePublic,'sw.js'),'utf8');
for(const path of ['/icons/icon-192.png','/icons/icon-512.png','/icons/apple-touch-icon.png'])if(!serviceWorker.includes(path))throw Error('Offline app shell is missing install icon '+path+'.');
const kjvManifest=JSON.parse(readFileSync(join(biblePublic,'kjv-manifest.json'),'utf8'));
if(!Array.isArray(kjvManifest.books)||kjvManifest.books.length!==66)throw Error('KJV manifest must contain all 66 books.');
let checkedChapters=0,checkedVerses=0;
for(const book of kjvManifest.books){
 const path=join(biblePublic,book.path);
 if(!existsSync(path))throw Error('Missing KJV book data: '+book.path);
 const data=JSON.parse(readFileSync(path,'utf8'));
 if(data.book!==book.name||!Array.isArray(data.chapters)||data.chapters.length!==book.chapters)throw Error('KJV book metadata/chapter count mismatch: '+book.name);
 for(let i=0;i<data.chapters.length;i++){
  const verses=data.chapters[i];
  if(!Array.isArray(verses)||verses.length===0||verses.some(v=>typeof v!=='string'||!v.trim()))throw Error('Invalid verse data in '+book.name+' chapter '+(i+1)+'.');
  checkedChapters++;checkedVerses+=verses.length;
 }
}
if(checkedChapters!==kjvManifest.totalChapters||checkedVerses!==kjvManifest.totalVerses)throw Error('KJV totals do not match the manifest: '+checkedChapters+' chapters / '+checkedVerses+' verses.');

console.log('All app scripts, module dependencies and local page/assets links verified.');
