import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

export function validateOwnerDispatch(event,env,checkedOutSha){
 if(env.GITHUB_EVENT_NAME!=='workflow_dispatch')throw Error('Production maintenance is manual only.');
 const repositoryOwner=String(env.GITHUB_REPOSITORY||'').split('/')[0];
 if(!repositoryOwner||![repositoryOwner,'aoemeta247-cell'].includes(env.GITHUB_ACTOR))throw Error('Repository owner authorization required.');
 const expected=String(event.inputs?.approved_commit||'');
 if(!/^[a-f0-9]{40}$/.test(expected)||expected!==env.GITHUB_SHA||expected!==checkedOutSha)throw Error('The reviewed commit must exactly match this workflow and checkout.');
 if(event.inputs?.confirmation!=='APPROVE_PRODUCTION_CHANGE')throw Error('Explicit production confirmation required.');
 return true;
}

if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
 const result=spawnSync('git',['-C',process.env.GITHUB_WORKSPACE||process.cwd(),'rev-parse','HEAD'],{encoding:'utf8'});
 if(result.status!==0)throw Error('Cannot verify the checked-out source.');
 validateOwnerDispatch(event,process.env,result.stdout.trim());
 console.log('Verified manual owner confirmation for the exact checked-out production source.');
}
