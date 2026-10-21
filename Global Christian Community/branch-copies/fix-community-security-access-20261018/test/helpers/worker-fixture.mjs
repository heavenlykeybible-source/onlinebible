import {DatabaseSync} from 'node:sqlite';
import {stripTypeScriptTypes} from 'node:module';
import {readFileSync,readdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
export async function communityFixture(){
 const base=fileURLToPath(new URL('../..',import.meta.url)),dir=mkdtempSync(path.join(tmpdir(),'community-journey-')),db=new DatabaseSync(':memory:');
 for(const file of readdirSync(path.join(base,'migrations')).filter(x=>x.endsWith('.sql')).sort())db.exec(readFileSync(path.join(base,'migrations',file),'utf8'));
 for(const file of readdirSync(path.join(base,'src')).filter(x=>x.endsWith('.ts'))){
  let source=stripTypeScriptTypes(readFileSync(path.join(base,'src',file),'utf8'));
  source=source.replace(/from (["'])\.\/([a-z-]+)\1/g,(_,q,n)=>'from '+q+'./'+n+'.mjs'+q);
  source=source.replace(/from (["'])\.\.\/public\/([a-z-]+\.js)\1/g,(_,q,n)=>'from '+q+pathToFileURL(path.join(base,'public',n)).href+q);
  writeFileSync(path.join(dir,file.replace(/\.ts$/,'.mjs')),source);
 }
 const worker=(await import(pathToFileURL(path.join(dir,'index.mjs')).href)).default,entries=new Map();
 const statement=(sql,params=[])=>({sql,params,bind(...p){return statement(sql,p);},async first(){return db.prepare(sql).get(...params)||null;},async all(){return {results:db.prepare(sql).all(...params)};},async run(){const r=db.prepare(sql).run(...params);return {meta:{changes:Number(r.changes)}};}});
 const env={DB:{prepare:sql=>statement(sql),async batch(items){db.exec('BEGIN');try{const results=items.map(item=>({results:db.prepare(item.sql).all(...item.params),meta:{changes:db.prepare('SELECT changes() n').get().n}}));db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}},SESSIONS:{async get(k){return entries.get(k)||null;},async put(k,v){entries.set(k,v);},async delete(k){entries.delete(k);}},PASSWORD_PEPPER:'isolated-audit-only',MEDIA:{}};
 let serial=0;
 async function request(route,data,cookie,method=data?'POST':'GET',headers={}){
  const r=await worker.fetch(new Request('https://community.example'+route,{method,headers:{'Content-Type':'application/json','CF-Connecting-IP':'198.51.100.'+(++serial),...(cookie?{Cookie:cookie}:{}),...headers},body:data?JSON.stringify(data):undefined}),env);
  return {status:r.status,data:await r.json(),headers:r.headers,cookie:r.headers.get('set-cookie')?.split(';')[0]};
 }
 return {request,db,env,close(){db.close();rmSync(dir,{recursive:true,force:true});}};
}
