import {identityRoute,sessionIdentity,bootstrapIdentity} from "../../shared-security/identity";
import {securityUI} from "../../shared-security/page";
import {accessIdentity} from "./access";
import {assistantOpenApi} from './assistant-spec';
import {acceptPackage,canSubmitPackage,listPackages,integrationsStatus,acceptProposal,manageConnector} from './package-intake';
import {authenticated, login, logout, renderLogin, sameOrigin,verifyOwnerPassword,changePassword} from './local-auth';
import {forgotPage,resetPage,sendReset,completeReset} from './password-recovery';
import {agentHttp,POLICY} from './agent-bridge';
import {releaseHistory} from './release-history';
import {account5Status} from './account5-portal';
export interface Env {
  DB: D1Database;
  RECOVERY_STATE: KVNamespace;
  RECOVERY_VAULT: R2Bucket;
  CODE_INTAKE: R2Bucket;
  GITHUB_CONTROL_TOKEN: string;
  GITHUB_REPOSITORY: string;
  GITHUB_SOURCE_READ_TOKEN?: string; // Optional dedicated contents:read token for scoped AI source inspection.
  GITHUB_SOURCE_REF?: string;
  APP5_GITHUB_READ_TOKEN?: string; // Optional separate read-only status token. Never needed for app deployment.
  ACCESS_TEAM_DOMAIN?:string;
  ACCESS_POLICY_AUD?:string;
  CONTROL_PASSWORD_HASH?: string;
  RESET_EMAIL?: {send(message:{to:string;from:string;subject:string;text:string}):Promise<{messageId:string}>};
  RESET_EMAIL_FROM?: string;
  OPENAI_SUBMIT_TOKEN_HASH?: string;
  CLAUDE_SUBMIT_TOKEN_HASH?: string;
  GEMINI_SUBMIT_TOKEN_HASH?: string;
  CUSTOM_SUBMIT_TOKEN_HASH?: string;
}

const accounts = {
  "1": {
    label: "Account 1 — Main Website",
    stage: "account4-review-stage.yml",
    prod: "cloudflare-production.yml",
    restore: "emergency-restore-account-1.yml",
    restorePrefix: "Account 1 emergency restore · ",
    candidatePrefix: "Account 4 preview 1 · ",
    approvedPrefix: "Account 1 approved release · ",
    preview: "https://heavenlykey-review-1.emmanuel2026miracle.workers.dev",
    live: "https://heavenlykey.alldaywow247.workers.dev"
  },
  "2": {
    label: "Account 2 — Media Engine",
    stage: "account4-review-stage.yml",
    prod: "cloudflare-media-engine.yml",
    restore: "emergency-restore-account-2.yml",
    restorePrefix: "Account 2 emergency restore · ",
    candidatePrefix: "Account 4 preview 2 · ",
    approvedPrefix: "Account 2 approved release · ",
    preview: "https://heavenlykey-review-2.emmanuel2026miracle.workers.dev",
    live: "https://heavenlykey-media.faithofourfatherstv.workers.dev"
  },
  "3": {
    label: "Account 3 — Global Community",
    stage: "account4-review-stage.yml",
    prod: "cloudflare-global-community.yml",
    restore: "emergency-restore-account-3.yml",
    restorePrefix: "Account 3 emergency restore · ",
    candidatePrefix: "Account 4 preview 3 · ",
    approvedPrefix: "Account 3 approved release · ",
    preview: "https://heavenlykey-review-3.emmanuel2026miracle.workers.dev",
    live: "https://heavenly-key-global-community.adiohwomiracle.workers.dev"
  }
} as const;

type Account = keyof typeof accounts;

const H = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'"
};

const j = (x: any, s = 200) =>
  new Response(JSON.stringify(x), { status: s, headers: H });

async function signHmac(key:string,message:string):Promise<string>{
 const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const raw=await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(message));
 return [...new Uint8Array(raw)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
async function previewSignature(env:Env,a:Account,sha:string,expiration:string){
 const key=await signHmac(env.GITHUB_CONTROL_TOKEN,'hkem-preview-gate-seed');
 return signHmac(key,'hkem-preview-v1:'+a+':'+sha+':'+expiration);
}
async function approvalSignature(env:Env,a:Account,sha:string,expiration:string){
 return signHmac(env.GITHUB_CONTROL_TOKEN,'hkem-account4-owner-approval-v1:'+a+':'+sha+':'+expiration);
}
async function restoreSignature(env:Env,a:Account,sha:string,expiration:string){
 return signHmac(env.GITHUB_CONTROL_TOKEN,'hkem-account4-owner-restore-v1:'+a+':'+sha+':'+expiration);
}
async function gh(env: Env, path: string, init: RequestInit = {}) {
  if (!env.GITHUB_CONTROL_TOKEN)
    throw Error("GitHub control token is not configured.");

  const r = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPOSITORY}${path}`,
    {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${env.GITHUB_CONTROL_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "heavenlykey-recovery-control",
        ...(init.headers || {})
      }
    }
  );

  if (!r.ok)
    throw Error(
      `GitHub returned ${r.status}: ${(await r.text()).slice(0, 180)}`
    );

  if (r.status === 204) return {};
  return r.json<any>();
}

type CMSRelease={schemaVersion:1;version:string;description:string;minCmsApi:number};
async function cmsManifest(env:Env,ref:string):Promise<CMSRelease|null>{
 if(!/^(main|[a-f0-9]{40})$/.test(ref))return null;
 try{
  const data=await gh(env,'/contents/cms/release-manifest.json?ref='+encodeURIComponent(ref));
  if(typeof data.content!=='string'||data.encoding!=='base64')return null;
  const doc=JSON.parse(atob(data.content.replace(/\s/g,'')));
  if(doc.schemaVersion!==1||!/^\d+\.\d+\.\d+$/.test(doc.version)||typeof doc.description!=='string'||doc.description.length>250)return null;
  return {schemaVersion:1,version:doc.version,description:doc.description,minCmsApi:Number(doc.minCmsApi)||1};
 }catch(e:any){
  if(String(e.message||'').includes('GitHub returned 404:'))return null;
  throw e;
 }
}
async function runs(env: Env, workflow: string) {
  return (
    await gh(
      env,
      `/actions/workflows/${workflow}/runs?event=workflow_dispatch&per_page=100`
    )
  ).workflow_runs || [];
}

function exactSha(title: unknown, prefix: string): string | null {
  if (typeof title !== "string" || !title.startsWith(prefix)) return null;

  const sha = title.slice(prefix.length).trim();

  return /^[0-9a-f]{40}$/i.test(sha) ? sha.toLowerCase() : null;
}

async function state(env: Env, a: Account) {
  const c = accounts[a];

  const [allStageRuns, prodRuns, restoreRuns] = await Promise.all([
    runs(env, c.stage),
    runs(env, c.prod),
    runs(env, c.restore)
  ]);
  const history=releaseHistory(prodRuns,restoreRuns,c.approvedPrefix,c.restorePrefix);

  const stageRuns = allStageRuns.filter((x: any) => typeof x.display_title === "string" && x.display_title.startsWith(c.candidatePrefix));
  const latestRaw = stageRuns[0] || null;

  const latestSha = latestRaw
    ? exactSha(latestRaw.display_title, c.candidatePrefix)
    : null;

  const testedRaw =
    stageRuns.find(
      (x: any) =>
        x.status === "completed" &&
        x.conclusion === "success" &&
        exactSha(x.display_title, c.candidatePrefix)
    ) || null;

  const testedSha = testedRaw
    ? exactSha(testedRaw.display_title, c.candidatePrefix)
    : null;

  const liveSha = history.liveRelease?.sha || null;

  const pendingReview=Boolean(
    latestSha && latestRaw?.conclusion==='success' && latestSha!==liveSha
  );
  const reviewed=pendingReview?Boolean(await env.RECOVERY_STATE.get('review_seen:'+a+':'+latestSha)):false;
  // The owner confirmation is a dispatch request, NOT a successful production deployment.
  // Keep its timestamp distinct from the GitHub workflow completion time.
  const approvalRequestedAt=latestSha?await env.RECOVERY_STATE.get('approval_requested:'+a+':'+latestSha):null;
  return {
    account: a,
    ...c,
    pendingReview,
    reviewed,
    approvalRequestedAt,
    newUpdate: pendingReview && !reviewed,
    reviewStatus: latestRaw?.status!=='completed'?'Testing'
      :latestRaw.conclusion==='failure'?'Tests failed'
      :pendingReview?(reviewed?'Awaiting owner approval':'New update ready for review'):'Already live',

    latestStage: latestRaw
      ? {
          sha: latestSha,
          status: latestRaw.status,
          conclusion: latestRaw.conclusion,
          url: latestRaw.html_url,
          createdAt: latestRaw.created_at,
          // Arrival occurs when the staging workflow starts; completion is separate.
          arrivalAt: latestRaw.created_at,
          testedAt: latestRaw.status==='completed'?latestRaw.updated_at||null:null
        }
      : null,

    testedRelease:
      testedRaw && testedSha
        ? {
            sha: testedSha,
            url: testedRaw.html_url,
            createdAt: testedRaw.created_at
          }
        : null,

    liveRelease:history.liveRelease,
    previous:history.previous,

    canPromote: Boolean(
      testedSha && latestSha === testedSha &&
      latestRaw?.conclusion === "success" &&
      (!liveSha || testedSha !== liveSha)
    )
  };
}

async function dispatch(env: Env, workflow: string, inputs: any) {
  return gh(env, `/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: "main",
      inputs
    })
  });
}

