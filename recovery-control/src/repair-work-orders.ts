import {repairScope} from './repair-scopes';

type WorkEnv={DB:D1Database};
const SHA=/^[a-f0-9]{40}$/i;
const STATUSES=['diagnosing','repairing','quarantined','testing','preview-ready','awaiting-owner','approved','deploying','verified','failed','cancelled'] as const;
type Status=typeof STATUSES[number];
const transitions:Record<Status,Status[]>={
 diagnosing:['repairing','failed','cancelled'],repairing:['quarantined','failed','cancelled'],quarantined:['testing','failed','cancelled'],testing:['preview-ready','failed','cancelled'],'preview-ready':['awaiting-owner','failed','cancelled'],'awaiting-owner':['approved','cancelled'],approved:['deploying','cancelled'],deploying:['verified','failed'],verified:[],failed:['diagnosing','repairing','cancelled'],cancelled:[]
};
function clean(value:unknown,max:number){return String(value||'').trim().slice(0,max);}
export async function createRepairWorkOrder(input:any,env:WorkEnv,actor:string){
 const account=clean(input?.account,1),scope=repairScope(clean(input?.repairScope,80),account),problem=clean(input?.problem,2000),baseline=clean(input?.baselineSha,40);
 if(!scope)return {ok:false,error:'Choose one valid repair scope.'};
 if(problem.length<6)return {ok:false,error:'Describe the problem to repair.'};
 if(baseline&&!SHA.test(baseline))return {ok:false,error:'baselineSha must be an exact 40-character Git commit SHA.'};
 const id=crypto.randomUUID(),scopeJson=JSON.stringify({repairScope:scope.id,label:scope.label,roots:scope.roots});
 await env.DB.batch([
  env.DB.prepare('INSERT INTO account4_repair_work_orders(id,account_no,component,problem_statement,requested_by,assigned_provider,baseline_sha,status,scope_json,tests_json) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,account,scope.id,problem,actor,['chatgpt','claude','gemini','custom'].includes(actor)?actor:null,baseline||null,'diagnosing',scopeJson,'[]'),
  env.DB.prepare('INSERT INTO account4_repair_events(work_order_id,event_type,actor,detail) VALUES(?,?,?,?)').bind(id,'created',actor,'Feature-scoped work order created. Account 4, secrets, persistent data and unrelated features remain outside authorization.')
 ]);
 return {ok:true,id,status:'diagnosing',account,repairScope:scope.id,scopeLabel:scope.label,baselineSha:baseline||null,next:'Inspect only the selected scope, diagnose, then submit a scoped repair candidate.'};
}
export async function getRepairWorkOrder(id:string,env:WorkEnv,actor:string){
 const row=await env.DB.prepare('SELECT id,account_no,component,problem_statement,requested_by,assigned_provider,baseline_sha,candidate_sha,package_id,status,scope_json,tests_json,preview_url,rollback_sha,created_at,updated_at FROM account4_repair_work_orders WHERE id=? AND (requested_by=? OR assigned_provider=?)').bind(id,actor,actor).first<any>();
 if(!row)return {ok:false,error:'Work order not found for this connector.'};
 const events=await env.DB.prepare('SELECT event_type,actor,detail,created_at FROM account4_repair_events WHERE work_order_id=? ORDER BY id DESC LIMIT 30').bind(id).all();
 return {ok:true,workOrder:row,events:events.results||[]};
}
export async function listRepairWorkOrders(env:WorkEnv,actor:string){
 const rows=await env.DB.prepare('SELECT id,account_no,component,problem_statement,baseline_sha,candidate_sha,package_id,status,preview_url,created_at,updated_at FROM account4_repair_work_orders WHERE requested_by=? OR assigned_provider=? ORDER BY updated_at DESC LIMIT 30').bind(actor,actor).all();
 return {ok:true,items:rows.results||[]};
}
export async function attachRepairPackage(workOrderId:string,packageId:string,env:WorkEnv,actor:string){
 const row=await env.DB.prepare('SELECT id,status,requested_by,assigned_provider FROM account4_repair_work_orders WHERE id=?').bind(workOrderId).first<any>();
 if(!row||(row.requested_by!==actor&&row.assigned_provider!==actor))return {ok:false,error:'Work order not found for this connector.'};
 if(!['diagnosing','repairing','failed'].includes(row.status))return {ok:false,error:'Work order is not accepting a repair candidate in its current state.'};
 await env.DB.batch([
  env.DB.prepare("UPDATE account4_repair_work_orders SET package_id=?,status='quarantined',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(packageId,workOrderId),
  env.DB.prepare('INSERT INTO account4_repair_events(work_order_id,event_type,actor,detail) VALUES(?,?,?,?)').bind(workOrderId,'candidate_quarantined',actor,'Scoped repair candidate attached. It is not executed or deployed.')
 ]);
 return {ok:true,id:workOrderId,status:'quarantined',packageId,next:'Run isolated validation and tests.'};
}
export async function transitionRepairWorkOrder(input:any,env:WorkEnv,actor:string){
 const id=clean(input?.id,80),to=clean(input?.status,40) as Status,detail=clean(input?.detail,1000);
 if(!STATUSES.includes(to))return {ok:false,error:'Invalid repair status.'};
 const row=await env.DB.prepare('SELECT status,requested_by,assigned_provider FROM account4_repair_work_orders WHERE id=?').bind(id).first<any>();
 if(!row||(row.requested_by!==actor&&row.assigned_provider!==actor))return {ok:false,error:'Work order not found for this connector.'};
 const from=row.status as Status;if(!transitions[from]?.includes(to))return {ok:false,error:`Unsafe status transition ${from} -> ${to}.`};
 // AI connectors may advance diagnosis/repair/quarantine/testing metadata, but may never approve, deploy or mark production verified.
 if(['approved','deploying','verified'].includes(to))return {ok:false,error:'Production authority is owner-only.'};
 await env.DB.batch([
  env.DB.prepare('UPDATE account4_repair_work_orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(to,id),
  env.DB.prepare('INSERT INTO account4_repair_events(work_order_id,event_type,actor,detail) VALUES(?,?,?,?)').bind(id,'status:'+to,actor,detail||`${from} -> ${to}`)
 ]);
 return {ok:true,id,from,status:to};
}
