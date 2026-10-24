import {readFileSync,writeFileSync} from 'node:fs';
import {targets} from './worker.mjs';
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN,zone='23f3be9052bf609e8ccd85ac1b375019',script='heavenlykey-portals';
if(account!=='a160ba9fc74911bd4b3005eac86eefcb'||!token)throw Error('Account 1 configuration missing');
const hosts=['studioroom','controlroom','app','bible','global','meeting','mediaeditor','radio'].map(x=>x+'.heavenlykey.org');
async function api(path,init={}){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{...init,headers:{Authorization:'Bearer '+token,...init.headers}});const j=await r.json();if(!r.ok||!j.success)throw Error('Cloudflare HTTP '+r.status+' '+path+' '+JSON.stringify(j.errors));return j.result;}
const z=await api('/zones/'+zone);if(z.name!=='heavenlykey.org'||z.account.id!==account)throw Error('Zone/account mismatch');
const routePath='/zones/'+zone+'/workers/routes',routes=await api(routePath),domains=await api('/accounts/'+account+'/workers/domains');
const records={};for(const h of hosts)records[h]=await api('/zones/'+zone+'/dns_records?name='+h);
writeFileSync('portal-routing-before.json',JSON.stringify({zone,account,routes,domains,records},null,2));
// Preserve the working portals; refuse to switch a healthy host to an unavailable upstream.
for(const h of hosts.filter(h=>!h.startsWith('mediaeditor.'))){const r=await fetch(targets[h]+'/',{redirect:'manual',signal:AbortSignal.timeout(20000)});if(r.status>=500||r.status===404)throw Error('Destination unavailable: '+h+' HTTP '+r.status);}
const form=new FormData();form.set('metadata',new Blob([JSON.stringify({main_module:'worker.mjs',compatibility_date:'2026-10-01',compatibility_flags:['global_fetch_strictly_public']})],{type:'application/json'}));form.set('worker.mjs',new Blob([readFileSync('portal-router/worker.mjs')],{type:'application/javascript+module'}),'worker.mjs');
await api('/accounts/'+account+'/workers/scripts/'+script,{method:'PUT',body:form});
for(const h of hosts){
 const custom=domains.find(x=>x.hostname===h);
 if(custom&&custom.service!==script)await api('/accounts/'+account+'/workers/domains',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({hostname:h,service:script,environment:'production',zone_id:zone})});
 if(!custom){
  const dns=records[h].filter(x=>['A','AAAA','CNAME'].includes(x.type));
  if(dns.length>1)throw Error('Multiple address records require review: '+h);
  if(!dns.length)await api('/zones/'+zone+'/dns_records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'A',name:h,content:'192.0.2.1',proxied:true,ttl:1,comment:'Exact ministry Worker route; no origin server required'})});
  else if(!dns[0].proxied||h.startsWith('mediaeditor.'))await api('/zones/'+zone+'/dns_records/'+dns[0].id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'A',name:h,content:'192.0.2.1',proxied:true,ttl:1,comment:'Exact ministry Worker route; original DNS saved before repair'})});
 }
 const pattern=h+'/*',old=routes.find(x=>x.pattern===pattern);
 if(!old||old.script!==script)await api(routePath+(old?'/'+old.id:''),{method:old?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern,script})});
 console.log('Account 1 portal route confirmed: '+h);
}
