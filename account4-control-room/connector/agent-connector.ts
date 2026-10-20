import {submitAgentDraft} from '../src/agent-drafts.ts';
/**
 * Account 4 restricted agent connector (candidate module).
 *
 * Must be mounted only after owner review and deployment-gate tests.
 * Never gives an agent production release, credential, or account-admin access.
 */
interface ConnectorEnv {
  DB: D1Database;
  CONNECTOR_TOKENS_SHA256: string; // comma-separated hashes, provisioned as a Worker secret
}
const allowedSites = new Set(["account1", "account2", "account3", "account5", "account6"]);
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: {
    "cache-control": "no-store", "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  }});
const sha256 = async (data: string) => {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)));
  return [...hash].map(x => x.toString(16).padStart(2,"0")).join("");
};
const constantTimeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
};
const reject = (message: string, status = 400) => json({error:message},status);
const tokenPattern = /^[A-Za-z0-9_-]{32,256}$/;
async function identify(request: Request, env: ConnectorEnv) {
  const header = request.headers.get("authorization") || "";
  const m = /^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(header);
  if (!m || !tokenPattern.test(m[1]) || !env.CONNECTOR_TOKENS_SHA256) return null;
  const hashed = await sha256(m[1]);
  const records = env.CONNECTOR_TOKENS_SHA256.split(",").map(x => x.trim().toLowerCase()).filter(x => /^[a-f0-9]{64}$/.test(x));
  let match = false;
  for (const record of records) match = constantTimeEqual(record, hashed) || match;
  // Never log the raw bearer token or its hash.
  return match ? "restricted-agent" : null;
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
  const identity = await identify(request,env);
  if (!identity) return reject("Unauthorized",401);
  if (path === "/api/connector/v1/capabilities" && request.method === "GET")
    return json({role:"restricted-agent", deploy:false, approve:false, restore:false,
      sites:[...allowedSites], actions:["capabilities.read","proposal.submit","proposal.list","cms-draft.submit"]});
  if (path === "/api/connector/v1/cms-drafts" && request.method === "POST") {
    if (!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json")) return reject("JSON required",415);
    if (Number(request.headers.get("content-length")||0)>130000)return reject("Too large",413);
    const raw=await request.text();if(raw.length>130000)return reject("Too large",413);
    try{return await submitAgentDraft(env,JSON.parse(raw),identity);}
    catch {return reject("Draft handoff is unavailable",503);}
  }
  if (path === "/api/connector/v1/proposals" && request.method === "GET") {
    const site = new URL(request.url).searchParams.get("site");
    if (site && !allowedSites.has(site)) return reject("Invalid site");
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
    const result = await env.DB.prepare(
      "INSERT INTO cms_connector_proposals(site,revision,summary,changed_paths,submitted_by,status) VALUES(?,?,?,?,?,'pending') RETURNING id"
    ).bind(data.site,data.revision,data.summary,JSON.stringify(data.changedPaths),identity).first<{id:number}>();
    await env.DB.prepare("INSERT INTO cms_audit(actor,action,target) VALUES(?,?,?)")
      .bind(identity,"agent-proposal-submitted",data.site+":"+result?.id).run();
    return json({id:result?.id,site:data.site,status:"pending",requiresOwnerApproval:true,executed:false},201);
  }
  return reject("Not found",404);
}
