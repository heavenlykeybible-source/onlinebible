# Corrected ACTIVE / Community UI draft — 19 October 2026

Status: draft only. Nothing merged, deployed, migrated or provisioned. Based on Community working commit 377f2f2cee5267e109ba59bb271650269412661e. No Account 4, footer-system, workflow, security-baseline or unrelated website changes.

## Files changed

- `global-community/migrations/0016_active_content.sql`
- `global-community/package.json`
- `global-community/public/account.html`
- `global-community/public/active-content.css`
- `global-community/public/active-strip.js`
- `global-community/public/app.js`
- `global-community/public/community-dashboard-reference.js`
- `global-community/public/fellowship.html`
- `global-community/public/groups.html`
- `global-community/public/grow.html`
- `global-community/public/index.html`
- `global-community/public/messages.html`
- `global-community/public/missions.html`
- `global-community/public/prayer.html`
- `global-community/public/profile.html`
- `global-community/public/safety.html`
- `global-community/public/salvation.html`
- `global-community/public/spaces.html`
- `global-community/src/active.ts`
- `global-community/src/index.ts`
- `global-community/test/active-content.checks.mjs`
- `global-community/test/frontend-feed.checks.mjs`
- `global-community/public/assets/global-christian-community-approved-banner.jpeg` (original owner upload, unchanged bytes)
- `global-community/review/ACTIVE-CONTENT-REVIEW.md` (this report)

## What changed

ACTIVE now means posted status content rather than people/presence. Each item renders the actual post through the original Design Card renderer; clicking loads an authenticated, currently authorized full post. It shows separate entries even when one author posts multiple statuses. The slow rail pauses on hover/focus/touch, includes a pause control, and respects reduced motion. Signing out destroys the rail and open status viewer; late requests cannot restore another session's content.

Automatic ACTIVE is a server-side account preference, defaults off, applies only to future eligible personal Design Cards/articles, and never backfills older posts. Per-post Add to ACTIVE and owner-only Remove from ACTIVE are available. Group, Space, linked-video, held and warned posts are excluded. This draft uses a 24-hour status lifetime; owner review should confirm that duration. Disabling automatic ACTIVE removes automatic entries while preserving original posts and manually published statuses.

Signed-out visitors see the original uploaded banner at its natural aspect ratio, CREATE ACCOUNT and SIGN IN, and public content. Authenticated actions remain protected server-side and the composer/reactions/comment/report controls invite sign-in. Signed-in members do not see the visitor banner. Member identity uses the existing profile-photo field. Mobile navigation collapses extra links and app promotions into a More & Heavenly Key Apps disclosure instead of squeezing three columns together.

The existing desktop reference layout is retained. The left app section follows principal Community navigation; GRDPC remains compact. The right column separates connections from Online Now. There are no invented member identities, online states, viewer counts, events or live indicators.

## Existing functionality preserved

Design Card colours, patterns, templates, categories, scripture, formats and engine remain unchanged in this commit. Existing full post rendering, comments, Christian reactions, sharing, saved posts, reporting, Groups/Spaces, messages, Global Connections, privacy, moderation, authentication, profile data and account functions remain in place. The new ACTIVE API calls the existing feed authorization logic for every returned post. Footer implementations, production bindings, credentials, security baselines, Control Room and Community AI-disabled state are unchanged.

## What remains unfinished

- Browser-based visual verification on desktop and physical phones, including exact reference spacing and overflow checks. DOM checks are not a substitute for this.
- Online Now cannot show real presence yet: the inspected draft has no working presence endpoint. The panel says so, and connections are listed separately without claiming they are online.
- Upcoming events and live-state indicators require actual supported data; this draft does not fabricate them.
- Full-repository CI and Protected-State Gate must run against the integrated release candidate before any future deployment. Their baselines have not been edited or bypassed.
- Existing migration numbering includes two 0011 files. Deployment must verify the actual migration journal; this draft neither renames old migrations nor applies production SQL.
- Nothing in this review claims production activation or a completed browser visual match.

## Tests performed

- `npm run buildcheck` in global-community: PASS, including TypeScript, frontend syntax, Design Card/feed/Group/registration/stewardship/social-advert suites, development preflight and the added ACTIVE suite (26 tests total).
- New ACTIVE tests use the real Worker routes, real SQLite schema/migrations and existing feed service. Authentication, guest write denial, opt-in/no backfill, connection direction, reciprocal author privacy, blocks in either direction, expiry, held posts, restricted authors, owner-only publication/removal, disabling auto-add without deleting original posts, group/video/moderation exclusion, revoked connections, cross-origin denial, and no-store headers passed.
- DOM tests: real content rather than avatar tiles; multiple statuses per author; reduced motion; content viewer; server-side preference request; logout cleanup; stale-response suppression passed.
- Original approved banner remains byte-identical to the supplied JPEG. No image generation or editing was used.

## Database migration required

`global-community/migrations/0016_active_content.sql` creates active_entries plus its expiry index and opt-in INSERT trigger. It requires the earlier draft `0011_active_status.sql` profile preference column. No user data is reset, no original posts are deleted, and no migration was applied outside isolated test databases.
