import {readFile,access} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const args=process.argv.slice(2),release=args.includes('--release');
const option=args.indexOf('--config');
if(option>=0&&(!args[option+1]||args[option+1].startsWith('--')))throw Error('Supply a TOML path after --config.');
const configPath=option<0?fileURLToPath(new URL('../wrangler.toml',import.meta.url)):resolve(args[option+1]);
const config=await readFile(configPath,'utf8'),directory=dirname(configPath);
// Inspect the selected target configuration, not another account's default file.
const sections=new Map();let section='';
for(const line of config.split(/\r?\n/)){
 const heading=line.match(/^\s*\[\[?([^\]]+)\]\]?\s*(?:#.*)?$/);
 if(heading){section=heading[1];if(sections.has(section))throw Error('Duplicate section in target config: '+section);sections.set(section,{});continue;}
 const pair=line.match(/^\s*(\w+)\s*=\s*(["'])(.*?)\2\s*(?:#.*)?$/);
 if(pair){if(!sections.has(section))sections.set(section,{});sections.get(section)[pair[1]]=pair[3];}
}
const root=sections.get('')||{},vars=sections.get('vars')||{};
for(const secret of ['SESSION_SECRET','PASSWORD_PEPPER','INTERSERVICE_SECRET']){
 if(new RegExp('^\\s*'+secret+'\\s*=', 'm').test(config))throw Error('Never store secret values in TOML: '+secret);
}
for(const [name,binding] of [['d1_databases','DB'],['kv_namespaces','SESSIONS'],['r2_buckets','MEDIA']]){
 if(sections.get(name)?.binding!==binding)throw Error('Missing required '+binding+' binding in '+configPath);
}
const placeholders=[...new Set([...config.matchAll(/REPLACE_[A-Z0-9_]+/g)].map(match=>match[0]))];
if(release&&placeholders.length)throw Error('Release blocked: unresolved target resources: '+placeholders.join(', '));
if(release){
 if(!/^[a-f0-9-]{36}$/i.test(sections.get('d1_databases').database_id||''))throw Error('Invalid target D1 database ID.');
 if(!/^[a-f0-9]{32}$/i.test(sections.get('kv_namespaces').id||''))throw Error('Invalid target session KV ID.');
 if(!sections.get('r2_buckets').bucket_name)throw Error('Target media bucket name is missing.');
}
let origin;try{origin=new URL(vars.PUBLIC_ORIGIN);}catch{throw Error('A valid PUBLIC_ORIGIN is required.');}
if(origin.protocol!=='https:'||origin.origin!==vars.PUBLIC_ORIGIN)throw Error('PUBLIC_ORIGIN must be an HTTPS origin without a path.');
if(!root.main||!sections.get('assets')?.directory)throw Error('Worker entry point and public assets directory are required.');
await access(resolve(directory,root.main));
await access(resolve(directory,sections.get('assets').directory));
if(!/run_worker_first\s*=\s*\[[^\]]*["']\/api\/\*["']/.test(config))throw Error('API routes must run through the Worker before static assets.');
console.log((release?'RELEASE':'DEVELOPMENT')+' CONFIGURATION CHECK PASSED: '+configPath);
console.log('This offline check does not certify deployment readiness. Verify target resource ownership, existing secrets, applied migrations, domain routing and live behavior separately.');
