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
function canonicalUrl(env: Env, slug: string): string {
  const base = String(env.PUBLIC_SITE_URL || "https://www.heavenlykey.org").replace(/\/$/, "");
  return base + "/blog/article.html?slug=" + encodeURIComponent(slug);
}
function shareText(post: any, url: string): string {
  return [String(post.title || "").trim(), String(post.excerpt || "").trim(), url,
    "Heavenly Key Evangelistic Movement — Taking Christ to the Nations of the World."]
    .filter(Boolean).join("\n\n").slice(0, 5000);
}
async function enqueueSocialShare(env: Env, post: any, actorId: number): Promise<{status:string;error?:string;job_ids?:number[]}> {
  if (!post.share_to_social) return { status: "not_requested" };
  // Only use text/link formats currently supported by the provider integration.
  // Instagram/TikTok/YouTube require media-specific flows and are intentionally
  // not falsely marked as published by this text-only blog distribution path.
  const accounts = await env.DB.prepare(
    "SELECT id FROM social_managed_accounts WHERE active=1 AND connection_status='connected' AND platform IN ('facebook','x','linkedin') ORDER BY platform,display_name"
  ).all<{id:string}>();
  const ids = (accounts.results || []).map(row => String(row.id));
  if (!ids.length) return { status: "failed", error: "No active Facebook, X, or LinkedIn publishing account is connected." };
  try {
    const jobs = await createPublishJobs(env, {
      account_ids: ids,
      text: shareText(post, canonicalUrl(env, String(post.slug))),
      media_ids: [],
      publish_mode: "post_now"
    }, actorId);
    if (!jobs.length) return { status: "failed", error: "No social publishing jobs were created." };\n    const results = await publishJobResults(env, jobs);\n    const failed = results.filter((item:any) => item.status === "failed").length;\n    const done = results.filter((item:any) => item.status === "published").length;\n    const status = failed === results.length ? "failed" : failed ? "partial" : done === results.length ? "complete" : "queued";\n    return { status, job_ids: jobs, ...(failed ? { error: failed + " social destination(s) failed; review the social publishing history." } : {}) };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "Social sharing could not be queued." };
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
  ).bind(slug,title,excerpt,body,status,scheduledAt,publishedAt,share,status==="published"&&share?"pending":"not_requested",actorId,actorId).first<any>();
  if (!row) throw new Error("The article could not be saved.");
  if (status === "published" && share) {
    const distribution = await enqueueSocialShare(env,row,actorId);
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
    const distribution = await enqueueSocialShare(env,post,actorId);
    await env.DB.prepare("UPDATE blog_posts SET social_share_status=?,social_share_error=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=?")
      .bind(distribution.status,distribution.error||null,postId).run();
    return {post_id:postId,status:"published",social_share_status:distribution.status,social_share_error:distribution.error||null,social_job_ids:distribution.job_ids||[]};
  }
  return {post_id:postId,status:"published",social_share_status:"not_requested",social_job_ids:[]};
}

/** Runs from the Worker's scheduled handler; due posts publish without a visitor opening the site. */
export async function runDueBlogPublications(env: Env) {
  const due = await env.DB.prepare(
    "SELECT post_id FROM blog_posts WHERE status='scheduled' AND scheduled_at IS NOT NULL AND julianday(scheduled_at)<=julianday('now') ORDER BY scheduled_at LIMIT 10"
  ).all<{post_id:number}>();
  let published = 0;
  for (const item of due.results || []) {
    const claim = await env.DB.prepare("UPDATE blog_posts SET status='publishing',updated_at=CURRENT_TIMESTAMP WHERE post_id=? AND status='scheduled'").bind(item.post_id).run();
    if (!claim.meta.changes) continue;
    const post = await env.DB.prepare("SELECT * FROM blog_posts WHERE post_id=?").bind(item.post_id).first<any>();
    if (!post) continue;
    const stamp = new Date().toISOString();
    await env.DB.prepare("UPDATE blog_posts SET status='published',published_at=?,scheduled_at=NULL,social_share_status=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=? AND status='publishing'")
      .bind(stamp,post.share_to_social?'pending':'not_requested',item.post_id).run();
    if (post.share_to_social) {
      const distribution = await enqueueSocialShare(env,{...post,published_at:stamp},Number(post.created_by));
      await env.DB.prepare("UPDATE blog_posts SET social_share_status=?,social_share_error=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=?")
        .bind(distribution.status,distribution.error||null,item.post_id).run();
    }
    published++;
  }
  return {published};
}
