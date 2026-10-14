# Heavenly Key: Five-Account Release and Permanent Data Policy
Approved project direction: 10 October 2026. This document clarifies the existing protected-production-state policy; it does not authorize bypassing protected deployment approvals.

## Principle: update the software, keep the ministry's existing data
A normal tested and approved release MUST be able to update the website, app, homepage presentation, page content templates, AI-assistant interface, community interface, broadcast/player interface, social-scheduler code, bug fixes and other ordinary application source.

**Do not interpret "protect the database/CMS" as "freeze the whole website."** Do not hold back reviewed feature/UI code simply because it is in the same repository as the CMS or database. Conversely, a successful code deployment does not publish an unpublished CMS draft and does not merge a separate pending GitHub branch.

During routine releases, preserve **all existing D1 databases and records, KV namespaces and session state, R2 buckets and published media, member/admin accounts, hashes/passwords, CMS published content/drafts/revision history, ministry settings, group content, live/scheduled state, social OAuth connections, stream keys and Cloudflare secrets**. Never delete, recreate, reseed, overwrite or rotate these resources automatically.

### What can be updated, and how

| Type | Normal code-only release | Extra approval / treatment |
| --- | --- | --- |
| Public website HTML/CSS/JS, navigation, graphics, ordinary page templates and new features | **Yes** after exact-version CI + staging/preview | Existing published CMS values continue to override templates where intended |
| AI assistant UI, opt-in Bible controls, app experience, feed/groups interface, radio/TV players and scheduler software | **Yes** after feature tests and compatibility checks | Real third-party integration claims require actual end-to-end tests |
| CMS *software* or database-access code | Not automatically assumed safe; review changes against CMS compatibility and auth/data protection gates | A separately reviewed security-sensitive change may be necessary, **without** wiping CMS *content* |
| CMS drafts, published text/images, revisions, home slider/layout, member/admin roles, posts, messages, prayer requests, settings | **Never reset or replace as a side effect of code deployment** | Owners edit CMS content explicitly in its own authorised publish workflow |
| Existing D1/KV/R2 binding IDs and Worker secret values | **Preserve unchanged** | Validate identity pins; do not create replacement empty stores |
| New/modified SQL, data migrations, backfills, table/schema changes | **No**, not during code-only deployment | Separate versioned owner-reviewed migration, tested on staging, backup/time-travel check and recovery instructions; additive changes preferred |
| Social provider tokens, linked pages/channels and RTMP/LiveKit keys | **Preserve unchanged** | New authorisations/revocations require deliberate owner action; never fabricate provider readiness |
| Temporary social-distribution media | Continue existing **delivery-confirmed retention** policy | Delete only according to the approved lifecycle after destinations finish; permanent Bible/broadcast media is not temporary |
| Cloudflare/GitHub account configuration, security controls, passwords | **Not part of routine code updates** | Owner-reviewed security change; do not weaken signed approvals |

## Account-specific owner and storage boundaries

1. **Account 1 — Main Website & CMS:** Cloudflare Worker `heavenlykey`, D1 `heavenlykey-db`, existing CMS content and image/media assets, member/admin identity and applicable KV namespaces. Source: `heavenly-key-website/`, `src/`, relevant tests. Preserve the published CMS data; update the frontend normally.
2. **Account 2 — Media Engine:** Worker `heavenlykey-media`, D1 `heavenlykey-media-db`, its original KV and R2 media bucket, connected social channels, program schedules and recordings. Source: `media-engine/`. Code updates must not wipe channels, recordings or broadcast settings.
3. **Account 3 — Global Christian Community:** Worker `heavenly-key-global-community`, D1 `heavenly-key-global-community-db`, sessions KV `heavenly-key-global-community-sessions`, R2 `heavenly-key-global-community-media`. Source: `global-community/`. Keep membership, feed/groups, messages, community settings and session data.
4. **Account 4 — Owner Update Centre:** Worker `heavenlykey-recovery-control`, original protected D1, KV and R2 bindings. Source: `recovery-control/`. Maintain the independent administrator credential and signed release/restore gates. Account 4 reviews and signs releases for Accounts 1–3.
5. **Account 5 — Mobile App:** Separate repository `aoemeta247-cell/heavenly-key-mobile-app`, Worker `heavenly-key-app`. It currently hosts public/PWA assets and a health endpoint and **does not share Accounts 1–4's databases or credentials**. Update its app assets independently after its tests; do not invent member integration or production mobile-app publishing.

The former `alldaywow247-ops/heavenlykey` project is an **older source repository**, not an automatically authoritative newer version. Compare actual commit dates, file hashes, tests and open PRs with `aoemeta247-cell/All-Nations-For-Christ-Outreach` before promoting. Do not blindly overwrite the current frontend with the original repository or treat staging-only PR work as already merged.

The independent public domain `heavenlykey.org` is not automatically switched to the Account 1 Worker by a Wrangler deployment; domain/DNS routing is a separate, explicitly approved operation.

## Release checklist for every change

1. **Choose the source:** record the correct repository, branch, exact commit SHA, PR/merge status and whether it includes the owner's requested feature. Never deploy merely because a CI staging job succeeded.
2. **Prepare a change manifest:** account(s) affected; code/assets changed; whether CMS software or content changes; affected storage bindings; schema/migration changes (expected: **none** for ordinary release); external integration and data preservation risks.
3. **Compare against production:** identify the current live SHA/version (not just Worker "Ready"); inspect public pages and key UI. If the new source does not contain the requested feature, reconcile code before deployment.
4. **Run appropriate CI and isolated tests:** account-specific staging; auth, CMS draft/revision compatibility, feed/member continuity, media playback, scheduled delivery, mobile links and security tests as relevant.
5. **Run protected resource identity and secret-name checks, read-only.** Do not log secret values. For schema work, use a separate reviewed migration workflow after validating recovery capabilities.
6. **Authorize with existing controls:** owner-signed exact-SHA approval for Accounts 1–3 using Account 4; Account 4's separate owner release confirmation; Account 5's repository-specific release protection. The user may approve code releases without separately asking to wipe/recreate any data, because that is forbidden.
7. **Deploy only affected account(s).** Do not redeploy five Workers or copy database bindings from one account to another just because one UI changed.
8. **Verify actual live behavior:** release SHA, exact public page/asset contents, health, login continuity, CMS public content and storage bindings. Distinguish code deployed / integration operational / custom domain routed / CMS content published. Record failures and rollback code safely; never assume code rollback rolls back D1/KV/R2.

## Guardrails and exceptions
The protected-state gate and owner-signed release verification are **not a prohibition on changing the website**. They protect sensitive code and persisted state. Ordinary unprotected feature files may be reviewed and released. If a desired improvement truly requires changing protected auth/CMS engine code, SQL or cloud bindings, submit that specific change for independent review and the existing owner approval flow; do not disable the protection or fake a proof.

Never claim that an external Facebook/YouTube/TikTok post, live stream or social account has worked until the relevant provider has been connected and a real end-to-end test succeeds.

**Success condition:** the *new requested feature appears on the correct production domain*, existing admin/member credentials and published content still work, and no persistent storage/secret IDs were unexpectedly changed.