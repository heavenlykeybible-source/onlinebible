import {repairScope,pathWithinRepairScope} from './repair-scopes';

type SourceEnv={GITHUB_SOURCE_READ_TOKEN?:string;GITHUB_REPOSITORY?:string;GITHUB_SOURCE_REF?:string};
const MAX_FILE_BYTES=120000;
const MAX_FILES=8;
const safePath=/^[a-zA-Z0-9_.@/-]+\.(?:ts|tsx|js|jsx|css|html|json|md|txt)$/;
const forbidden=/(?:^|\/)(?:\.git|node_modules|\.env(?:\.[^/]*)?|\.ssh|secrets?|private-keys?|migrations?)(?:\/|$)/i;

function safeRepository(value:string){return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);}
function safeRef(value:string){return /^[A-Za-z0-9._/-]{1,120}$/.test(value)&&!value.includes('..')&&!value.startsWith('/')&&!value.endsWith('/');}
function validatePath(path:string,scope:any){
 if(path.length<3||path.length>180||!safePath.test(path)||forbidden.test(path)||path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>!p||p==='.'||p==='..'))return false;
 return pathWithinRepairScope(path,scope);
}

/**
 * Read-only source inspection for an authenticated maintenance AI.
 * The GitHub credential is server-side only and must be a dedicated contents:read token.
 * Account 4, auth, secrets, migrations, deployment files and files outside the selected
 * feature scope can never be read through this helper.
 */
export async function readScopedSource(input:any,env:SourceEnv){
 const account=String(input?.account||''),scope=repairScope(String(input?.repairScope||''),account);
 if(!scope)return {ok:false,error:'Choose a valid Account 1-3 repair scope.'};
 const repository=String(env.GITHUB_REPOSITORY||'aoemeta247-cell/All-Nations-For-Christ-Outreach');
 const ref=String(input?.ref||env.GITHUB_SOURCE_REF||'main');
 const token=env.GITHUB_SOURCE_READ_TOKEN;
 if(!token)return {ok:false,error:'Scoped source inspection is not configured. Add a dedicated read-only GitHub source token to Account 4.'};
 if(!safeRepository(repository)||!safeRef(ref))return {ok:false,error:'Source repository configuration is invalid.'};
 const paths=Array.isArray(input?.paths)?input.paths.map(String):[];
 if(paths.length<1||paths.length>MAX_FILES)return {ok:false,error:`Choose 1-${MAX_FILES} source files to inspect.`};
 const unique=[...new Set(paths)];
 if(unique.length!==paths.length||unique.some(path=>!validatePath(path,scope)))return {ok:false,error:'A requested source file is outside the selected repair scope or is protected.'};
 const files=[] as any[];
 for(const path of unique){
  const url=`https://api.github.com/repos/${repository}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`;
  const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github.raw+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'heavenly-key-account4-source-reader'}});
  if(!response.ok){files.push({path,error:`Source read failed (${response.status}).`});continue;}
  const declared=Number(response.headers.get('content-length')||0);if(declared>MAX_FILE_BYTES){files.push({path,error:'Source file exceeds inspection limit.'});continue;}
  const text=await response.text();if(new TextEncoder().encode(text).length>MAX_FILE_BYTES){files.push({path,error:'Source file exceeds inspection limit.'});continue;}
  files.push({path,content:text});
 }
 return {ok:true,account,repairScope:scope.id,scopeLabel:scope.label,ref,files,note:'Read-only feature-scoped inspection. Credentials, Account 4 core, auth, migrations and deployment infrastructure are inaccessible.'};
}