async function audit(
  env: Env,
  req: Request,
  account: string,
  action: string,
  sha: string
) {
  const who = "dashboard-admin";

  await env.RECOVERY_STATE.put(
    `audit:${Date.now()}:${crypto.randomUUID()}`,
    JSON.stringify({
      who,
      account,
      action,
      sha,
      at: new Date().toISOString()
    }),
    { expirationTtl: 60 * 60 * 24 * 365 }
  );
}

const page = "<!doctype html>\n<html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Website Update Centre · Heavenly Key</title>\n<style>\n*{box-sizing:border-box}body{margin:0;background:#f1f4fc;color:#14213e;font:15px/1.5 system-ui,-apple-system,sans-serif}\nheader{background:linear-gradient(112deg,#102e73,#3b174e);color:white;padding:13px 14px 15px}\n.wrap{max-width:1080px;margin:auto;padding:0 16px}h1{margin:2px 0 5px;font-size:clamp(19px,3.2vw,26px);line-height:1.2}h2{font-size:20px;margin:0}h3{margin:0 0 10px;font-size:18px}\n.brand{font-size:12px;letter-spacing:1.1px;color:#f4d37b;font-weight:750}\nmain{max-width:1080px;padding:18px 16px 42px;margin:auto}\n.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px}\n.card{background:white;border-radius:15px;padding:20px;box-shadow:0 3px 17px #1729520e;border:1px solid #e1e6f0}\n.quiet-notice{font-size:12px;line-height:1.45;color:#4e6486;padding:3px 0;margin:0}.quiet-notice strong{font-weight:650;color:#405879}\n.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0 0}\nbutton,.btn{border:0;border-radius:9px;padding:11px 13px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;background:#24489e;color:white}\nbutton:disabled{opacity:.48;cursor:not-allowed}\n.btn{display:inline-block;text-decoration:none;background:#e9eef9;color:#24396d}\n.secondary{background:#edf1f8;color:#263c71}\n.danger{background:#a12f45}\n.small{font-size:13px;color:#58617a}\n.mono{font-family:ui-monospace,monospace;font-size:12px}\n.status{display:inline-block;border-radius:30px;padding:4px 10px;font-size:12px;font-weight:750;background:#eaf0fd;color:#234588;margin:12px 0 5px}\n.status.new{background:#fff1bf;color:#6e4200}.status.good{background:#e3f8ea;color:#226640}\n.count{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:100px;background:#ffe38c;color:#39220b;font-weight:750;font-size:10px;padding:1px 5px}\n.mini{border-top:1px solid #eef0f5;margin-top:15px;padding-top:12px}.mini summary{font-weight:800;color:#1c458c;cursor:pointer;padding:5px 0}.history-entry{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid #e7ebf2;padding:12px 0}.history-entry .row{margin:0}\n#notices{margin:6px 0 12px;min-height:0}\n\nbody{background:linear-gradient(180deg,#eff3fb 0%,#f8faff 420px)}header{background:radial-gradient(circle at 90% 20%,#573b82,transparent 45%),linear-gradient(125deg,#0e316e,#123979 65%,#3a245d);border-bottom:4px solid #e8c66a}.card{border:1px solid #dbe3f1;box-shadow:0 7px 24px #18295916}.card h2{font-size:20px}.sectionheading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:20px 0 12px}.sectionheading p{font-size:13px;color:#597090}.upload-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:15px 0}.upload-grid label{font-weight:700;font-size:12px;color:#284875;display:grid;gap:6px}.upload-grid input,.upload-grid select{background:white;border:1px solid #bfcce2;border-radius:9px;padding:11px;width:100%;min-width:0;font:inherit}.upload-grid button{align-self:end}.package-item{border-top:1px solid #e3eaf3;padding:12px 0;display:flex;justify-content:space-between;gap:15px;align-items:start;flex-wrap:wrap}.package-item strong{display:block}.package-item small{color:#627893;overflow-wrap:anywhere}.pill{font-size:12px;padding:4px 9px;border-radius:12px;background:#fff1d4;color:#765013;font-weight:800}.connected{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.connected>div{border:1px solid #d5dff0;border-radius:10px;padding:12px}.connected b{display:block}.connected small{color:#62728e}.main-desc{font-size:11px;color:#d6e4fd;margin:0}.header-bottom{display:flex;justify-content:space-between;align-items:end;gap:10px;flex-wrap:wrap}.header-meta{display:flex;justify-content:flex-end;align-items:center;gap:6px;margin-left:auto}.owner-chip{display:inline-flex;align-items:center;background:#ffffff23;padding:3px 7px;border-radius:18px;font-size:9px;letter-spacing:.01em;font-weight:700;white-space:nowrap}.caption-heading{color:#526b89;font-size:13px}.card a:focus-visible,.card button:focus-visible{outline:3px solid #edc565;outline-offset:3px}@media(max-width:850px){.upload-grid{grid-template-columns:1fr 1fr}.connected{grid-template-columns:1fr 1fr}}@media(max-width:480px){.upload-grid{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.header-bottom{align-items:start}.header-meta{margin-left:auto}.brand{font-size:10px}.main-desc{font-size:10px}}</style></head>\n<body>\n<header><div class=\"wrap\">\n<div class=\"brand\">HEAVENLY KEY EVANGELISTIC MOVEMENT · ACCOUNT 4</div>\n<h1>Website Update Centre</h1>\n<div class=\"header-bottom\"><p class=\"main-desc\">Upload → Validation → Preview → Your approval → Production</p><div class=\"header-meta\"><span class=\"count\" id=\"badge\" hidden aria-label=\"Unread updates\">0</span><span class=\"owner-chip\">SECURE OWNER CONTROL</span></div></div>\n</div></header>\n<main><p><a class=\"btn\" href=\"/security\">Users &amp; access / Open Studio</a></p><div style=\"display:flex;justify-content:flex-end;margin-bottom:14px\"><button id=\"logout\" class=\"secondary\" type=\"button\">Log out</button></div><div id=\"notices\" role=\"status\" aria-live=\"polite\"></div>\n<div class=\"small\" style=\"margin-bottom:16px\">Review builds use isolated Account 4 resources. Your existing live websites stay online until you approve an update for that specific account.</div>\n<section class=\"card\" style=\"margin:14px 0 20px\"><div class=\"sectionheading\"><h2>CMS Updates</h2><span class=\"pill\">Protected Software</span></div><p class=\"small\">Check for a new version of the permanent Website Builder. Updates are staged and tested first, and require your separate approval before installation.</p><button id=\"cms-check\" type=\"button\" class=\"secondary\">Check CMS Updates</button><div id=\"cms-update-status\" class=\"small\" role=\"status\" aria-live=\"polite\">No update check yet.</div></section><div class=\"sectionheading\"><h2>Websites & Updates</h2><span class=\"caption-heading\">Independent production accounts • Review before publishing</span></div><div id=\"app\" class=\"cards\"><div class=\"card\">Checking for updates…</div></div>\n<section class=\"card\" id=\"app-release-centre\" style=\"margin:20px 0\"><div class=\"sectionheading\"><h2>App Update Control · Six Apps</h2><span class=\"pill\">Account 4 · Owner controlled</span></div><p class=\"small\">Select an app independently and request its next update review. Monthly or twice-monthly is a planning cadence, not automatic publishing. Existing production and member data remain untouched until the normal verified release approval.</p><div id=\"app-release-items\" class=\"cards\"><p>Loading app controls…</p></div><div class=\"small\" id=\"app-release-message\" role=\"status\" aria-live=\"polite\"></div></section><section class=\"card\" style=\"margin-top:20px\" id=\"direct-upload\"><div class=\"sectionheading\"><h2>Direct Package Upload</h2><span class=\"pill\">QUARANTINE ONLY</span></div><p class=\"small\">Upload a ZIP directly to Account 4, without GitHub. Structural inspection runs immediately. No uploaded code is executed, staged or published until an independent trusted builder verifies it. Include account4-package.json at the ZIP root.</p><form id=\"package-upload\" class=\"upload-grid\"><label>Destination account<select id=\"pkg-account\"><option value=\"1\">Account 1 — Website</option><option value=\"2\">Account 2 — Media</option><option value=\"3\">Account 3 — Community</option></select></label><label>Package type<select id=\"pkg-kind\"><option value=\"source-zip\">Source Code ZIP</option><option value=\"theme-zip\">Theme ZIP</option></select></label><label>Package name<input id=\"pkg-name\" placeholder=\"Homepage refresh\" minlength=\"3\" maxlength=\"80\" required></label><label>ZIP (max 8 MB)<input id=\"pkg-file\" type=\"file\" accept=\".zip,application/zip\" required></label><button type=\"submit\" id=\"pkg-submit\">Upload for Inspection</button></form><p class=\"small\" role=\"status\" aria-live=\"polite\" id=\"pkg-status\">No package selected.</p><div id=\"package-results\"></div></section><section class=\"card\" style=\"margin-top:20px\"><div class=\"sectionheading\"><h2>Connections</h2><span class=\"pill\">UPLOAD ONLY</span></div><p class=\"small\">ChatGPT, Claude and Gemini require individually authorized private credentials. Even authorized assistants cannot approve or publish production changes. Generate a submission token below, then configure it in a compatible assistant integration (ChatGPT Actions or MCP clients). Other AI clients can use the generic provider token. MCP endpoint: <code>/mcp</code>. It is not automatic OAuth account linking. Tokens cannot deploy, restore, change owner settings or touch the locked CMS. MCP URL: https://heavenlykey-recovery-control.emmanuel2026miracle.workers.dev/mcp. Generate a private key for each provider and add the endpoint and key in the assistant client. <a href=\"/api/integrations/openapi.json\" target=\"_blank\" rel=\"noopener noreferrer\">View assistant API specification</a>.</p><div id=\"connected-providers\" class=\"connected\"></div></section>\n<div class=\"card\" style=\"margin-top:20px\">\n<h3>Emergency Recovery</h3>\n<div class=\"small\">Each website card has up to five earlier eligible production releases and dates. Code recovery does not restore database records or uploaded pictures.</div>\n<div id=\"restore\" class=\"small\">Open “Previous verified versions” in a website card above to review and restore one of its previous versions.</div><p id=\"account4-self-status\" class=\"small\" role=\"status\">Checking Account 4's separate release history…</p>\n<div class=\"card\" style=\"margin-top:20px\"><h3>Account 4 Security</h3><p class=\"small\">Use a separate private password for this deployment dashboard. Changing it signs out existing sessions; the new password is stored securely and survives Worker code updates.</p><button id=\"change-password\" class=\"secondary\" type=\"button\">Change Dashboard Password</button></div></div></main>\n<script>\nconst E=v=>{const x=document.createElement('div');x.textContent=String(v==null?'':v);return x.innerHTML};\nasync function api(path,opts){const r=await fetch(path,opts);const kind=r.headers.get('content-type')||'';if(!kind.includes('application/json'))throw Error('Account 4 API returned an HTML page. Cloudflare Access or the Worker route is not configured correctly.');const v=await r.json();if(!r.ok)throw Error(v.error||'Request failed');return v}\nconst post=(path,data)=>api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});\nfunction maskedPassword(title){\n return new Promise(resolve=>{\n const dialog=document.createElement('dialog');\n dialog.style.cssText='border:1px solid #c5d3e5;border-radius:15px;max-width:410px;width:calc(100% - 34px);padding:24px;color:#152c55;box-shadow:0 12px 50px #0007';\n const heading=document.createElement('h3');heading.textContent=title;dialog.append(heading);\n const form=document.createElement('form');form.method='dialog';\n const label=document.createElement('label');label.textContent='Account 4 dashboard password';label.style.cssText='display:block;font-weight:700;margin-top:16px';\n const input=document.createElement('input');input.type='password';input.required=true;input.autocomplete='current-password';input.style.cssText='display:block;width:100%;padding:12px;margin:7px 0 16px;border:1px solid #abb9d1;border-radius:8px';\n label.append(input);form.append(label);\n const actions=document.createElement('div');actions.className='row';\n const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Cancel';\n const ok=document.createElement('button');ok.type='submit';ok.textContent='Confirm secure action';\n actions.append(cancel,ok);form.append(actions);dialog.append(form);document.body.append(dialog);\n let done=false;function complete(value){if(done)return;done=true;dialog.close();dialog.remove();resolve(value)}\n cancel.onclick=()=>complete(null);dialog.addEventListener('cancel',event=>{event.preventDefault();complete(null)});\n form.addEventListener('submit',e=>{e.preventDefault();complete(input.value||null)});\n dialog.showModal();input.focus();\n });\n}\nasync function action(account,action,sha){\n if(action==='promote'&&!confirm('I have personally reviewed the temporary Account '+account+' preview and approve this exact update for the live website. Continue?'))return;\n if(action==='stage'&&!confirm('Send the latest code to Account 4 Waiting Room ONLY? The live site stays unchanged.'))return;\n if(action==='restore'&&!confirm('EMERGENCY RESTORE a previously successful Account '+account+' release?'))return;\n const ownerPassword=(action==='promote'||action==='restore')\n  ?await maskedPassword('Confirm '+(action==='promote'?'production publishing':'emergency restore')):null;\n if((action==='promote'||action==='restore')&&!ownerPassword)return;\n try{await post('/api/action',{account,action,targetRef:sha,ownerPassword});await load();alert(action==='promote'?'Owner approval recorded. Production deployment was requested.':'Request submitted.');}catch(e){alert(e.message)}\n}\nasync function preview(account,sha){\n const w=window.open('about:blank','_blank');\n try{\n  const v=await post('/api/preview-link',{account,targetRef:sha});\n  if(w){w.opener=null;w.location.replace(v.url)}else location.assign(v.url);\n  await load();\n }catch(e){if(w)w.close();alert(e.message)}\n}\nfunction button(text,fn,disabled,kind){const b=document.createElement('button');b.textContent=text;b.disabled=!!disabled;if(kind)b.className=kind;b.onclick=fn;return b}\nfunction link(text,url){const a=document.createElement('a');a.textContent=text;a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='btn';return a}\n\nconst appFamilies=[['all-in-one','Heavenly Key All-in-One'],['bible','Heavenly Key Bible'],['radio','Online Revival Radio'],['walk','My Walk With God Calculator'],['study','Bible Study Portal'],['community','Global Christian Community']];\nfunction node(tag,value){const el=document.createElement(tag);el.textContent=value;return el}\nasync function loadAppReleaseControls(){const root=document.getElementById('app-release-items');if(!root)return;try{const d=await api('/api/app-release-controls');root.replaceChildren();for(const [id,label] of appFamilies){const state=d.apps?.[id]||{};const c=document.createElement('section');c.className='card';c.append(node('h3',label));const meta=node('p','Update frequency: '+(state.cadence===2?'Twice a month':'Once a month')+' · Last requested: '+(state.requestedAt?new Date(state.requestedAt).toLocaleDateString('en-NG'):'Never'));meta.className='small';c.append(meta);const row=document.createElement('div');row.className='row';const select=document.createElement('select');select.setAttribute('aria-label','Update cadence for '+label);for(const [value,name] of [['1','Monthly'],['2','Twice monthly']]){const opt=document.createElement('option');opt.value=value;opt.textContent=name;select.append(opt)}select.value=String(state.cadence||1);row.append(select);row.append(button('Save frequency',async()=>{try{await post('/api/app-release-controls',{app:id,action:'cadence',cadence:Number(select.value)});await loadAppReleaseControls()}catch(e){alert(e.message)}}));row.append(button('Request update review',async()=>{try{await post('/api/app-release-controls',{app:id,action:'request'});await loadAppReleaseControls()}catch(e){alert(e.message)}},false,'secondary'));c.append(row);const note=node('p','Review requested only. Actual deployment still requires tested code and the existing owner approval process.');note.className='small';c.append(note);root.append(c)}}catch(e){root.textContent='App controls unavailable: '+e.message}}\n}\nasync function load(){\n try{\n  const d=await api('/api/status'),root=document.getElementById('app'),notes=document.getElementById('notices'),badge=document.getElementById('badge');\n  root.replaceChildren();\n  badge.hidden=!d.pendingCount;badge.textContent=d.pendingCount;\n  document.title=(d.pendingCount?'('+d.pendingCount+') ':'')+'Website Update Centre · Heavenly Key';\n  notes.innerHTML=d.pendingCount?'<p class=\"quiet-notice\"><strong>New update ready</strong> · '+E(d.pendingCount)+' website update(s) to review below.</p>'\n   :d.awaitingApproval?'<p class=\"quiet-notice\">'+E(d.awaitingApproval)+' tested update(s) ready for your approval below.</p>'\n   :'<p class=\"quiet-notice\">Welcome to your Website Update Centre. No unread updates.</p>';\n  const ownerArea=document.getElementById('account4-self-status');\n  if(ownerArea){\n    const t=d.account4Release;\n    ownerArea.textContent=t\n      ?'Latest successful Account 4 control-plane deployment: '+new Date(t.completedAt).toLocaleString('en-NG',{timeZone:'Africa/Lagos',dateStyle:'medium',timeStyle:'short'})+' WAT · commit '+t.sha.slice(0,12)+'. Account 4 deploys independently; no Waiting Room arrival is recorded.'\n      :'No successful Account 4 self-release is recorded here. Account 4 does not use the Accounts 1–3 Waiting Room.';\n  }\n  loadAppReleaseControls();\n  for(const s of d.accounts){\n   const c=document.createElement('section');c.className='card';\n   const status=s.latestStage?.status!=='completed'?'Preview preparing':s.reviewStatus;\n   const style=s.newUpdate?'new':s.pendingReview?'':'good';\n   const dateText=when=>{if(!when)return 'Not recorded';const time=new Date(when);return Number.isNaN(time.getTime())?'Not recorded':time.toLocaleString('en-NG',{timeZone:'Africa/Lagos',dateStyle:'medium',timeStyle:'short'})+' WAT';};\n   const candidateSha=s.latestStage?.sha||null;\n   const candidateDeployed=Boolean(candidateSha&&s.liveRelease?.sha===candidateSha);\n   const arrivalText=s.latestStage?.arrivalAt||s.latestStage?.createdAt;\n   const approvalText=s.approvalRequestedAt?dateText(s.approvalRequestedAt):candidateDeployed?'Not recorded for this historical release':'Not yet approved';\n   const completedText=candidateDeployed?dateText(s.liveRelease?.completedAt):'Not deployed';\n   c.innerHTML='<h2>'+E(s.label)+'</h2><span class=\"status '+style+'\">'+E(status)+'</span>'+\n     '<div class=\"small\">Update version: <span class=\"mono\">'+E(s.latestStage?.sha?.slice(0,12)||'Not staged')+'</span></div>'+\n     '<div class=\"small\"><strong>Waiting Room arrival:</strong> '+E(dateText(arrivalText))+'</div>'+ \n     '<div class=\"small\"><strong>Preview tests completed:</strong> '+E(dateText(s.latestStage?.testedAt))+'</div>'+ \n     '<div class=\"small\"><strong>Owner approval / publish requested:</strong> '+E(approvalText)+'</div>'+ \n     '<div class=\"small\"><strong>This version deployed successfully:</strong> '+E(completedText)+'</div>'+ \n     '<div class=\"small\">Previous/latest recorded live deployment: '+E(dateText(s.liveRelease?.completedAt))+'</div>'+\n     '<div class=\"small\">Recorded release: <span class=\"mono\">'+E(s.liveRelease?.sha?.slice(0,12)||'Not recorded')+'</span>'+(s.liveRelease?.source==='restore'?' (restored code)':'')+'</div>'+\n     '<div class=\"small\">Preview tests: '+E(s.latestStage?s.latestStage.status+' / '+(s.latestStage.conclusion||'pending'):'Not started')+'</div>';\n   const row=document.createElement('div');row.className='row';\n   row.append(button('Send latest to Waiting Room',()=>action(s.account,'stage',d.latestSha),false,'secondary'));\n   const sha=s.latestStage?.sha;\n   row.append(button('Open Preview Website',()=>preview(s.account,sha),!s.canPromote));\n   const approve=button('Approve & Publish',()=>action(s.account,'promote',sha),!s.canPromote||!s.reviewed);\n   row.append(approve);\n   if(s.pendingReview&&!s.reviewed){const msg=document.createElement('div');msg.className='small';msg.textContent='Open the temporary preview to unlock approval.';c.append(msg)}\n   if(s.latestStage?.url)row.append(link('See test report',s.latestStage.url));\n   row.append(link('Open live website',s.live));\n   c.append(row);root.append(c);\n   const history=document.createElement('details');history.className='mini small';\n   const heading=document.createElement('summary');heading.textContent='Previous verified versions · up to 5 ('+(s.previous?.length||0)+')';history.append(heading);\n   const note=document.createElement('p');note.textContent='Recorded successful GitHub code deployments, not independent Cloudflare/database backups. Restore changes code only; D1 and uploaded media are not rolled back.';history.append(note);\n   for(const [i,q] of (s.previous||[]).slice(0,5).entries()){\n    const item=document.createElement('div');item.className='history-entry';\n    const about=document.createElement('div');about.className='small';\n    const ver=document.createElement('strong');ver.textContent='Previous version '+(i+1)+' · '+q.sha.slice(0,12);\n    const date=document.createElement('div');date.textContent='Recorded: '+dateText(q.completedAt);\n    about.append(ver,date);item.append(about);\n    const actions=document.createElement('div');actions.className='row';\n    actions.append(button('Restore this version',()=>action(s.account,'restore',q.sha),false,'danger'));\n    if(q.url)actions.append(link('Deployment record',q.url));\n    item.append(actions);history.append(item);\n   }\n   if(!s.previous?.length){const info=document.createElement('p');info.textContent='No earlier eligible releases are recorded yet.';history.append(info)}\n   c.append(history);\n  }\n }catch(e){document.getElementById('notices').textContent='Unable to check updates: '+e.message}\n}\ndocument.querySelector('#logout').addEventListener('click',async()=>{\n try{await post('/api/logout',{});location.assign('/');}catch(e){alert(e.message)}\n});\nload();setInterval(load,30000);\nasync function refreshPackages(){const root=document.getElementById('package-results');try{const data=await api('/api/packages');root.replaceChildren();if(!data.items?.length){const p=document.createElement('p');p.className='small';p.textContent='No direct ZIP uploads yet.';root.append(p)}for(const x of data.items||[]){const row=document.createElement('div');row.className='package-item';const info=document.createElement('div');const title=document.createElement('strong');title.textContent=x.name+' — Account '+x.account_no;const note=document.createElement('small');note.textContent=x.file_count+' files · '+x.sha256.slice(0,12)+'… · '+x.created_at+' · '+x.validation_summary;info.append(title,note);const state=document.createElement('span');state.className='pill';state.textContent=x.status;row.append(info,state);root.append(row)}}catch(e){root.textContent='Package history unavailable: '+e.message}}\nasync function changeConnector(provider,action){\n const password=await maskedPassword((action==='rotate'?'Create/rotate':'Revoke')+' connector token: '+provider);\n if(!password)return;\n try{\n const result=await post('/api/integrations/token',{provider,action,password});\n if(action==='rotate')prompt('COPY THIS TOKEN NOW (displayed only once). Configure it as a private Bearer API key in your assistant tool. MCP endpoint: /mcp (HTTPS); OpenAPI endpoint: /api/integrations/openapi.json. This credential permits package/proposal submission ONLY, never deployment:',result.token);\n else alert('Previous '+provider+' submission token revoked.');\n await refreshProviders();\n }catch(e){alert('Connector operation failed: '+e.message)}\n}\nasync function refreshProviders(){const root=document.getElementById('connected-providers');try{const d=await api('/api/integrations');root.replaceChildren();for(const key of ['github','chatgpt','claude','gemini','custom']){const item=document.createElement('div'),title=document.createElement('b'),details=document.createElement('small');title.textContent=key==='github'?'GitHub':key==='chatgpt'?'ChatGPT':key==='claude'?'Claude':key==='gemini'?'Gemini':'Other AI / MCP';details.textContent=key==='github'?'Repository workflow configured':d[key]==='requires-token'?'No token issued (not connected)':'Private key issued (connection not verified)';item.append(title,details);\n if(key!=='github'){\n const actions=document.createElement('div');actions.className='row';\n actions.append(button('Create / Rotate Key',()=>changeConnector(key,'rotate'),false,'secondary'));\n if(d[key]!=='requires-token')actions.append(button('Revoke',()=>changeConnector(key,'revoke'),false,'danger'));\n item.append(actions);\n }\n root.append(item)}}catch(e){root.textContent=e.message}}\ndocument.getElementById('package-upload').addEventListener('submit',async(e)=>{e.preventDefault();const file=document.getElementById('pkg-file').files[0],status=document.getElementById('pkg-status'),button=document.getElementById('pkg-submit');if(!file)return;if(file.size>8388608){status.textContent='ZIP must be smaller than 8 MB.';return}button.disabled=true;status.textContent='Inspecting ZIP and storing it in quarantine…';try{const response=await fetch('/api/packages',{method:'PUT',headers:{'Content-Type':'application/zip','X-Target-Account':document.getElementById('pkg-account').value,'X-Package-Kind':document.getElementById('pkg-kind').value,'X-Package-Name':document.getElementById('pkg-name').value},body:file});const d=await response.json();if(!response.ok)throw Error(d.error||'Upload rejected');status.textContent='Stored safely · '+d.fileCount+' indexed files · '+d.sha256.slice(0,16)+'… · QUARANTINED pending independent code inspection. No live website changed.';e.target.reset();await refreshPackages()}catch(error){status.textContent='Upload not accepted: '+error.message}finally{button.disabled=false}});refreshPackages();refreshProviders();loadAccount5();\n\n// Account 5 has a separate application repository and Cloudflare deployment.\n// This card is read-only until a separately reviewed, owner-approved release\n// path can be proven. Do not dispatch Account 1–3 jobs for the mobile app.\nasync function loadAccount5(){\n  let section=document.getElementById('account5-panel');\n  if(!section){\n    section=document.createElement('section');\n    section.id='account5-panel';\n    section.className='card';\n    section.style.margin='18px 0 22px';\n    const target=document.getElementById('direct-upload');\n    target?.parentNode?.insertBefore(section,target);\n  }\n  section.replaceChildren();\n  const heading=document.createElement('h2');heading.textContent='Account 5 — Heavenly Key Mobile App';\n  const intro=document.createElement('p');intro.className='small';intro.textContent='Independent GitHub repository and Cloudflare project. This panel cannot publish or modify Accounts 1–4.';\n  section.append(heading,intro);\n  let data;\n  try{data=await api('/api/account5/status');}\n  catch(e){\n    const msg=document.createElement('p');msg.className='small';msg.textContent='App status unavailable: '+e.message;section.append(msg);return;\n  }\n  const fmt=t=>{if(!t)return 'Not recorded';const d=new Date(t);return Number.isNaN(d.getTime())?'Not recorded':d.toLocaleString('en-NG',{timeZone:'Africa/Lagos',dateStyle:'medium',timeStyle:'short'})+' WAT';};\n  const detail=document.createElement('div');detail.className='small';\n  const entries=[\n    'Source commit: '+(data.latestSha?data.latestSha.slice(0,12):'Not verified')+' · GitHub: '+data.integration,\n    'Source updated: '+fmt(data.sourceCommittedAt),\n    'Independent app CI arrival: '+fmt(data.buildArrivedAt)+' · CI: '+data.checks,\n    'App review queue arrival (Account 4): '+fmt(data.reviewArrivalAt),\n    'Owner approval / publication: Not recorded in Account 4',\n    'App production deployment: '+(data.deploymentVerified&&data.deployedAt?fmt(data.deployedAt):'Not independently verified')\n  ];\n  for(const entry of entries){const p=document.createElement('p');p.textContent=entry;p.style.margin='4px 0';detail.append(p);}\n  const note=document.createElement('p');note.className='small';note.textContent=data.note;\n  const actions=document.createElement('div');actions.className='row';\n  if(data.latestSha&&data.checks==='success'){\n    const arrive=button('Record arrival for Account 5 review',async()=>{\n      if(!confirm('Register the verified app commit for owner review in Account 4? This does NOT deploy, publish or create an app preview.'))return;\n      try{\n        await post('/api/account5/arrival',{targetSha:data.latestSha});\n        await loadAccount5();\n      }catch(e){alert('Could not record review arrival: '+e.message);}\n    },Boolean(data.reviewArrivalAt),'secondary');\n    actions.append(arrive);\n  }\n  actions.append(link('View app source',data.github),link('Open Cloudflare Account 5',data.cloudflare),link('Test public app URL',data.live));\n  section.append(detail,actions,note);\n  const caution=document.createElement('p');caution.className='small';\n  caution.textContent='This Account 5 arrival records a review-queue timestamp only; it does not stage a Cloudflare preview or publish the app. Production publication and its verified timestamp remain in the separate Account 5 Cloudflare pipeline.';\n  section.append(caution);\n}\n\ndocument.getElementById('change-password').addEventListener('click',async()=>{\n const currentPassword=prompt('Enter your current Account 4 dashboard password:');if(!currentPassword)return;\n const newPassword=prompt('Enter a NEW unique Account 4 password (16+ characters, upper/lowercase letters and numbers):');if(!newPassword)return;\n const confirmation=prompt('Enter the NEW password again to confirm:');if(newPassword!==confirmation){alert('New passwords do not match. Nothing changed.');return}\n if(!confirm('Change the Account 4 dashboard password and sign out all existing sessions?'))return;\n try{await post('/api/password/change',{currentPassword,newPassword});alert('Dashboard password changed successfully. Please sign in again.');location.assign('/')}\n catch(e){alert('Password was not changed: '+e.message)}\n});\ndocument.getElementById('cms-check').addEventListener('click',async()=>{\n const status=document.getElementById('cms-update-status');status.textContent='Checking approved CMS update catalog…';\n try{\n  const data=await api('/api/cms-updates');status.replaceChildren();\n  const p=document.createElement('p');\n  p.textContent='Installed CMS: '+(data.installed?.version||'Not yet recorded')+\n    ' · Available CMS: '+(data.available?.version||'No catalog release');\n  status.append(p);\n  if(data.updateAvailable&&data.targetSha){\n   const d=document.createElement('p');d.textContent=data.available.description;status.append(d);\n   status.append(button('Stage CMS update for review',()=>action('1','stage',data.targetSha),false));\n   const note=document.createElement('p');note.textContent='This sends the update to Account 4 previews. It does NOT publish to Account 1.';status.append(note);\n  }else status.append(document.createTextNode('No newer CMS release requiring your approval.'));\n }catch(e){status.textContent='CMS update check unavailable: '+e.message}\n});\n</script></body></html>";

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext) {
    const u = new URL(req.url);
    const securityPage=securityUI(req);if(securityPage)return securityPage;
    let managedOwner:any=null;try{managedOwner=await env.DB.prepare("SELECT * FROM security_users WHERE role='owner' AND password_hash IS NOT NULL AND status='active' LIMIT 1").first();}catch{}
    if(managedOwner&&u.pathname==='/api/login'&&req.method==='POST'){
      const form=(req.headers.get('content-type')||'').includes('application/x-www-form-urlencoded');const input=form?{password:(await req.clone().formData()).get('password')}:await req.clone().json() as any;
      const r=(await identityRoute(new Request(new URL('/api/security/login',req.url),{method:'POST',headers:{'content-type':'application/json',Origin:req.headers.get('Origin')||''},body:JSON.stringify({email:managedOwner.email,password:input.password})}),env,null))!;
      return form&&r.ok?new Response(null,{status:303,headers:{Location:'/', 'cache-control':'no-store','set-cookie':r.headers.get('set-cookie')!}}):r;
    }
    if(managedOwner&&['/forgot-password','/reset-password'].includes(u.pathname))return new Response(null,{status:303,headers:{Location:'/security','cache-control':'no-store'}});
    if (u.pathname === '/api/login' && req.method === 'POST') {
      try { return await login(req,env); }
      catch (error) {
        console.error('Account 4 login backend error:',error instanceof Error?error.message:'unknown');
        return j({error:'Account 4 login service is temporarily unavailable. Check database migrations and Worker bindings.'},503);
      }
    }
    if (u.pathname === '/forgot-password' && req.method === 'GET') return forgotPage();
    if (u.pathname === '/forgot-password' && req.method === 'POST') return sendReset(req,env);
    if (u.pathname === '/reset-password' && req.method === 'GET') return resetPage(req);
    if (u.pathname === '/reset-password' && req.method === 'POST') return completeReset(req,env);
    if ((u.pathname === '/mcp' || u.pathname === '/api/agent/info') && (req.method === 'POST'||req.method==='GET')) {
      try{return await agentHttp(req,env);}catch(error){
        console.error('AI gateway backend unavailable:',error instanceof Error?error.message:'unknown');
        return j({error:'AI gateway is temporarily unavailable. Verify Account 4 authentication and database bindings.'},503);
      }
    }
    if (u.pathname === '/api/logout' && req.method === 'POST') {
      if (!sameOrigin(req)) return j({error:'Invalid origin'},403);
      const principal=await sessionIdentity(req,env);const managed=principal?await identityRoute(new Request(new URL('/api/security/logout',req.url),{method:'POST',headers:req.headers,body:'{}'}),env,principal):null;const result=logout();if(managed?.headers.get('set-cookie'))result.headers.append('set-cookie',managed.headers.get('set-cookie')!);return result;
    }
    let owner=false;
    try{owner=!managedOwner&&await authenticated(req,env);}catch(error){
      console.error('Account 4 session backend unavailable:',error instanceof Error?error.message:'unknown');
      if(u.pathname==='/')return renderLogin();
      return j({error:'Account 4 session service unavailable. Verify the D1 migration and Worker binding.'},503);
    }
    let identity=await sessionIdentity(req,env);const cloudflareActor=await accessIdentity(req,env);
    if(!identity&&(owner||cloudflareActor))identity=await bootstrapIdentity(env,cloudflareActor||'emmanuel2026miracle@gmail.com');
    const securityResponse=await identityRoute(req,env,identity);if(securityResponse)return securityResponse;
    if(identity)owner=identity.role==='owner';
    if(u.pathname==='/api/packages'&&req.method==='PUT'){
      const actor=await canSubmitPackage(req,env,owner);
      if(!actor)return j({error:'Account 4 login or an authorized assistant connector token is required.'},401);
      if(actor==='dashboard'&&!sameOrigin(req))return j({error:'Invalid upload origin.'},403);
      if(actor!=='dashboard'&&req.headers.get('Origin')&&req.headers.get('Origin')!==u.origin)return j({error:'Cross-origin upload rejected.'},403);
      return acceptPackage(req,env,actor);
    }
    if(u.pathname==='/api/proposals'&&req.method==='POST'){
      const actor=await canSubmitPackage(req,env,owner);
      if(!actor)return j({error:'Authorized proposal submission token required.'},401);
      if(actor==='dashboard'&&!sameOrigin(req))return j({error:'Invalid origin'},403);
      if(actor!=='dashboard'&&req.headers.get('Origin')&&req.headers.get('Origin')!==u.origin)return j({error:'Cross-origin request blocked.'},403);
      return acceptProposal(req,env,actor);
    }
    if(!owner){
      // A second device has no session cookie. A person navigating to a JSON link
      // should see the sign-in form, but actual API clients must still receive 401 JSON.
      if(u.pathname==='/' || (req.method==='GET' && u.pathname==='/login')) return renderLogin();
      const browserNavigation=req.method==='GET' && u.pathname.startsWith('/api/')
        && (req.headers.get('Sec-Fetch-Mode')==='navigate'
          || (req.headers.get('Accept')||'').includes('text/html'));
      if(browserNavigation)return new Response(null,{status:303,headers:{Location:'/', 'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
      return j({error:'Administrator login required. Open the Account 4 homepage to sign in.',loginUrl:'/'},401);
    }
    if(req.method==='GET'&&u.pathname==='/login')
      return new Response(null,{status:303,headers:{Location:'/', 'Cache-Control':'no-store'}});
    if(req.method!=='GET'&&req.method!=='HEAD'&&!sameOrigin(req))
      return j({error:'Invalid request origin.'},403);

    if (u.pathname === "/")
      return new Response(page, {
        headers: {
          ...H,
          "Content-Type": "text/html;charset=utf-8"
        }
      });

    if (u.pathname === '/api/packages' && req.method === 'GET') return listPackages(req,env);
    if (u.pathname === '/api/password/change' && req.method === 'POST'){if(managedOwner){const data:any=await req.json();return (await identityRoute(new Request(new URL('/api/security/change-password',req.url),{method:'POST',headers:req.headers,body:JSON.stringify({currentPassword:data.currentPassword,password:data.newPassword})}),env,identity))!;}return changePassword(req,env);}
    if (u.pathname === '/api/integrations' && req.method === 'GET') return integrationsStatus(env);
    if (u.pathname === '/api/integrations/openapi.json' && req.method === 'GET') return j(assistantOpenApi);
    if (u.pathname === '/api/integrations/token' && req.method === 'POST') {
      let details:any;
      try{details=await req.json();}catch{return j({error:'Invalid request body'},400);}
      if(!await verifyOwnerPassword(details?.password,env))return j({error:'Re-enter your Account 4 administrator password to manage connector credentials.'},403);
      return manageConnector(env,details);
    }


    if(u.pathname==='/api/cms-updates'&&req.method==='GET'){
      try{
        const current=await gh(env,'/commits/main');
        const released=await state(env,'1');
        const [available,installed]=await Promise.all([
          cmsManifest(env,'main'),
          released.liveRelease?.sha?cmsManifest(env,released.liveRelease.sha):Promise.resolve(null)
        ]);
        const canStage=Boolean(available&&available.version!==installed?.version&&current.sha!==released.liveRelease?.sha);
        return j({product:'Heavenly Key Visual CMS',available,installed,
          updateAvailable:canStage,targetSha:canStage?current.sha:null,
          steps:['Stage on Account 4','Test and preview','Owner approval','Deploy to Account 1'],
          note:'CMS updates are never installed directly from this button. The Account 4 approval and CMS protection checks still apply.'});
      }catch(e:any){return j({error:e.message},502);}
    }
    // Account 5 is a separate repo and Cloudflare account. This status endpoint
    // is owner-session-only and never dispatches any deployment.
    if (u.pathname === "/api/account5/status" && req.method === "GET") {
      const status=await account5Status(env);
      const recorded=status.latestSha?await env.RECOVERY_STATE.get('account5:review_arrival:'+status.latestSha):null;
      // An Account 5 review registration is not equivalent to deploying or staging
      // into one of Accounts 1-3's Cloudflare Workers.
      return j({...status,reviewArrivalAt:recorded||null});
    }
    if (u.pathname === "/api/account5/arrival" && req.method === "POST") {
      const body=await req.json().catch(()=>({})) as {targetSha?:string};
      const candidate=await account5Status(env);
      if(!candidate.latestSha||candidate.latestSha!==body.targetSha||candidate.checks!=='success')
        return j({error:'Account 5 review registration requires its verified latest commit and successful independent GitHub CI. Configure the optional read-only APP5_GITHUB_READ_TOKEN if unavailable.'},409);
      const key='account5:review_arrival:'+candidate.latestSha;
      const arrivedAt=await env.RECOVERY_STATE.get(key)||new Date().toISOString();
      await env.RECOVERY_STATE.put(key,arrivedAt,{expirationTtl:60*60*24*365});
      await audit(env,req,'5','review-arrival',candidate.latestSha);
      return j({account:'5',sha:candidate.latestSha,reviewArrivalAt:arrivedAt,stagedOnCloudflare:false,productionDeployed:false},202);
    }


    if(u.pathname==='/api/app-release-controls'){
      const ids=['all-in-one','bible','radio','walk','study','community'];
      if(req.method==='GET'){
        const apps:Record<string,unknown>={};for(const id of ids){const raw=await env.RECOVERY_STATE.get('app-release:'+id);try{apps[id]=raw?JSON.parse(raw):{cadence:1}}catch{apps[id]={cadence:1}}}return j({apps,policy:'Owner-controlled review requests; no automatic deployment'});
      }
      if(req.method==='POST'){
        let input:{app?:string;action?:string;cadence?:number};try{input=await req.json()}catch{return j({error:'Invalid JSON'},400)}
        if(!ids.includes(input.app||'')||!['cadence','request'].includes(input.action||''))return j({error:'Unknown app or action'},400);
        const id=input.app!;const key='app-release:'+id;let current:{cadence:number;requestedAt?:string;requestCount?:number}={cadence:1};try{const raw=await env.RECOVERY_STATE.get(key);if(raw)current={...current,...JSON.parse(raw)}}catch{}
        if(input.action==='cadence'){
          if(input.cadence!==1&&input.cadence!==2)return j({error:'Choose monthly or twice monthly'},400);
          current.cadence=input.cadence;
        }else{
          const now=new Date().toISOString();current.requestedAt=now;current.requestCount=(current.requestCount||0)+1;
          await audit(env,req,'4','app-update-review-request:'+id,now);
        }
        await env.RECOVERY_STATE.put(key,JSON.stringify(current));return j({ok:true,app:id,settings:current,productionDeployed:false});
      }
      return j({error:'Method not allowed'},405);
    }
    if (u.pathname === "/api/status") {
      try {
        const commit = await gh(env, "/commits/main");
        const out = [];

        for (const a of ["1", "2", "3"] as Account[]) {
          const s: any = await state(env, a);

          out.push(s);
        }

        // Account 4 deploys itself; it has no independent Account 4 Waiting Room.
        const controlRuns=await runs(env,'cloudflare-recovery-control.yml');
        const lastControl=(controlRuns as Array<any>).find(x=>x.status==='completed'&&x.conclusion==='success'&&/^[0-9a-f]{40}$/i.test(x.head_sha||''))||null;
        return j({
          latestSha: commit.sha,
          account4Release:lastControl?{sha:lastControl.head_sha,completedAt:lastControl.updated_at||null,url:lastControl.html_url||null}:null,
          pendingCount: out.filter(x=>x.newUpdate).length,
          awaitingApproval: out.filter(x=>x.pendingReview).length,
          accounts: out
        });
      } catch (e: any) {
        return j({ error: e.message }, 502);
      }
    }

    if (u.pathname === "/api/preview-link" && req.method === "POST") {
      try {
        const input=await req.json() as {account?:string;targetRef?:string};
        const a=String(input.account||'') as Account;
        const sha=String(input.targetRef||'').toLowerCase();
        if(!accounts[a]||!/^[0-9a-f]{40}$/.test(sha))return j({error:'Invalid account or commit'},400);
        const current=await state(env,a);
        if(!current.pendingReview||!current.testedRelease||current.latestStage?.sha!==sha||current.testedRelease.sha!==sha){
          return j({error:'Only the latest successful, unpromoted preview can be reviewed.'},409);
        }
        const exp=String(Math.floor(Date.now()/1000)+900);
        const url=accounts[a].preview+'/';
        await env.RECOVERY_STATE.put('review_seen:'+a+':'+sha,new Date().toISOString(),{expirationTtl:60*60*24*90});
        await audit(env,req,a,'preview',sha);
        return j({url,expiresAt:new Date(Number(exp)*1000).toISOString(),sha,account:a});
      }catch(e:any){return j({error:e.message},502);}
    }

    if (u.pathname === "/api/action" && req.method === "POST") {
      try {
        const b: any = await req.json();
        const a = String(b.account) as Account;

        if (!accounts[a])
          return j({ error: "Unknown account" }, 400);

        const c = accounts[a];
        const sha = String(b.targetRef || "").toLowerCase();

        if (!/^[a-f0-9]{40}$/.test(sha))
          return j(
            { error: "Exact commit SHA required" },
            400
          );

        if((b.action==='promote'||b.action==='restore') &&
          !await verifyOwnerPassword(b.ownerPassword,env))
          return j({error:'Enter your Account 4 administrator password to authorize this production operation.'},403);

        if (b.action === "stage") {
          await dispatch(env, c.stage, {
            account: a,
            target_ref: sha
          });

          await audit(
            env,
            req,
            a,
            "stage",
            sha
          );

          return j({
            ok: true,
            message:
              "Account 4 isolated Waiting Room started; live unchanged."
          }, 202);
        }

        if (b.action === "promote") {
          const s: any = await state(env, a);

          if (
            !s.canPromote ||
            !s.testedRelease ||
            s.testedRelease.sha !== sha
          )
            return j({
              error:
                "Only the exact latest successful Waiting Room release may be promoted."
            }, 409);

          if(!await env.RECOVERY_STATE.get('review_seen:'+a+':'+sha))
            return j({error:'Open the temporary preview before approving this release.'},409);
          const expiration=String(Math.floor(Date.now()/1000)+3600);
          const approval_proof=expiration+'.'+await approvalSignature(env,a,sha,expiration);
          await dispatch(env, c.prod, {
            target_ref: sha,
            release_note:
              "Explicitly reviewed and approved by owner from Account 4 Website Update Centre",
            confirm_production: "PROMOTE",
            approval_proof
          });
          // Record the successful dispatch separately; do not call it a deployment.
          await env.RECOVERY_STATE.put('approval_requested:'+a+':'+sha,new Date().toISOString(),{expirationTtl:60*60*24*365});

          await audit(
            env,
            req,
            a,
            "promote",
            sha
          );

          return j({ ok: true }, 202);
        }

        if (b.action === "restore") {
          const s=await state(env,a);
          const knownGood=s.previous.some((q:{sha:string})=>q.sha===sha);

          if (!knownGood)
            return j({
              error:
                "Restore is limited to a verified previously successful production release."
            }, 409);

          const restoreExpiration=String(Math.floor(Date.now()/1000)+600);
          const restore_proof=restoreExpiration+'.'+await restoreSignature(env,a,sha,restoreExpiration);
          await dispatch(env, c.restore, {
            target_ref: sha,
            confirm_restore: "RESTORE",
            restore_proof
          });

          await audit(
            env,
            req,
            a,
            "restore",
            sha
          );

          return j({
            ok: true,
            message:
              "Emergency restore started using the dedicated no-migration recovery workflow."
          }, 202);
        }

        return j({ error: "Unknown action" }, 400);
      } catch (e: any) {
        return j({ error: e.message }, 502);
      }
    }

    return j({ error: "Not found" }, 404);
  }
};

