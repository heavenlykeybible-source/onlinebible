import {submitAgentDraft} from '../src/agent-drafts.ts';
/**
 * Account 4 restricted agent connector (candidate module).
 *
 * Must be mounted only after owner review and deployment-gate tests.
 * Never gives an agent production release, credential, or account-admin access.
 */
interface ConnectorEnv {
  DB: D1Database;
}
type AgentIdentity = {id:string;sites:Set<string>};
const allowedSites = new Set(["account1","account2","account3","account5","account6"]);
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: {
    "cache-control": "no-store", "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  }});
const sha256 = async (data: string) => {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)));
  return [...hash].map(x => x.toString(16).padStart(2,"0")).join("");
};
const reject = (message: string, status = 400) => json({error:message},status);
async function identify(request: Request, env: ConnectorEnv):Promise<AgentIdentity|null> {
  const m = /^Bearer ([A-Za-z0-9_-]{48,256})$/.exec(request.headers.get("authorization")||"");
  if (!m) return null;
  const digest = await sha256(m[1]);
  const row = await env.DB.prepare(
    "SELECT agent_id, allowed_sites FROM cms_agent_credentials WHERE token_hash=? AND enabled=1 AND revoked_at IS NULL"
  ).bind(digest).first<{agent_id:string;allowed_sites:string}>();
  if (!row) return null;
  let sites:unknown;
  try { sites=JSON.parse(row.allowed_sites); }catch{return null}
  if (!Array.isArray(sites)||sites.length<1||!sites.every(x=>typeof x==="string"&&allowedSites.has(x)))return null;
  return {id:row.agent_id,sites:new Set(sites)};
}
async function consumeQuota(env:ConnectorEnv,agentId:string):Promise<boolean>{
  const window=Math.floor(Date.now()/60000)*60;
  const result=await env.DB.prepare(
    "INSERT INTO cms_agent_request_limits(agent_id,window_start,request_count) VALUES(?,?,1) "+
    "ON CONFLICT(agent_id,window_start) DO UPDATE SET request_count=request_count+1 "+
    "WHERE request_count<30 RETURNING request_count"
  ).bind(agentId,window).first();
  return !!result;
}
type Proposal = {site:string; revision:string; summary:string; changedPaths:string[]};
function validate(input: unknown): Proposal {
  if (!input || Array.isArray(input) || typeof input !== "object") throw Error("Invalid proposal");
  const d = input as Record<string, unknown>;
  if (Object.keys(d).some(k => !["site","revision","summary","changedPaths"].includes(k))) throw Error("Unexpected fields");
  if (typeof d.site !== "string" || !allowedSites.has(d.site)) throw Error("This account cannot receive agent proposals");
  if (typeof d.revision !== "string" || !/^[a-f0-9]{40}$/.test(d.revision)) throw Error("An immutable commit SHA is required");
  if (typeof d.summary !== "string" || !d.summary.trim() || d.summary.length > 1000) throw Error("Invalid change summary");
  if (!Array.isArray(d.changedPaths) || d.changedPaths.length > 50 || !d.changedPaths.length ||
      !d.changedPaths.every(p => typeof p === "string" && p.length < 200 && /^[a-zA-Z0-9_./-]+$/.test(p) && !p.includes("..") && !p.startsWith("/"))) throw Error("Invalid changed paths");
  const protectedPath = /(?:^|\/)(?:wrangler(?:\.[^/]+)?\.toml|\.env(?:\.[^/]+)?|secrets?|credentials?)(?:\/|$)|^(?:recovery-control\/|\.github\/workflows\/|account4-control-room\/)/i;
  if (d.changedPaths.some(p => protectedPath.test(p))) throw Error("Protected Control Room or deployment configuration");
  return {site:d.site,revision:d.revision,summary:d.summary.trim(),changedPaths:d.changedPaths as string[]};
}
/** Place behind the Cloudflare Access-protected Account 4 origin.
 * Only wire explicitly to /api/connector/v1/* after the owner approves the PR.
 */
export async function handleAgentConnector(request:Request,env:ConnectorEnv): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/api/connector/v1/")) return reject("Not found",404);
  if (request.method === "OPTIONS") return reject("Not allowed",405);
  if (!["GET","POST"].includes(request.method)) return reject("Method not allowed",405);
  let identity:AgentIdentity|null;
  try { identity=await identify(request,env); }
  catch { return reject("Agent authentication unavailable",503); }
  if (!identity) return reject("Unauthorized",401);
  try { if(!await consumeQuota(env,identity.id))return reject("Rate limit exceeded",429); }
  catch { return reject("Agent rate limiting unavailable",503); }
  if (path === "/api/connector/v1/capabilities" && request.method === "GET")
    return json({role:"restricted-agent", deploy:false, approve:false, restore:false,
      sites:[...identity.sites], actions:["capabilities.read","proposal.submit","proposal.list","cms-draft.submit"]});
  if (path === "/api/connector/v1/cms-drafts" && request.method === "POST") {
    if (!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json")) return reject("JSON required",415);
    if (Number(request.headers.get("content-length")||0)>130000)return reject("Too large",413);
    const raw=await request.text();if(raw.length>130000)return reject("Too large",413);
    try{
      const draft=JSON.parse(raw) as Record<string,unknown>;
      if(typeof draft.site!=="string"||!identity.sites.has(draft.site))return reject("Site permission denied",403);
      return await submitAgentDraft(env,draft,identity.id);
    }
    catch {return reject("Draft handoff is unavailable",503);}
  }
  if (path === "/api/connector/v1/proposals" && request.method === "GET") {
    const site = new URL(request.url).searchParams.get("site");
    if (!site || !identity.sites.has(site)) return reject("Site permission denied",403);
    const rows = await env.DB.prepare(
      "SELECT id,site,revision,summary,status,created_at FROM cms_connector_proposals WHERE (? IS NULL OR site=?) ORDER BY id DESC LIMIT 50"
    ).bind(site,site).all();
    return json({items:rows.results});
  }
  if (path === "/api/connector/v1/proposals" && request.method === "POST") {
    if (!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json")) return reject("JSON required",415);
    if (Number(request.headers.get("content-length")||0) > 12000) return reject("Too large",413);
    const raw = await request.text();
    if (raw.length > 12000) return reject("Too large",413);
    let data: Proposal;
    try { data=validate(JSON.parse(raw)); } catch(e) { return reject(e instanceof Error ? e.message : "Invalid JSON"); }
    if (!identity.sites.has(data.site)) return reject("Site permission denied",403);
    const result = await env.DB.prepare(
      "INSERT INTO cms_connector_proposals(site,revision,summary,changed_paths,submitted_by,status) VALUES(?,?,?,?,?,'pending') RETURNING id"
    ).bind(data.site,data.revision,data.summary,JSON.stringify(data.changedPaths),identity.id).first<{id:number}>();
    await env.DB.prepare("INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)")
      .bind(identity.id,"agent-proposal-submitted",data.site+":"+result?.id).run();
    return json({id:result?.id,site:data.site,status:"pending",requiresOwnerApproval:true,executed:false},201);
  }
  return reject("Not found",404);
}
