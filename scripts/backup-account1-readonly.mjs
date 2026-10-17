// Preserve Account 1 before the approved AI/radio assets and Studio routing repair.
import {mkdirSync,writeFileSync} from 'node:fs';
const account='a160ba9fc74911bd4b3005eac86eefcb',zone='23f3be9052bf609e8ccd85ac1b375019';
const token=process.env.TOKEN1?.trim().replace(/^Bearer\s+/i,'');if(!token)throw Error('CLOUDFLARE_API_TOKEN is not available to the Account 1 read-only check.');
const base='https://api.cloudflare.com/client/v4';
async function api(path){const r=await fetch(base+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(25000)});const d=await r.json();if(!r.ok||!d.success)throw Error('Account 1 '+path+' HTTP '+r.status);return d.result;}
mkdirSync('account1-backup',{recursive:true});const report={recordedAt:new Date().toISOString(),account,workers:[],errors:[]};
const scripts=await api('/accounts/'+account+'/workers/scripts');report.workerNames=scripts.map(s=>s.id);
for(const name of ['heavenlykey','heavenlykey-portals']){if(!report.workerNames.includes(name)){report.errors.push(name+' not present; do not invent routing.');continue;}const settings=await api('/accounts/'+account+'/workers/scripts/'+name+'/settings'),deployment=await api('/accounts/'+account+'/workers/scripts/'+name+'/deployments');
writeFileSync('account1-backup/'+name+'-settings.json',JSON.stringify(settings,null,2));writeFileSync('account1-backup/'+name+'-deployments.json',JSON.stringify(deployment,null,2));
const r=await fetch(base+'/accounts/'+account+'/workers/scripts/'+name+'/content/v2',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Account 1 Worker source backup HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());writeFileSync('account1-backup/'+name+'-source.bin',b);
report.workers.push({name,sourceContentType:r.headers.get('content-type'),sourceBytes:b.length,deployment,bindings:settings.bindings.map(({name,type,id,namespace_id,bucket_name,service})=>({name,type,id,namespace_id,bucket_name,service}))});}
for(const [label,path] of [['routes','/zones/'+zone+'/workers/routes'],['domains','/accounts/'+account+'/workers/domains']]){try{report[label]=await api(path)}catch(error){report.errors.push(error.message)}}
writeFileSync('account1-backup/recovery.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
