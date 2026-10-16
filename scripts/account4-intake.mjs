/** Source/AI corrections arrive in Account 4. This script never deploys or writes site databases. */
import {readdir,lstat,readFile} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {RELEASE_TARGETS,publicPath,protectedRoute} from '../account4-control-room/src/release-targets.ts';
const mime={html:'text/html',htm:'text/html',css:'text/css',js:'application/javascript',mjs:'application/javascript',json:'application/json',webmanifest:'application/manifest+json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',ico:'image/x-icon',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',txt:'text/plain',xml:'application/xml',mp3:'audio/mpeg',mp4:'video/mp4',ogg:'audio/ogg',wav:'audio/wav',pdf:'application/pdf'};
export function changedTargets(paths){
 const targets=new Set();for(const path of paths){
  if(path.startsWith('shared-cms/')){for(const id of Object.keys(RELEASE_TARGETS))if(id!=='talkmoney')targets.add(id);continue}
  if(path.startsWith('bible/public/')||path.startsWith('heavenly-key-website/bible/')){targets.add('account6');continue}
  const app=path.match(/^(?:heavenly-key-website\/pages\/apps|public-apps)\/(bible|community|radio|study|walk)\//);if(app){targets.add('app-'+app[1]);continue}
  if(path==='heavenly-key-website/pages/admin.html'){targets.add('account2');continue}
  for(const [id,target] of Object.entries(RELEASE_TARGETS))if(!id.startsWith('app-')&&path.startsWith(target.source+'/'))targets.add(id);
 }return [...targets];
}
export async function collectSnapshot(root,target){
 const definition=RELEASE_TARGETS[target];if(!definition)throw Error('Unknown target.');const base=resolve(root,definition.source),files=new Map();
 async function visit(dir,sourceBase=base,mount=''){for(const name of (await readdir(dir)).sort()){
  const path=join(dir,name),stat=await lstat(path);if(stat.isSymbolicLink())throw Error('Public release files cannot be symbolic links.');
  if(stat.isDirectory()){if(!name.startsWith('.')&&name!=='node_modules')await visit(path,sourceBase,mount);continue}
  if(!stat.isFile())continue;const publicName=mount+'/'+relative(sourceBase,path).replaceAll('\\','/'),extension=name.split('.').pop().toLowerCase();
  if(!mime[extension]||name==='AGENTS.md'||name.endsWith('.map'))continue;publicPath(publicName);if(protectedRoute(publicName))throw Error('Public snapshots cannot include backend API paths.');
  const bytes=await readFile(path);if(bytes.length>25_000_000)throw Error('Public file exceeds 25 MB: '+publicName);if(extension==='json'||extension==='webmanifest')JSON.parse(bytes.toString('utf8'));
  if(extension==='js'||extension==='mjs')execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
  files.set(publicName,{bytes,type:mime[extension]});
 }}await visit(base);
 if(definition.overlaySource){const overlay=resolve(root,definition.overlaySource);await visit(overlay,overlay,definition.scope.replace(/\/$/,''))}
 for(const [source,destination,type] of [['shared-cms/cms-runtime.js','/cms-runtime-20261015.js','application/javascript'],['shared-cms/cms-runtime.css','/cms-runtime-20261015.css','text/css']]){
  try{const bytes=await readFile(resolve(root,source));files.set(destination,{bytes,type});if(files.has('/js'+destination))files.set('/js'+destination,{bytes,type})}catch(error){if(error.code!=='ENOENT')throw error}
 }
 if(!files.has(definition.entry))throw Error('The complete snapshot must contain '+definition.entry);
 const manifest=Object.fromEntries([...files].sort(([a],[b])=>a.localeCompare(b)).map(([path,{bytes,type}])=>[path,{sha256:createHash('sha256').update(bytes).digest('hex'),size:bytes.length,type}]));
 if(files.size>6000||[...files.values()].reduce((n,f)=>n+f.bytes.length,0)>250_000_000)throw Error('Snapshot exceeds its file/size limit.');return {files,manifest};
}
export async function submitSnapshot({root,target,sourceSha,origin,token,source='github',title},request=fetch){
 if(!token||token.length<32)throw Error('Account 4 intake credential is not configured.');
 if(!['https://control.heavenlykey.org','https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev'].includes(origin))throw Error('Only the Account 4 intake host is permitted.');
 const {files,manifest}=await collectSnapshot(root,target);
 async function call(path,method,body,type='application/json'){const response=await request(origin+'/api/releases'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':type},body});const value=await response.json();if(!response.ok)throw Error(value.error||'Account 4 intake failed.');return value}
 const arrival=await call('/ingest','POST',JSON.stringify({target,title:title||RELEASE_TARGETS[target].label+' update',source,sourceSha,manifest}));
 if(!arrival.ready){const unique=new Set();for(const [path,{bytes,type}] of files){const hash=manifest[path].sha256;if(unique.has(hash))continue;await call('/'+arrival.id+'/asset?path='+encodeURIComponent(path),'PUT',bytes,type);unique.add(hash)}await call('/'+arrival.id+'/ready','POST','{}')}
 return {id:arrival.id,target,status:'new_update',published:false};
}
async function main(){
 const root=process.cwd(),sha=process.env.SOURCE_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();if(!/^[a-f0-9]{40}$/.test(sha))throw Error('An immutable source commit is required.');
 let selected=(process.env.RELEASE_TARGETS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!selected.length){const before=process.env.BEFORE_SHA;if(before&&/^[a-f0-9]{40}$/.test(before)&&!/^0+$/.test(before)){const paths=execFileSync('git',['diff','--name-only',before,sha],{encoding:'utf8'}).trim().split('\n');selected=changedTargets(paths)}else selected=Object.keys(RELEASE_TARGETS)}
 if(selected.includes('account5'))execFileSync(process.execPath,['--test','heavenly-key-app/test/offline-preservation.test.mjs','heavenly-key-app/test/offline-learning.test.mjs'],{cwd:root,stdio:'inherit'});
 for(const target of selected){const result=await submitSnapshot({root,target,sourceSha:sha,origin:process.env.ACCOUNT4_INTAKE_ORIGIN||'https://control.heavenlykey.org',token:process.env.ACCOUNT4_RELEASE_INGEST_TOKEN,source:process.env.GITHUB_REPOSITORY||'direct-ai',title:process.env.RELEASE_TITLE});console.log(JSON.stringify(result))}
 if(!selected.length)console.log('No public presentation changes. Protected backend configuration is maintained separately.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1});
