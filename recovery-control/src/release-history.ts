/** Recorded GitHub production workflow history, not independent Cloudflare snapshots.
 * A rollback choice is eligible only if its SHA has a verified successful owner-approved production deployment.
 */
type Run={status?:string;conclusion?:string;display_title?:string;created_at?:string;updated_at?:string;html_url?:string;id?:number};
export type Release={sha:string;completedAt:string|null;url:string|null;source:'approved'|'restore'};
function completed(run:Run){return run.status==='completed'&&run.conclusion==='success';}
function parse(run:Run,prefix:string,source:'approved'|'restore'):Release|null{
 if(!completed(run)||typeof run.display_title!=='string'||!run.display_title.startsWith(prefix))return null;
 const sha=run.display_title.slice(prefix.length).trim().toLowerCase();
 if(!/^[0-9a-f]{40}$/.test(sha))return null;
 return {sha,completedAt:run.updated_at||run.created_at||null,url:run.html_url||null,source};
}
function millis(date:string|null){const t=date?Date.parse(date):NaN;return Number.isFinite(t)?t:0;}
export function releaseHistory(approvedRuns:Run[],restoreRuns:Run[],approvedPrefix:string,restorePrefix:string){
 const approved=approvedRuns.map(r=>parse(r,approvedPrefix,'approved')).filter((x):x is Release=>!!x);
 const restores=restoreRuns.map(r=>parse(r,restorePrefix,'restore')).filter((x):x is Release=>!!x);
 const eligible=new Set(approved.map(x=>x.sha));
 const successful=[...approved,...restores.filter(x=>eligible.has(x.sha))].sort((a,b)=>millis(b.completedAt)-millis(a.completedAt));
 const liveRelease=successful[0]||null;
 const older:Release[]=[];
 const seen=new Set(liveRelease?[liveRelease.sha]:[]);
 for(const record of successful){
  if(!eligible.has(record.sha)||seen.has(record.sha))continue;
  seen.add(record.sha);
  older.push(record);
  if(older.length===5)break;
 }
 return {liveRelease,previous:older};
}
