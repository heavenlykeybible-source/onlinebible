import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

export async function validateRootMigrationHistory(root){
 const files=(await readdir(join(root,'migrations'))).filter(name=>/^\d{4}_.+\.sql$/.test(name)).sort();
 const supplement='0032_website_ai_inbox.sql',primary=files.filter(name=>name!==supplement),failures=[];
 if(files.length!==40||primary.length!==39||primary.some((name,index)=>!name.startsWith(String(index+1).padStart(4,'0')+'_')))failures.push('Root history must contain 0001–0039 plus the pinned historical 0032 website inbox supplement.');
 if(files.includes(supplement)){
  const sql=await readFile(join(root,'migrations',supplement));
  const sha=createHash('sha1').update('blob '+sql.length+'\0').update(sql).digest('hex');
  if(sha!=='6d243b47bedf06590e33ffedcf11558e9db54ad1')failures.push('Historical website inbox migration changed; preserve its original name and contents.');
 }
 return {files,failures};
}
