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

console.log('All app scripts, module dependencies and local page/assets links verified.');
