import {publishDraft,type Location} from './cms-storage.ts';
export async function awaitingRoom(db:D1Database){
 const items=await db.prepare(`SELECT e.site,e.kind,e.entry_key AS key,e.version,e.updated_at AS arrivedAt,
 r.editor AS source,p.revision_version AS approvedVersion,p.published_at AS approvedAt,p.published_by AS approvedBy,
 CASE WHEN p.revision_version=e.version THEN 'approved' ELSE 'new_update' END AS status
 FROM cms_entries e LEFT JOIN cms_revisions r ON r.site=e.site AND r.kind=e.kind AND r.entry_key=e.entry_key AND r.version=e.version
 LEFT JOIN cms_publications p ON p.site=e.site AND p.kind=e.kind AND p.entry_key=e.entry_key
 ORDER BY e.updated_at DESC,e.site,e.kind,e.entry_key`).all();
 return {items:items.results};
}
export async function previewUpdate(db:D1Database,location:Location,version:number,actor:string){
 const {site,kind,key}=location;
 if(!Number.isSafeInteger(version)||version<1)throw Object.assign(Error('Choose an update to preview.'),{status:400});
 const result=await db.prepare(`INSERT INTO cms_update_previews(site,kind,entry_key,version,actor)
 SELECT site,kind,entry_key,version,? FROM cms_entries WHERE site=? AND kind=? AND entry_key=? AND version=?
 ON CONFLICT(site,kind,entry_key,actor) DO UPDATE SET version=excluded.version,previewed_at=CURRENT_TIMESTAMP`).bind(actor,site,kind,key,version).run();
 if(!result.meta.changes)throw Object.assign(Error('This update changed. Preview the latest version.'),{status:409});
 return {ok:true,version};
}
export async function approveUpdate(db:D1Database,location:Location,version:number,actor:string){
 const {site,kind,key}=location;
 const preview=await db.prepare('SELECT version FROM cms_update_previews WHERE site=? AND kind=? AND entry_key=? AND actor=?').bind(site,kind,key,actor).first<{version:number}>();
 if(!preview||preview.version!==version)throw Object.assign(Error('Preview this version before approving it.'),{status:409});
 return publishDraft(db,location,version,actor);
}

