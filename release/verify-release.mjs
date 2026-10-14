// Read-only release metadata validator. No network, credentials, or mutations.
import {readFileSync} from 'node:fs';
const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const catalog=load('./service-catalog.json'), manifest=load('./heavenly-key-release-manifest.json');
const fail = msg => {throw Error('Release manifest invalid: '+msg);};
if(catalog.version!==1 || manifest.schemaVersion!==1)fail('unsupported schema');
if(catalog.services.length!==6 || manifest.services.length!==6)fail('expected six services');
const ids=new Set(catalog.services.map(s=>s.id));
if(ids.size!==6)fail('duplicate service id');
for(const [index,s] of catalog.services.entries()){
 if(s.account!==index+1)fail('account order mismatch');
 if(!s.owner || !s.protected?.length)fail('missing owner or protected state');
 if(manifest.services[index]?.account!==s.account)fail('manifest account mismatch');
}
if(manifest.status!=='preflight-blocked')fail('production must remain gated until independently verified');
for(const field of ['passwords','user-profiles','sessions','database-copies','production-secrets'])
 if(!manifest.prohibitedSync.includes(field))fail('missing prohibited sync: '+field);
if(!manifest.releaseGates?.includes('owner-production-approval'))fail('missing approval gate');

const expected = ['website','studio','community','control','app','bible'];
for(let i=0;i<expected.length;i++){
 if(catalog.services[i].id!==expected[i])fail('incorrect service mapping: '+expected[i]);
}
if(catalog.workspace!==manifest.coordinationRepository)fail('workspace mismatch');
if(catalog.copyStages.length!==3)fail('copy stages must be explicit');
const byKey=new Map(manifest.services.map(s=>[s.key,s]));
if(byKey.size!==6)fail('duplicate manifest key');
for(const service of catalog.services){
 const counterpart=byKey.get(service.id);
 if(!counterpart || counterpart.account!==service.account)fail('catalog and manifest disagree: '+service.id);
 if(service.repository && counterpart.source!==service.repository)fail('repository mismatch: '+service.id);
}
const blocked=new Set(['passwords','user-profiles','sessions','private-messages','private-prayer-requests','database-copies','production-secrets']);
for(const item of blocked)if(!manifest.prohibitedSync.includes(item))fail('unsafe sync exclusion missing: '+item);
for(const rule of manifest.automaticContentPropagation){
 if(!byKey.has(rule.origin))fail('unknown content origin: '+rule.origin);
 for(const consumer of rule.consumers)if(!byKey.has(consumer))fail('unknown content consumer: '+consumer);
 if(rule.consumers.includes(rule.origin))fail('self-referential sync rule');
}

console.log('Six-account release metadata valid. Live deployment is NOT certified.');
