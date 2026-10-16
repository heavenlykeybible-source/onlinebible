import {approveRelease,sha256Valid} from "./release-policy";
export interface RegistryStatement {
 bind(...args:unknown[]):RegistryStatement;
 first<T=unknown>():Promise<T|null>;
 run():Promise<{meta?:{changes?:number}}>;
}
export interface RegistryDb {
 prepare(sql:string):RegistryStatement;
 batch(statements:RegistryStatement[]):Promise<Array<{meta?:{changes?:number}}>>;
}
type ReleaseRow={id:string;site_id:string;artifact_sha256:string;status:"preview"|"approved"|"draft"|"building"|"rejected"|"deploying"|"deployed"|"failed";approved_by:string|null};
export async function approvePreview(db:RegistryDb,input:{releaseId:string;siteId:string;expectedSha256:string;ownerUserId:string}):Promise<"approved"|"conflict"|"not_found">{
 if(!sha256Valid(input.expectedSha256)||!input.ownerUserId.trim())return "conflict";
 const row=await db.prepare("SELECT id,site_id,artifact_sha256,status,approved_by FROM control_client_releases WHERE id=? AND site_id=?")
 .bind(input.releaseId,input.siteId).first<ReleaseRow>();
 if(!row)return "not_found";
 let approval:ReturnType<typeof approveRelease>;
 try { approval=approveRelease({releaseId:row.id,siteId:row.site_id,artifactSha256:row.artifact_sha256,state:row.status,expectedSha256:input.expectedSha256,actorId:input.ownerUserId,now:new Date().toISOString()}); }
 catch { return "conflict"; }
 // D1 batch executes statements in one transaction and rolls back both on failure.
 // The audit INSERT ... SELECT is conditional on the approved row, so a competing
 // approval cannot produce a false audit record.
 const update=db.prepare("UPDATE control_client_releases SET status='approved',approved_by=?,approved_at=? WHERE id=? AND site_id=? AND status='preview' AND artifact_sha256=? AND approved_by IS NULL")
 .bind(approval.approvedBy,approval.approvedAt,approval.releaseId,approval.siteId,approval.artifactSha256);
 const audit=db.prepare("INSERT INTO control_client_audit (id,actor_user_id,client_id,site_id,action,detail_json) SELECT ?,?,NULL,site_id,'release.approved',? FROM control_client_releases WHERE id=? AND site_id=? AND status='approved' AND approved_by=? AND approved_at=? AND artifact_sha256=?")
 .bind(crypto.randomUUID(),approval.approvedBy,JSON.stringify({releaseId:approval.releaseId,sha256:approval.artifactSha256}),approval.releaseId,approval.siteId,approval.approvedBy,approval.approvedAt,approval.artifactSha256);
 const results=await db.batch([update,audit]);
 return results[0]?.meta?.changes===1&&results[1]?.meta?.changes===1?"approved":"conflict";
}
