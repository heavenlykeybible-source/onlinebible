import type { Env } from "./auth-service";
import { createPublishJobs, publishJobResults } from "./social-management-service";

export interface BlogPostInput {
  title: string;
  excerpt?: string;
  body: string;
  slug?: string;
  publish_at?: string | null;
  publish_now?: boolean;
  share_to_social?: boolean;
}

function makeSlug(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}
function canonicalUrl(slug: string): string {
  return "https://www.heavenlykey.org/blog/" + encodeURIComponent(slug) + "/";
}
export function formatBlogSocialText(post: any, url: string, platform: string): string {
  const title = String(post.title || "").trim();
  const excerpt = String(post.excerpt || "").trim();
  const signature = "Heavenly Key Evangelistic Movement — Taking Christ to the Nations of the World.";
  if (platform === "x") {
    // X is limited to 280 characters. Preserve the article link and title first.
    const link = String(url || "").trim();
    const safeTitle = Array.from(title).slice(0, Math.max(0, 279 - Array.from(link).length)).join("");
    const room = Math.max(0, 278 - Array.from(safeTitle).length - Array.from(link).length);
    const shortExcerpt = Array.from(excerpt).slice(0, Math.max(0, room - 1)).join("");
    return [safeTitle, shortExcerpt ? shortExcerpt + "…" : "", link].filter(Boolean).join("\n").slice(0, 280);
  }
  return [title, excerpt, url, signature].filter(Boolean).join("\n\n").slice(0, platform === "instagram" ? 2200 : 5000);
}
async function enqueueSocialShare(env: Env, post: any, actorId: number): Promise<{status:string;error?:string;job_ids?:number[]}> {
  if (!post.share_to_social) return { status: "not_requested" };
  // Use only text/link formats currently supported by the provider integration.
  // Instagram/TikTok/YouTube need media-specific flows and are not represented as
  // automated destinations by this text-only blog distribution path.
  const accounts = await env.DB.prepare(
    "SELECT id,platform FROM social_managed_accounts WHERE active=1 AND connection_status='connected' AND platform IN ('facebook','x','linkedin') ORDER BY platform,display_name"
  ).all<{id:string;platform:string}>();
  const rows = accounts.results || [];
  if (!rows.length) return { status: "failed", error: "No active Facebook, X, or LinkedIn publishing account is connected." };
  const url = canonicalUrl(String(post.slug));
  const jobIds:number[]=[];
  const errors:string[]=[];
  const byPlatform = new Map<string,string[]>();
  for (const row of rows) {
    const list = byPlatform.get(row.platform) || [];
    list.push(String(row.id));
    byPlatform.set(row.platform,list);
  }
  for (const [platform, ids] of byPlatform) {
    try {
      const jobs = await createPublishJobs(env, {
        account_ids: ids,
        text: formatBlogSocialText(post,url,platform),
        media_ids: [],
        publish_mode: "post_now"
      }, actorId);
      jobIds.push(...jobs);
    } catch (error) {
      errors.push(platform + ": " + (error instanceof Error ? error.message : "publishing could not be queued"));
    }
  }
  if (!jobIds.length) return { status: "failed", error: errors.join("; ") || "No social publishing jobs were created." };
  const results = await publishJobResults(env, jobIds);
  const failed = results.filter((item:any) => item.status === "failed").length;
  const done = results.filter((item:any) => item.status === "published").length;
  const status = failed === results.length ? "failed" : (failed || errors.length) ? "partial" : done === results.length ? "complete" : "queued";
  const details = [...errors, ...(failed ? [failed + " social destination(s) failed; review the social publishing history."] : [])];
  return { status, job_ids: jobIds, ...(details.length ? { error: details.join("; ") } : {}) };
}
async function safeEnqueueSocialShare(env: Env, post: any, actorId: number) {
  try { return await enqueueSocialShare(env, post, actorId); }
  catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "Social publishing failed unexpectedly." };
  }
}
export async function listPublicBlogPosts(env: Env, limit = 20) {
  const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.floor(limit) : 20, 1), 50);
  const result = await env.DB.prepare(
    "SELECT slug,title,excerpt,published_at,created_at FROM blog_posts WHERE status='published' ORDER BY published_at DESC,post_id DESC LIMIT ?"
  ).bind(safeLimit).all();
  return result.results || [];
}
export async function getPublicBlogPost(env: Env, slug: string) {
  return env.DB.prepare(
    "SELECT slug,title,excerpt,body,published_at FROM blog_posts WHERE status='published' AND slug=? LIMIT 1"
  ).bind(slug).first();
}
export async function listAdminBlogPosts(env: Env, limit = 100) {
  const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.floor(limit) : 100, 1), 200);
  const result = await env.DB.prepare(
    "SELECT post_id,slug,title,excerpt,status,scheduled_at,published_at,share_to_social,social_share_status,social_share_error,created_at,updated_at FROM blog_posts ORDER BY post_id DESC LIMIT ?"
  ).bind(safeLimit).all();
  return result.results || [];
}

