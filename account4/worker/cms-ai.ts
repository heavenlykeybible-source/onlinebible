import type {VerifyOwner} from "./approval-handler";
interface Statement {bind(...args:unknown[]):Statement;first<T=unknown>():Promise<T|null>;all<T=unknown>():Promise<{results:T[]}>;run():Promise<{meta?:{changes?:number}}>;}
export interface CmsDb {prepare(sql:string):Statement}
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createCmsAiRouter(verifyOwner:VerifyOwner){
 return async(req:Request,db:CmsDb):Promise<Response>=>{
  const owner=await verifyOwner(req);if(!owner)return reply({error:"forbidden"},403);
  const url=new URL(req.url),path=url.pathname;
  if(req.method==="GET"&&path==="/api/control/cms/documents"){
   const siteId=url.searchParams.get("siteId");
   if(!siteId||!uuid.test(siteId))return reply({error:"invalid_site"},400);
   const rows=await db.prepare("SELECT id,site_id,path,title,version,status,updated_at FROM control_cms_documents WHERE site_id=? ORDER BY updated_at DESC LIMIT 200").bind(siteId).all();
   return reply({documents:rows.results});
  }
  if(req.method==="GET"&&/^\/api\/control\/cms\/documents\/[0-9a-f-]{36}$/i.test(path)){
   const id=path.split("/").pop()!;
   const document=await db.prepare("SELECT * FROM control_cms_documents WHERE id=?").bind(id).first();
   return document?reply({document}):reply({error:"not_found"},404);
  }
  if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
  if(req.headers.get("Origin")!==url.origin)return reply({error:"invalid_origin"},403);
  if(!req.headers.get("Content-Type")?.startsWith("application/json"))return reply({error:"invalid_content_type"},415);
  if(Number(req.headers.get("Content-Length")||0)>131072)return reply({error:"body_too_large"},413);
  const raw=await req.text();if(new TextEncoder().encode(raw).length>131072)return reply({error:"body_too_large"},413);
  let data:unknown;try{data=JSON.parse(raw)}catch{return reply({error:"invalid_body"},400)}
  if(!data||typeof data!=="object"||Array.isArray(data))return reply({error:"invalid_body"},400);
  const b=data as Record<string,unknown>;
  if(path==="/api/control/cms/documents"){
   if(typeof b.siteId!=="string"||!uuid.test(b.siteId)||typeof b.path!=="string"||!/^\/[a-z0-9/_-]{1,180}$/i.test(b.path)||typeof b.title!=="string"||!b.title.trim()||b.title.length>160||typeof b.body!=="string"||b.body.length>100000)return reply({error:"invalid_document"},400);
   const id=crypto.randomUUID();
   try{await db.prepare("INSERT INTO control_cms_documents(id,site_id,path,title,body,updated_by) VALUES(?,?,?,?,?,?)").bind(id,b.siteId,b.path,b.title.trim(),b.body,owner.userId).run()}
   catch{return reply({error:"site_missing_or_path_conflict"},409)}
   return reply({id,status:"draft",version:1},201);
  }
  const edit=path.match(/^\/api\/control\/cms\/documents\/([0-9a-f-]{36})\/save$/i);
  if(edit){
   if(!uuid.test(edit[1])||typeof b.body!=="string"||b.body.length>100000||!Number.isSafeInteger(b.version)||Number(b.version)<1)return reply({error:"invalid_document"},400);
   const result=await db.prepare("UPDATE control_cms_documents SET body=?,version=version+1,status='draft',updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND status='draft'").bind(b.body,owner.userId,edit[1],b.version).run();
   return result.meta?.changes===1?reply({status:"saved",version:Number(b.version)+1}):reply({error:"version_conflict_or_not_draft"},409);
  }
  if(path==="/api/control/ai/suggestions"){
   if(typeof b.documentId!=="string"||!uuid.test(b.documentId)||typeof b.instruction!=="string"||!b.instruction.trim()||b.instruction.length>5000||typeof b.proposedBody!=="string"||b.proposedBody.length>100000||!Number.isSafeInteger(b.baseVersion)||Number(b.baseVersion)<1)return reply({error:"invalid_suggestion"},400);
   const id=crypto.randomUUID();
   const doc=await db.prepare("SELECT version,status FROM control_cms_documents WHERE id=?").bind(b.documentId).first<{version:number;status:string}>();
   if(!doc||doc.version!==b.baseVersion||doc.status!=="draft")return reply({error:"document_conflict"},409);
   await db.prepare("INSERT INTO control_ai_suggestions(id,document_id,requested_by,instruction,proposed_body,base_version) VALUES(?,?,?,?,?,?)").bind(id,b.documentId,owner.userId,b.instruction,b.proposedBody,b.baseVersion).run();
   return reply({id,status:"pending",note:"Suggestion saved for human review; no AI model has been invoked and no website has been changed"},201);
  }
  return reply({error:"not_found"},404);
 };
}
