// Read-only Account 2 preservation. Private artifacts may contain ministry data.
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const account='c324d871146f8fcc5e7dcd3da057011c',worker='heavenlykey-media',database='0a512013-8b98-46b2-9404-4df65b0c0f04';
const token=process.env.TOKEN2?.trim().replace(/^Bearer\s+/i,'');
if(!token)throw Error('ACCOUNT_2_TOKEN is required.');
const base='https://api.cloudflare.com/client/v4/accounts/'+account;
async function api(path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const d=await r.json();if(!r.ok||!d.success)throw Error('Read-only backup '+path+' HTTP '+r.status);return d.result;}
mkdirSync('studio-backup',{recursive:true});
const settings=await api('/workers/scripts/'+worker+'/settings');
if(settings.bindings.find(b=>b.name==='DB')?.id!==database||settings.bindings.find(b=>b.name==='LIVE_STATUS_KV')?.namespace_id!=='1678e0f0cc6c4facb360346df667445c'||settings.bindings.find(b=>b.name==='MEDIA_R2')?.bucket_name!=='heavenlykey-media-engine')throw Error('Live resources changed; stop and inspect before deployment.');
const deployments=await api('/workers/scripts/'+worker+'/deployments');
const current=deployments.deployments[0];if(current?.versions?.length!==1||current.versions[0].percentage!==100)throw Error('Current traffic split requires a reviewed rollback plan.');
const source=await fetch(base+'/workers/scripts/'+worker+'/content/v2',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});if(!source.ok)throw Error('Source backup HTTP '+source.status);const bytes=Buffer.from(await source.arrayBuffer());
writeFileSync('studio-backup/worker-source.bin',bytes);writeFileSync('studio-backup/worker-settings.json',JSON.stringify(settings,null,2));
const schema=await api('/d1/database/'+database+'/query',{sql:"SELECT type,name,tbl_name,sql FROM sqlite_master WHERE type IN ('table','index','trigger') ORDER BY type,name"});
writeFileSync('studio-backup/database-schema.json',JSON.stringify(schema,null,2));
const migrations=await api('/d1/database/'+database+'/query',{sql:'SELECT name FROM d1_migrations ORDER BY id'});
const report={recordedAt:new Date().toISOString(),account,worker,database,previousVersion:current.versions[0].version_id,deployments,bookmark:await api('/d1/database/'+database+'/time_travel/bookmark'),sourceContentType:source.headers.get('content-type'),sourceBytes:bytes.length,sourceSha256:createHash('sha256').update(bytes).digest('hex'),migrationNames:migrations[0]?.results?.map(r=>r.name),rollback:'Restore previousVersion using Cloudflare Worker version deployment. No SQL, credentials, bindings or R2 objects are modified by this backup.'};
writeFileSync('studio-backup/recovery.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({recordedAt:report.recordedAt,worker,previousVersion:report.previousVersion,sourceBytes:bytes.length,migrationNames:report.migrationNames,backup:'Saved privately; database export follows. No production change.'},null,2));
