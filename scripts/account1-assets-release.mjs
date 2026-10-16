import {createHash} from 'node:crypto';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const account='a160ba9fc74911bd4b3005eac86eefcb', worker='heavenlykey';
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').trim().replace(/^Bearer\s+/i,'');
if(!token)throw Error('Missing Account 1 token');
console.log('::add-mask::'+token);
const root='https://api.cloudflare.com/client/v4', base='/accounts/'+account+'/workers/scripts/'+worker;
async function api(p,init={},auth=token){const r=await fetch(root+p,{...init,headers:{Authorization:'Bearer '+auth,...init.headers},signal:AbortSignal.timeout(120000)});const j=await r.json();if(!r.ok||j.success===false)throw Error('Cloudflare HTTP '+r.status+' '+JSON.stringify(j.errors));return j.result??j;}
async function modules(){const r=await fetch(root+base+'/content/v2',{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('Read modules failed');return {entry:r.headers.get('cf-entrypoint'),parts:await r.formData()};}
const hash=b=>createHash('sha256').update(b).digest('hex');
async function fingerprints(m){const out={};for(const [k,v]of m.parts)out[k]=hash(Buffer.from(await v.arrayBuffer()));return out;}
const settings=await api(base+'/settings'), current=await modules(), originalHashes=await fingerprints(current);
assert.equal(current.entry,'index.js');
assert.deepEqual(originalHashes,{'index.js':'09b3be0d41f8f0d47e4b329c15044d27fbce142ffaae8d5b9fe9246de530755d'},'Live backend changed since read-only inspection; stop for review');
const deployments=await api(base+'/deployments');
await mkdir('release-backup',{recursive:true});
await writeFile('release-backup/settings.json',JSON.stringify(settings));
await writeFile('release-backup/deployments.json',JSON.stringify(deployments));
for(const [k,v]of current.parts)await writeFile('release-backup/'+path.basename(k),Buffer.from(await v.arrayBuffer()));
const directory=process.env.WEBSITE_DIRECTORY||'heavenly-key-website',manifest={}, files=new Map();
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain','.xml':'application/xml','.webmanifest':'application/manifest+json'};
async function walk(dir,rel=''){for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['node_modules','_headers','_redirects'].includes(e.name))continue;const p=path.join(dir,e.name),r=path.posix.join(rel,e.name);if(e.isDirectory())await walk(p,r);else if(e.isFile()){const b=await readFile(p),ext=path.extname(p);if(b.length>25*1024*1024)throw Error('Oversize asset '+r);const h=hash(b.toString('base64')+ext).slice(0,32);manifest['/'+r]={hash:h,size:b.length};files.set(h,{b,type:mime[ext]||'application/octet-stream'});}}}
await walk(directory);
assert.ok(Object.keys(manifest).length>100);
const index=await readFile(path.join(directory,'index.html'),'utf8');assert.ok(index.includes('Share to Bless Others')&&index.includes('pastor-emmanuel-transparent.webp'));
console.log('Prepared '+Object.keys(manifest).length+' assets; running backend preserved byte for byte');
if(!process.argv.includes('--publish')){console.log('Dry run passed');process.exit(0);}
const session=await api(base+'/assets-upload-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({manifest})});
assert.ok(session.jwt&&Array.isArray(session.buckets));console.log('::add-mask::'+session.jwt);
let completion=session.buckets.length?null:session.jwt;
for(const [i,bucket]of session.buckets.entries()){const f=new FormData();for(const h of bucket){const file=files.get(h);assert.ok(file,'Unknown requested asset');f.set(h,new Blob([file.b.toString('base64')],{type:file.type}),h);}const result=await api('/accounts/'+account+'/workers/assets/upload?base64=true',{method:'POST',body:f},session.jwt);if(result.jwt){completion=result.jwt;console.log('::add-mask::'+completion);}console.log('Uploaded bucket '+(i+1)+'/'+session.buckets.length);}
assert.ok(completion,'No completion token; live Worker unchanged');
assert.deepEqual(await api(base+'/settings'),settings,'Live settings changed during upload; stop');
assert.deepEqual(await fingerprints(await modules()),originalHashes,'Live backend changed during upload; stop');
const metadata={main_module:current.entry,compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags,keep_bindings:[...new Set(settings.bindings.map(b=>b.type))],assets:{jwt:completion,config:{run_worker_first:false,html_handling:'auto-trailing-slash',not_found_handling:'none',_headers:await readFile(path.join(directory,'_headers'),'utf8')}}};
for(const k of ['placement','usage_model','tags','tail_consumers','logpush','observability','limits'])if(settings[k]!==undefined)metadata[k]=settings[k];
const upload=new FormData();upload.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}));for(const [k,v]of current.parts)upload.set(k,v,v.name);
const released=await api(base,{method:'PUT',body:upload});console.log('Account 1 release uploaded; version '+(released.version_id||released.id||'returned'));
assert.deepEqual(await fingerprints(await modules()),originalHashes,'Backend byte verification failed');
const after=await api(base+'/settings');assert.deepEqual(after.bindings,settings.bindings,'Binding verification failed');
for(const k of ['compatibility_date','compatibility_flags','usage_model','tags','tail_consumers','logpush'])assert.deepEqual(after[k],settings[k],k+' changed');
const probes=['index.html','css/president-photo-companions.css','js/president-companions.js','assets/ministry/pastor-emmanuel-transparent.webp','pages/meet-the-pastor.html','pages/partner.html'];
for(const p of probes){const expected=hash(await readFile(path.join(directory,p)));let ok=false;for(let n=0;n<5;n++){const r=await fetch('https://heavenlykey.org/'+p+'?release='+Date.now(),{headers:{'Cache-Control':'no-cache'}});if(r.ok&&hash(Buffer.from(await r.arrayBuffer()))===expected){ok=true;break;}await new Promise(r=>setTimeout(r,2500));}assert.ok(ok,'Live asset mismatch '+p);console.log('Live exact asset verified: '+p);}
console.log('SUCCESS: Account 1 assets published directly; backend code and existing bindings unchanged.');
