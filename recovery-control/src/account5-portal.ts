/** Account 5 lives in a DIFFERENT private GitHub repository and Cloudflare account.
 * Read-only; cannot publish through Account 1–3 or bypass the Account 4 owner gate. */
export const APP5 = Object.freeze({
  repository: "aoemeta247-cell/heavenly-key-mobile-app",
  label: "Account 5 — Heavenly Key Mobile App",
  github: "https://github.com/aoemeta247-cell/heavenly-key-mobile-app",
  cloudflare: "https://dash.cloudflare.com/",
  live: "https://heavenly-key-app.heavenlykeyapp.workers.dev"
});

const headers:HeadersInit = {
  Accept:"application/vnd.github+json",
  "X-GitHub-Api-Version":"2022-11-28",
  "User-Agent":"heavenlykey-account4-app5-readonly"
};
async function githubRead(token:string,path:string) {
  if(!token)return null;
  const r=await fetch("https://api.github.com/repos/"+APP5.repository+path,{
    method:"GET",headers:{...headers,Authorization:"Bearer "+token},
    signal:AbortSignal.timeout(9000)
  });
  if(!r.ok) return null; // Wrong repo grant stays isolated from Accounts 1–3.
  return r.json();
}
export async function account5Status(env:{APP5_GITHUB_READ_TOKEN?:string}) {
  const result:{
    account:string;label:string;repository:string;github:string;cloudflare:string;live:string;
    integration:string;latestSha:string|null;checks:string;deploymentVerified:boolean;
    releaseMode:string;note:string;
    sourceUpdatedAt:string|null;checksCompletedAt:string|null;
    waitingRoomArrivalAt:string|null;approvalRecordedAt:string|null;productionDeployedAt:string|null;
    sourceCommittedAt:string|null;buildArrivedAt:string|null;buildCompletedAt:string|null;deployedAt:string|null;
  }={
    account:"5",label:APP5.label,repository:APP5.repository,
    github:APP5.github,cloudflare:APP5.cloudflare,live:APP5.live,
    integration:"not-verified",latestSha:null,checks:"unknown",deploymentVerified:false,
    sourceUpdatedAt:null,checksCompletedAt:null,waitingRoomArrivalAt:null,
    approvalRecordedAt:null,productionDeployedAt:null,
    sourceCommittedAt:null,buildArrivedAt:null,buildCompletedAt:null,deployedAt:null,
    releaseMode:"independent-cloudflare-builds",
    note:"Account 5 uses its own GitHub repository and Cloudflare Builds, not the Account 1–3 Waiting Room. Source and CI times are shown when independently available. No Account 4 approval or production deployment time is claimed without a verified independent release record."
  };
  try {
    const repo=await githubRead(env.APP5_GITHUB_READ_TOKEN||"","/commits/main");
    if(repo && /^[a-f0-9]{40}$/i.test(repo.sha||"")) {
      result.integration="repository-readable";
      result.latestSha=repo.sha;
      result.sourceUpdatedAt=repo.commit?.committer?.date||repo.commit?.author?.date||null;
      result.sourceCommittedAt=typeof repo.commit?.committer?.date==='string'?repo.commit.committer.date:null;
      const runs=await githubRead(env.APP5_GITHUB_READ_TOKEN||"","/actions/workflows/app-ci.yml/runs?per_page=10");
      const run=(runs?.workflow_runs||[]).find((x:any)=>x.head_sha===repo.sha);
      result.checks=run?String(run.conclusion||run.status||"unknown"):"no-matching-ci-run";
      result.checksCompletedAt=run?.status==="completed"?(run.updated_at||null):null;
      result.buildArrivedAt=typeof run?.created_at==='string'?run.created_at:null;
      result.buildCompletedAt=run?.status==='completed'&&typeof run.updated_at==='string'?run.updated_at:null;
      // CI success is NOT evidence that Cloudflare has published the app.
      // A verified production timestamp requires separate Cloudflare evidence.
    } else {
      result.note+=" An optional read-only Account 5 GitHub token has not been configured or cannot confirm access to the separate private app repository; open the repository's GitHub/Cloudflare links for status.";
    }
  } catch {
    result.note+=" Separate private repository status could not be fetched; other accounts are unaffected.";
  }
  return result;
}
