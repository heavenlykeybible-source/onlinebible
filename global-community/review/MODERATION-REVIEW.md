# Contextual moderation and reversible enforcement — review report

## Files changed

- `global-community/src/content-screening.ts`
- `global-community/src/types.ts`
- `global-community/src/index.ts`
- `global-community/src/moderation.ts`
- `global-community/public/app.js`
- `global-community/public/content-screening-ui.js`
- `global-community/public/active-content.css`
- `global-community/package.json`
- `global-community/migrations/0017_contextual_moderation.sql`
- `global-community/test/content-screening.checks.mjs`
- `global-community/review/MODERATION-ACTIVATION.md`
- `global-community/review/MODERATION-REVIEW.md`
- `global-community/public/safety.html`
- `global-community/public/spaces.html`
- `global-community/public/fellowship.html`
- `global-community/public/index.html`
- `global-community/public/prayer.html`
- `global-community/public/profile.html`
- `global-community/public/missions.html`
- `global-community/public/grow.html`
- `global-community/public/groups.html`
- `global-community/public/salvation.html`
- `global-community/public/account.html`
- `global-community/public/messages.html`

The 12 HTML changes only revise existing script/style cache versions.

## What changed

Implemented an opt-in, server-side moderation-only Gemini adapter with structured-response validation, contextual policy, no tool execution, a fixed HTTPS provider host, private header credentials, response timeout and safe hold outcomes for provider errors/refusals/invalid or uncertain output. The adapter explicitly distinguishes testimony, Scripture, negation and questions from promotion; disputed doctrine and uncertain context are held. Local rules now allow narrowly defined condemnation statements such as “Don't practise idol worship” and “Pornography is wrong,” without exempting mixed promotional text. Model semantic accuracy is not established by mocks.

Supported authenticated post/create/edit/comment, member message, profile update, Group/Space create/settings, prayer/circle/testimony and ministry message/post/reply routes require a matching screening decision when enforcement is enabled. Normal member uploads remain disabled. Existing staff advert-image uploads can be screened as inline image input before storage. Linked videos are held because caption screening cannot inspect the actual remote video. No image/video generation or ordinary member upload feature is introduced. Coverage limits are listed in the activation runbook.

The database-backed background queue has stable user/request/policy fingerprints, deduplicated content evidence, field-specific extraction that cannot be padded with unknown form fields, overlength rejection instead of silent truncation, per-member pending limits, tokenized leases, bounded global concurrency, retry backoff and stale-worker recovery. Raw requests are never replayed server-side. An allowed client resubmission re-enters all original validators and authorizations. Existing hourly maintenance is retained as a limited fallback drain; no infrastructure is provisioned.

A separate strike ledger implements warning, 24 hours, 7 days, 30 days and an administrator-review participation hold. No uncertain job earns a strike. Automatic eligible-category confirmation is separately disabled by default; staff-confirmed violations work after schema activation. Automatic confirmation requires explicit configuration and a >=0.99 model score, which is not treated as proof of accuracy or permission for permanent banning. Doctrine, sensitive context, unseen videos and provider failures cannot become automatic strikes. Same-content repeats and retries cannot inflate the count. Timed enforcement is checked on requests and expires automatically; it does not modify account roles/status or release manual locks. Staff accounts are excluded.

Safety & privacy now contains member job status/restrictions and appeal forms, a role-protected staff queue with explained policy/category decisions, and separate-administrator appeal review. Successful appeals reverse the strike and recalculate enforcement. Staff may not review their own submissions; the original reviewer may not decide the appeal. Notices disclose external processing of submitted text/private messages and eligible images when enabled. No public AI assistant or content rewriting was introduced.

## Existing functionality preserved

Original auth/password/social-login code and account data are preserved. Existing cross-origin protections, rate limits, no-store/private API responses, required roles, local moderation, manual account locks, reports, post/Group/Space permissions, profile privacy, message recipient consent/blocks, Design Cards, Christian reactions, comments, feed filters and saved content remain. No Account 4, shared footer, production bindings, credentials, resource IDs, cron settings or security/protected-state baseline changes. The new mode and pipeline flags default off without additional queries/migrations on existing ordinary publication routes.

## Tests performed

Full Community buildcheck passed (28 tests), including TypeScript, frontend syntax, development preflight and all existing suites. New tests use real SQLite migrations and the real Worker routes with mocked provider responses: guests/outsiders cannot read jobs/queues; unscreened submissions never publish; missing configuration fails closed without a strike; human approval permits the original validated route; property-order retries reuse jobs; unknown padding cannot hide evidence; overlong evidence is rejected; duplicate leases call the provider once; uncertain doctrine/low-score/invalid/network responses hold; duplicate strikes are prevented; 24-hour/7-day/30-day/final-review stages work; restrictions expire without an unlock; a manual administrator lock survives expiry; read/appeal paths stay available; different-administrator appeals reverse strikes; self-review fails; exhausted crashed jobs recover; provider concurrency is bounded; SVG image input is rejected.

DOM checks passed for pending submission polling, automatic original-action retry only after approval, hold/block never publishing, member restriction display and appeal submission, and staff controls hidden from ordinary members. Existing chat, Groups and Spaces DOM checks also passed. Final targeted screening and type checks were repeated after concurrency, category-review and queue refinements. Browser, actual provider classification, image semantic accuracy and physical-device/load behavior are not certified.

## What remains unfinished

This is not activated. Required: apply the migration through the owner-approved process, configure an actual supported model and secret, approve provider data handling/costs/privacy notice, run real provider/language/image fixtures and staging tests, choose automatic-strike activation after calibration, load-test queue throughput and determine whether to add a faster dedicated drain schedule, complete rendered UI/mobile checks, and pass integrated CI/protected-state checks. No claim of perfect detection, TikTok parity, fully autonomous doctrine judgments or automatic permanent bans. Initial registration/social-sign-in names, existing images and unseen remote video/audio are not comprehensively screened by this change. Permanent decisions and exceptional doctrine remain administrator responsibilities.

## Database migration required

`0017_contextual_moderation.sql` adds screening jobs, distinct strikes, appeals, decision audit and a notification trigger. No existing posts, accounts, images or messages are reset/deleted. No production SQL was run. Verify the actual migration journal and earlier draft requirements before release.

## Review state

Source draft only. Provider inactive; no credentials, billing service, deployment, merge or production migration was performed. See MODERATION-ACTIVATION.md for concrete activation and rollback requirements.
