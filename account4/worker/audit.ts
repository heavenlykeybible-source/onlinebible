import type {RegistryDb} from "./release-approval";
export interface AuditEvent {
 actorUserId:string;clientId?:string|null;siteId?:string|null;
 action:"release.approved"|"release.rejected"|"client.created"|"site.created";
 details?:Record<string,string|number|boolean|null>;
}
export async function appendAudit(db:RegistryDb,event:AuditEvent):Promise<string>{
 if(!event.actorUserId.trim())throw new Error("Missing actor");
 const id=crypto.randomUUID();
 await db.prepare("INSERT INTO control_client_audit (id,actor_user_id,client_id,site_id,action,detail_json) VALUES (?,?,?,?,?,?)")
 .bind(id,event.actorUserId,event.clientId??null,event.siteId??null,event.action,JSON.stringify(event.details??{})).run();
 return id;
}
