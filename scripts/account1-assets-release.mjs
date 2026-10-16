import {createHash} from 'node:crypto';
const account='a160ba9fc74911bd4b3005eac86eefcb', worker='heavenlykey';
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').trim().replace(/^Bearer\s+/i,'');
if(!token)throw Error('Missing saved Account 1 token');
console.log('::add-mask::'+token);
const base='https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+worker;
const headers={Authorization:'Bearer '+token};
const settingsResponse=await fetch(base+'/settings',{headers});const settings=await settingsResponse.json();
if(!settingsResponse.ok||!settings.success)throw Error('Cannot read current Worker settings: '+JSON.stringify(settings.errors));
const response=await fetch(base+'/content/v2',{headers});
if(!response.ok)throw Error('Cannot read current Worker modules: '+response.status);
const parts=await response.formData();
const modules=[];for(const [name,value] of parts){if(typeof value==='string')modules.push({name,textLength:value.length});else modules.push({name,fileName:value.name,type:value.type,size:value.size,sha256:createHash('sha256').update(Buffer.from(await value.arrayBuffer())).digest('hex')});}
const d=settings.result;
console.log(JSON.stringify({settingsKeys:Object.keys(d),bindings:d.bindings?.map(b=>({name:b.name,type:b.type})),compatibility_date:d.compatibility_date,compatibility_flags:d.compatibility_flags,assets:d.assets,responseHeaders:Object.fromEntries([...response.headers].filter(([k])=>/entry|content-type/.test(k))),modules},null,2));

const domains=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/domains',{headers}).then(r=>r.json());
console.log('DOMAIN MAP',JSON.stringify(domains.result?.map(d=>({hostname:d.hostname,service:d.service,environment:d.environment}))));
const source=await parts.get('index.js').text();
console.log('STATIC HANDLER REFERENCES',source.split('\n').filter(l=>/ASSETS|STATIC|staticOrigin|\.pages\.dev|\.workers\.dev|heavenlykey\.org|portal-router/.test(l)).map(l=>l.slice(0,500)).join('\n'));
