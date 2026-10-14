/** Account 4 restricted stateless MCP bridge for compatible AI clients.
 * AI maintenance is feature-scoped. No MCP tool can approve production, restore,
 * read secrets, or edit Account 4 core authority.
 */
import {canSubmitPackage} from './package-intake';
import {publicRepairCatalog,repairScope,pathWithinRepairScope} from './repair-scopes';
import {acceptScopedRepair} from './scoped-repair-intake';
import {planMaintenanceInstruction} from './maintenance-intent';
import {readScopedSource} from './scoped-source-reader';
type BridgeEnv={DB:D1Database;CODE_INTAKE:R2Bucket;RECOVERY_STATE:KVNamespace;OPENAI_SUBMIT_TOKEN_HASH?:string;CLAUDE_SUBMIT_TOKEN_HASH?:string;GEMINI_SUBMIT_TOKEN_HASH?:string;CUSTOM_SUBMIT_TOKEN_HASH?:string;GITHUB_SOURCE_READ_TOKEN?:string;GITHUB_REPOSITORY?:string;GITHUB_SOURCE_REF?:string};
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'null'};
const MAX_BYTES=250*1024;
const j=(obj:unknown,status=200)=>new Response(JSON.stringify(obj),{status,headers});
export const POLICY={name:'Heavenly Key Account 4 — Surgical AI Repair Gateway',version:'1.4.0',connection:'Per-provider owner-issued Bearer key (not provider OAuth)',acceptedProviders:['chatgpt','claude','gemini','custom'],targetAccounts:['1','2','3'],tools:['get_account4_capabilities','get_repair_scopes','plan_repair_from_message','inspect_repair_scope','submit_scoped_repair','list_my_proposals'],privileges:['Read safe policy','Read feature repair catalog','Turn an owner maintenance message into one feature repair plan','Inspect only source files inside the selected feature scope using a server-side read-only credential','Submit small non-executable repairs limited to one approved feature scope','View own proposal history'],prohibited:['Modify Account 4','Read or rotate production secrets','Expose the GitHub source credential','Read protected auth, migration or deployment source through maintenance tools','Recreate D1/KV/R2','Run production migrations','Deploy or restore production','Approve publication','Change owner passwords or roles'],submissionStatus:'quarantined',promotion:'Routine repair candidates stay feature-scoped and separately validated. Production authority remains governed by Account 4 policy.',persistence:'Routine repairs are code-only. Existing API keys, saved provider connections, users, media and databases remain persistent.',protocol:'MCP Streamable HTTP JSON-RPC (stateless), compatible clients only'} as const;
function response(id:string|number|null,result:unknown){return j({jsonrpc:'2.0',id,result});}
function error(id:string|number|null,code:number,message:string,status=200){return j({jsonrpc:'2.0',id,error:{code,message}},status);}
function toolResult(data:unknown,isError=false){return {content:[{type:'text',text:JSON.stringify(data)}],isError};}
const tools=[
 {name:'get_account4_capabilities',description:'Read the safe AI maintenance policy. No live credentials or secrets are exposed.',inputSchema:{type:'object',additionalProperties:false,properties:{}}},
 {name:'get_repair_scopes',description:'List feature-level repair scopes for Accounts 1-3 so an AI can repair one broken feature without replacing unrelated systems.',inputSchema:{type:'object',additionalProperties:false,properties:{account:{type:'string',enum:['1','2','3']}}}},
 {name:'plan_repair_from_message',description:'Interpret a plain-language maintenance request such as “repair 24/7 Radio sound” and select the smallest permitted account and feature scope. Ambiguous requests return clarification candidates instead of broad access.',inputSchema:{type:'object',additionalProperties:false,required:['message'],properties:{message:{type:'string',minLength:4,maxLength:2000}}}},
 {name:'inspect_repair_scope',description:'Read up to eight explicitly named source files inside one selected repair scope for diagnosis. Uses a server-side read-only GitHub credential which is never returned. Protected Account 4, auth, secret, migration and deployment files are inaccessible.',inputSchema:{type:'object',additionalProperties:false,required:['account','repairScope','paths'],properties:{account:{type:'string',enum:['1','2','3']},repairScope:{type:'string'},ref:{type:'string',minLength:1,maxLength:120},paths:{type:'array',minItems:1,maxItems:8,items:{type:'string',minLength:3,maxLength:180}}}}},
 {name:'submit_scoped_repair',description:'Submit a repair candidate limited to one named feature scope. It is quarantined, not executed or deployed. Existing API keys and persistent data are outside the repair payload.',inputSchema:{type:'object',additionalProperties:false,required:['schemaVersion','account','repairScope','name','files'],properties:{schemaVersion:{type:'integer',const:1},account:{type:'string',enum:['1','2','3']},repairScope:{type:'string'},name:{type:'string',minLength:3,maxLength:80},files:{type:'array',minItems:1,maxItems:25,items:{type:'object',additionalProperties:false,required:['path','content'],properties:{path:{type:'string'},content:{type:'string'}}}}}}},
 {name:'list_my_proposals',description:'Read a short history of proposals submitted using this provider token. Never returns private source content.',inputSchema:{type:'object',additionalProperties:false,properties:{}}}
] as const;
export async function agentHttp(req:Request,env:BridgeEnv){
 const actor=await canSubmitPackage(req,env,false);if(!actor)return j({error:'An Account 4 owner-issued AI submission token is required.'},401);
 if(req.method==='GET')return j({ok:true,actor,policy:POLICY,repairScopes:publicRepairCatalog(),transport:'/mcp',openapi:'/api/integrations/openapi.json'});
 if(req.method!=='POST')return j({error:'Only GET and POST are supported.'},405);
 if(req.headers.get('content-type')?.split(';')[0]!=='application/json')return j({error:'Expected application/json.'},415);
 if(Number(req.headers.get('content-length')||0)>MAX_BYTES)return j({error:'Request too large.'},413);
 if(req.headers.get('Origin'))return j({error:'Machine requests must not include a browser Origin header.'},403);
 const reader=req.body?.getReader();if(!reader)return j({error:'Missing request body.'},400);let size=0;const parts:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;if(value){size+=value.length;if(size>MAX_BYTES){await reader.cancel().catch(()=>{});return j({error:'Request too large.'},413)}parts.push(value)}}
 let packet:any;try{const body=new Uint8Array(size);let p=0;for(const part of parts){body.set(part,p);p+=part.length}packet=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));}catch{return j({error:'Malformed JSON-RPC body'},400);}
 if(!packet||Array.isArray(packet)||packet.jsonrpc!=='2.0'||typeof packet.method!=='string')return error(null,-32600,'Invalid JSON-RPC request',400);const id=(typeof packet.id==='string'||typeof packet.id==='number')?packet.id:null;
 if(packet.method==='notifications/initialized')return new Response(null,{status:202,headers:{'Cache-Control':'no-store'}});if(packet.id===undefined)return new Response(null,{status:202,headers:{'Cache-Control':'no-store'}});
 if(packet.method==='initialize')return response(id,{protocolVersion:'2025-03-26',capabilities:{tools:{listChanged:false}},serverInfo:{name:'heavenlykey-account4-restricted',version:'1.4.0'},instructions:'Start with plan_repair_from_message. Inspect only the selected feature scope before proposing a repair. Use one scope only. Never request secrets or replace unrelated systems.'});
 if(packet.method==='ping')return response(id,{});if(packet.method==='tools/list')return response(id,{tools});if(packet.method!=='tools/call')return error(id,-32601,'Method not found');
 const name=packet.params?.name,args=packet.params?.arguments||{};if(!args||typeof args!=='object'||Array.isArray(args))return error(id,-32602,'Invalid tool arguments');
 if(name==='get_account4_capabilities')return response(id,toolResult({policy:POLICY,actor}));
 if(name==='get_repair_scopes'){const account=String(args.account||'');const items=publicRepairCatalog().filter(x=>!account||x.account===account);return response(id,toolResult({items,persistence:'Credentials and production data are not part of code repair payloads.'}));}
 if(name==='plan_repair_from_message'){const plan=planMaintenanceInstruction(String(args.message||''));return response(id,toolResult(plan,plan.requiresClarification));}
 if(name==='inspect_repair_scope'){const result=await readScopedSource(args,env);return response(id,toolResult(result,!result.ok));}
 if(name==='list_my_proposals'){try{const result=await env.DB.prepare("SELECT id,account_no,name,sha256,status,created_at,validation_summary FROM account4_packages WHERE source=? ORDER BY created_at DESC LIMIT 20").bind(actor).all();return response(id,toolResult({items:result.results||[]}));}catch{return response(id,toolResult({error:'Proposal history unavailable'},true))}}
 if(name==='submit_scoped_repair'){
  const account=String(args.account||''),scope=repairScope(String(args.repairScope||''),account);if(!scope)return response(id,toolResult({error:'Choose a valid repair scope for the target account.'},true));
  if(!Array.isArray(args.files)||args.files.some((f:any)=>!f||typeof f.path!=='string'||!pathWithinRepairScope(f.path,scope)))return response(id,toolResult({error:'Repair contains a file outside the selected feature scope. Split unrelated work into a separate repair.'},true));
  if(new TextEncoder().encode(JSON.stringify(args)).length>MAX_BYTES)return response(id,toolResult({error:'Repair proposal exceeds limit'},true));
  const result=await acceptScopedRepair(args,env,actor);let body:any;try{body=await result.json();}catch{body={error:'Submission service unavailable'};}return response(id,toolResult(body,!result.ok));
 }
 return error(id,-32602,'Tool not available. Production deployment and Account 4 core changes are owner-only.');
}
