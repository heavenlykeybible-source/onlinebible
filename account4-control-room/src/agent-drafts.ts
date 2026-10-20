import {validateDocument} from "./cms-schema.ts";
import {saveDraft} from "./cms-storage.ts";

interface DraftEnv {DB:D1Database}
const respond=(value:unknown,status=200)=>Response.json(value,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
const failure=(error:string,status=400)=>respond({error},status);
const siteOk=(x:unknown)=>typeof x==="string"&&/^account(?:[1-3]|[5-6])$/.test(x);
const entryOk=(x:unknown)=>typeof x==="string"&&/^[-A-Za-z0-9_/]{1,100}$/.test(x);
export async function submitAgentDraft(env:DraftEnv,input:unknown,identity:string):Promise<Response>{
 if(!input||typeof input!=="object"||Array.isArray(input))return failure("Invalid draft");
 const d=input as Record<string,unknown>;
 if(Object.keys(d).some(k=>!["site","kind","key","content","description"].includes(k)))return failure("Unexpected fields");
 if(!siteOk(d.site)||!["page","menu","footer"].includes(String(d.kind))||!entryOk(d.key))return failure("Invalid draft location");
 if(typeof d.description!=="string"||d.description.length<1||d.description.length>500)return failure("Invalid description");
 let content;
 try{content=validateDocument(d.kind as string,d.content)}catch{return failure("Invalid CMS document")}
 const documentJson=JSON.stringify(content);
 if(documentJson.length>120000)return failure("Draft exceeds size limit",413);
 const result=await env.DB.batch([
  env.DB.prepare("INSERT INTO cms_agent_drafts(site,kind,entry_key,document_json,description,submitted_by) VALUES(?,?,?,?,?,?)")
    .bind(d.site,d.kind,d.key,documentJson,d.description,identity),
  env.DB.prepare("INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)")
    .bind(identity,"agent-draft-submitted",String(d.site)+"/"+String(d.kind)+"/"+String(d.key))
 ]);
 return respond({ok:true,id:result[0].meta.last_row_id,status:"pending",published:false,requiresOwnerReview:true},201);
}
export async function ownerDraftQueue(request:Request,env:DraftEnv,actor:string):Promise<Response>{
 const url=new URL(request.url),method=request.method;
 if(url.pathname==="/api/agent-drafts"&&method==="GET"){
  const site=url.searchParams.get("site");
  if(site!==null&&!siteOk(site))return failure("Unknown site");
  const rows=await env.DB.prepare("SELECT id,site,kind,entry_key,description,submitted_by,status,created_at FROM cms_agent_drafts WHERE (? IS NULL OR site=?) ORDER BY id DESC LIMIT 50").bind(site,site).all();
  return respond({items:rows.results});
 }
 const m=/^\/api\/agent-drafts\/(\d+)$/.exec(url.pathname);
 if(!m)return failure("Not found",404);
 const id=Number(m[1]);
 if(!Number.isSafeInteger(id)||id<=0)return failure("Invalid draft ID");
 const row=await env.DB.prepare("SELECT id,site,kind,entry_key,document_json,description,status FROM cms_agent_drafts WHERE id=?").bind(id).first<{id:number;site:string;kind:string;entry_key:string;document_json:string;description:string;status:string}>();
 if(!row)return failure("Draft not found",404);
 if(method==="GET")return respond({id:row.id,site:row.site,kind:row.kind,key:row.entry_key,description:row.description,content:JSON.parse(row.document_json),status:row.status,published:false});
 if(method!=="POST")return failure("Method not allowed",405);
 if(row.status!=="pending")return failure("Draft already reviewed",409);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return failure("JSON required",415);
 const raw=await request.text();if(raw.length>2000)return failure("Request too large",413);
 let payload:Record<string,unknown>;
 try{payload=JSON.parse(raw)}catch{return failure("Invalid JSON")}
 if(payload.action==="reject"){
  await env.DB.batch([
   env.DB.prepare("UPDATE cms_agent_drafts SET status='rejected',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(actor,id),
   env.DB.prepare("INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)").bind(actor,"agent-draft-rejected",String(id))
  ]);
  return respond({ok:true,id,status:"rejected"});
 }
 if(payload.action!=="accept"||!Number.isSafeInteger(payload.expectedVersion)||Number(payload.expectedVersion)<0||Object.keys(payload).some(k=>!["action","expectedVersion"].includes(k)))return failure("Expected action and current draft version");
 // This is a private CMS draft only. It NEVER publishes or changes source code.
 const saved=await saveDraft(env.DB,{site:row.site,kind:row.kind,key:row.entry_key},JSON.parse(row.document_json),Number(payload.expectedVersion),actor);
 await env.DB.batch([
  env.DB.prepare("UPDATE cms_agent_drafts SET status='reviewed',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(actor,id),
  env.DB.prepare("INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)").bind(actor,"agent-draft-reviewed",String(id))
 ]);
 return respond({ok:true,id,status:"reviewed",privateDraftVersion:saved.version,published:false});
}
