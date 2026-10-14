# Social publishing scheduler — owner, user, and provider release audit

Status: development branch only. This document does not certify live posting or authorize a release.

## Product behaviour and owner controls
- Scheduling one approved image/video creates one job per selected authorized destination. The API rejects unsupported media types before retaining a media file.
- Uploaded social media is retained in Account 2 until all relevant jobs are complete. After provider publication confirmation, files not referenced by another unresolved job are deleted. A cancelled last job may release unused temporary media.
- Uploaded published radio/TV recordings are exempt from automatic social publishing cleanup.
- A failed/unconfirmed provider result must not be silently marked published or blindly retried. Unknown delivery requires a platform-side duplicate check.
- Clearing the batch UI must not delete files already referenced by schedules. After a partial batch acknowledgement, confirmed drafts are removed from the remaining batch.
- Disabling or removing an account while queued/publishing jobs exist is blocked. After those jobs finish or are cancelled, removal revokes stored credentials but retains non-media publication history.
- Failed and overdue jobs remain visible in the admin dashboard; published job receipts remain visible.

## Provider qualification
- Facebook Page: valid permissions and CREATE_CONTENT task, public signed image URL; video upload is considered pending until provider video status is ready.
- Instagram professional account: authorized connected Facebook Page; creation and processing of media container then media_publish, including pictures.
- TikTok: **not eligible for automatic/public posting** until the developer app passes TikTok's required review, the signed source domain is verified, current creator_info is used, and per-post privacy/consent is implemented. Connection status by itself is not evidence of public publishing.
- YouTube: OAuth scopes, correct target channel and resumable-upload status must be verified on a controlled account. Confirm actual public visibility, duration/processing state, quota and file size.
- X and LinkedIn: text-only integration. Media destinations are explicitly rejected rather than silently dropped. X descriptions are limited to 280 characters in the preflight.
- Every provider can still reject posts due to expired tokens, revoked roles, app approval status, permission changes, rate limits, policy, moderation or account restrictions.

## Verification required before owner-approved production deployment
1. Check staging Account 1 cron trigger and Account 2 media connection, including configured secrets, D1 migrations and Cloudflare Access protection.
2. Connect an actual approved Facebook Page through OAuth and verify the Page token has publishing permissions.
3. Upload a harmless authorized test image through the browser; verify it can be retrieved through the temporary signed delivery URL without requiring an interactive login.
4. Queue it for a near-future date/time. Verify it remains stored while queued, cron claims the job, provider returns a durable post ID, and the post is visible on the Page.
5. Verify the temporary file is deleted from Account 2 *after* all selected destinations finish, while the provider receipt and audit trail remain.
6. Run a two-destination test where Facebook succeeds and Instagram fails; ensure media remains available and no duplicate Facebook post is created on retry.
7. Simulate provider timeouts, disconnected accounts, cancelled schedules, queue bursts, Worker restarts and expired signed-media URLs; check dashboard error reporting.
8. Check real mobile/browser UX: scheduling, time-zone display, progress, no accidental batch deletion, and owner confirmation after publication.
9. Inspect API permissions, request logs and secret handling, and confirm provider rate limits/approval conditions.
10. Obtain explicit Account 4 release approval; deployment must never bypass required release gates.

## Outstanding limitations
Automated CI uses mocks for provider responses. It does not prove real Facebook/Instagram/YouTube API eligibility, external post visibility, Cloudflare production cron operation or actual production deletion. No real test post or production deployment was performed during this audit. Some provider-specific long-running video uploads may need a dedicated asynchronous transfer architecture.
