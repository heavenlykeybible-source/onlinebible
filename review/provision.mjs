/* Build isolated Account 4 preview resources and temporary Wrangler configuration.
 * Never read or write production D1/KV/R2 IDs. */
import {writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const a=process.argv[2];
if(!['1','2','3'].includes(a))throw Error('Account must be 1, 2 or 3');
const token=process.env.CLOUDFLARE_API_TOKEN,id=process.env.CLOUDFLARE_ACCOUNT_ID;
if(!token||!id||!/^[a-f0-9]{40}$/.test(process.env.TARGET_SHA||''))throw Error('Account 4 credentials or exact commit are missing');
const prefix='heavenlykey-review-'+a;
const parts={
 '1':{kv:['SESSIONS_KV','RATE_LIMIT_KV','LIVE_STATUS_KV'],r2Binding:'MEDIA_R2',migrations:'../migrations',assets:'../heavenly-key-website'},
 '2':{kv:['LIVE_STATUS_KV'],r2Binding:'MEDIA_R2',migrations:'../media-engine/migrations'},
 '3':{kv:['SESSIONS'],r2Binding:'MEDIA',migrations:'../global-community/migrations',assets:'../global-community/public'}
}[a];
async function api(path){
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+id+path,{headers:{Authorization:'Bearer '+token}});
 if(!r.ok)throw Error('Cloudflare Account 4 lookup failed: HTTP '+r.status);
 const obj=await r.json();if(!obj.success)throw Error('Account 4 resource lookup was rejected');
 return obj.result||[];
}
function create(...args){
 const r=spawnSync('npx',['--yes','wrangler@4.145.0',...args],{env:process.env,encoding:'utf8',maxBuffer:1024*1024});
 if(r.status!==0)console.log('Resource creation did not complete; checking for an existing resource');
}
const dbName=prefix+'-db';
let db=(await api('/d1/database?per_page=100')).find(x=>x.name===dbName);
if(!db){create('d1','create',dbName);db=(await api('/d1/database?per_page=100')).find(x=>x.name===dbName);}
if(!db?.uuid)throw Error('Isolated Account 4 D1 database unavailable: '+dbName);
const kvs=[];
for(const binding of parts.kv){
 const title=prefix+'-'+binding.toLowerCase().replaceAll('_','-');
 let item=(await api('/storage/kv/namespaces?per_page=100')).find(x=>x.title===title);
 if(!item){create('kv','namespace','create',title);item=(await api('/storage/kv/namespaces?per_page=100')).find(x=>x.title===title);}
 if(!item?.id)throw Error('Isolated Account 4 KV unavailable: '+title);
 kvs.push({binding,id:item.id});
}
const r2=prefix+'-media';
create('r2','bucket','create',r2);
const q=x=>JSON.stringify(x);
const lines=[
'name = '+q(prefix),'main = '+q('./entry-'+a+'.ts'),
'compatibility_date = "2025-01-01"','workers_dev = true','routes = []','keep_vars = true',
'[[d1_databases]]','binding = "DB"','database_name = '+q(dbName),'database_id = '+q(db.uuid),
'migrations_dir = '+q(parts.migrations),
'[[r2_buckets]]','binding = '+q(parts.r2Binding),'bucket_name = '+q(r2)
];
for(const k of kvs)lines.push('[[kv_namespaces]]','binding = '+q(k.binding),'id = '+q(k.id));
if(parts.assets)lines.push('[assets]','directory = '+q(parts.assets),'binding = "ASSETS"','run_worker_first = true');
// The Global Community uses exactly one Heavenly Key AI assistant across search,
// Gospel Design Cards and articles. Enable AI ONLY inside the isolated Account 4
// preview. Do not touch Cloudflare Account 3's production configuration or secrets.
if(a==='3')lines.push('[ai]','binding = "AI"');
lines.push('[vars]','REVIEW_SHA = '+q(process.env.TARGET_SHA));
if(a==='1')lines.push('MEDIA_ENGINE_URL = "https://heavenlykey-review-2.emmanuel2026miracle.workers.dev"','PUBLIC_SITE_URL = "https://heavenlykey-review-1.emmanuel2026miracle.workers.dev"');
if(a==='2')lines.push('MEDIA_ENGINE_VERSION = "account4-review"');
if(a==='3')lines.push('PUBLIC_ORIGIN = "https://heavenlykey-review-3.emmanuel2026miracle.workers.dev"','PLATFORM_NAME = "Global Christian Community - Account 4 Review"');
lines.push('[triggers]','crons = []');
writeFileSync('review/account-'+a+'.toml',lines.join('\n')+'\n');
console.log('Generated isolated review configuration for Account '+a+'; nothing deployed to production.');