export async function createBlogPost(env: Env, input: BlogPostInput, actorId: number) {
  const title = String(input.title || "").trim().slice(0, 180);
  const excerpt = String(input.excerpt || "").trim().slice(0, 500);
  const body = String(input.body || "").trim().slice(0, 100000);
  if (title.length < 3) throw new Error("Enter a title of at least 3 characters.");
  if (body.length < 20) throw new Error("Enter article content of at least 20 characters.");
  const slug = makeSlug(String(input.slug || title));
  if (!slug) throw new Error("Choose a valid article title or URL slug.");
  let status: "draft"|"scheduled"|"published" = "draft";
  let scheduledAt: string | null = null;
  let publishedAt: string | null = null;
  if (input.publish_at) {
    const parsed = new Date(input.publish_at);
    if (!Number.isFinite(parsed.getTime()) || parsed.getTime() <= Date.now()) throw new Error("Scheduled publishing time must be in the future.");
    status = "scheduled";
    scheduledAt = parsed.toISOString();
  } else if (input.publish_now) {
    status = "published";
    publishedAt = new Date().toISOString();
  }
  const share = input.share_to_social === false ? 0 : 1;
  const row = await env.DB.prepare(
    "INSERT INTO blog_posts(slug,title,excerpt,body,status,scheduled_at,published_at,share_to_social,social_share_status,created_by,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING post_id,slug,title,excerpt,body,status,scheduled_at,published_at,share_to_social"
  ).bind(slug,title,excerpt,body,status,scheduledAt,publishedAt,share,status!=="draft"&&share?"pending":"not_requested",actorId,actorId).first<any>();
  if (!row) throw new Error("The article could not be saved.");
  if (status === "published" && share) {
    const distribution = await safeEnqueueSocialShare(env,row,actorId);
    await env.DB.prepare("UPDATE blog_posts SET social_share_status=?,social_share_error=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=?")
      .bind(distribution.status,distribution.error||null,row.post_id).run();
    return {...row,social_share_status:distribution.status,social_share_error:distribution.error||null,social_job_ids:distribution.job_ids||[]};
  }
  return {...row,social_share_status:status==="scheduled"&&share?"pending":"not_requested"};
}

export async function publishBlogPost(env: Env, postId: number, actorId: number) {
  const row = await env.DB.prepare("SELECT * FROM blog_posts WHERE post_id=? AND status IN ('draft','scheduled')").bind(postId).first<any>();
  if (!row) throw new Error("Draft or scheduled article not found.");
  const publishedAt = new Date().toISOString();
  const updated = await env.DB.prepare("UPDATE blog_posts SET status='published',scheduled_at=NULL,published_at=?,social_share_status=?,social_share_error=NULL,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=? AND status IN ('draft','scheduled')")
    .bind(publishedAt,row.share_to_social?'pending':'not_requested',actorId,postId).run();
  if (!updated.meta.changes) throw new Error("The article changed before it could be published.");
  const post = {...row,status:"published",published_at:publishedAt};
  if (row.share_to_social) {
    const distribution = await safeEnqueueSocialShare(env,post,actorId);
    await env.DB.prepare("UPDATE blog_posts SET social_share_status=?,social_share_error=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=?")
      .bind(distribution.status,distribution.error||null,postId).run();
    return {post_id:postId,status:"published",social_share_status:distribution.status,social_share_error:distribution.error||null,social_job_ids:distribution.job_ids||[]};
  }
  return {post_id:postId,status:"published",social_share_status:"not_requested",social_job_ids:[]};
}

/** Runs from the Worker's scheduled handler; due posts publish without a visitor opening the site. */
export async function runDueBlogPublications(env: Env) {
  // Recover claims abandoned by a previous Worker interruption before selecting
  // due work. A post can only be reclaimed while it remains in "publishing".
  await env.DB.prepare(
    "UPDATE blog_posts SET status='scheduled',updated_at=CURRENT_TIMESTAMP WHERE status='publishing' AND updated_at < datetime('now','-10 minutes')"
  ).run();
  const due = await env.DB.prepare(
    "SELECT post_id FROM blog_posts WHERE status='scheduled' AND scheduled_at IS NOT NULL AND julianday(scheduled_at)<=julianday('now') ORDER BY scheduled_at LIMIT 10"
  ).all<{post_id:number}>();
  let published = 0;
  let failed = 0;
  for (const item of due.results || []) {
    try {
      const claim = await env.DB.prepare(
        "UPDATE blog_posts SET status='publishing',updated_at=CURRENT_TIMESTAMP WHERE post_id=? AND status='scheduled'"
      ).bind(item.post_id).run();
      if (!claim.meta.changes) continue;
      const post = await env.DB.prepare("SELECT * FROM blog_posts WHERE post_id=? AND status='publishing'").bind(item.post_id).first<any>();
      if (!post) {
        await env.DB.prepare("UPDATE blog_posts SET status='scheduled',updated_at=CURRENT_TIMESTAMP WHERE post_id=? AND status='publishing'").bind(item.post_id).run();
        continue;
      }
      const stamp = new Date().toISOString();
      const result = await env.DB.prepare(
        "UPDATE blog_posts SET status='published',published_at=?,scheduled_at=NULL,social_share_status=?,social_share_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE post_id=? AND status='publishing'"
      ).bind(stamp,post.share_to_social?'pending':'not_requested',item.post_id).run();
      if (!result.meta.changes) continue;
      if (post.share_to_social) {
        const distribution = await safeEnqueueSocialShare(env,{...post,published_at:stamp},Number(post.created_by));
        await env.DB.prepare("UPDATE blog_posts SET social_share_status=?,social_share_error=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=?")
          .bind(distribution.status,distribution.error||null,item.post_id).run();
      }
      published++;
    } catch (error) {
      failed++;
      const message=(error instanceof Error?error.message:"Unexpected scheduled publishing failure.").slice(0,1000);
      // If publication did not commit, release the claim for a later retry.
      // If it did commit, do not revert a publicly visible article to scheduled.
      await env.DB.prepare(
        "UPDATE blog_posts SET status='scheduled',social_share_status='failed',social_share_error=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=? AND status='publishing'"
      ).bind(message,item.post_id).run().catch(()=>undefined);
    }
  }
  return {published,failed};
}
