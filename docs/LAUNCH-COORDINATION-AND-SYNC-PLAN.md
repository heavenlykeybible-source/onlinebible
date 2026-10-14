# Heavenly Key global basic launch — coordination and synchronization plan
Date: 2026-10-13
Source of truth: release/heavenly-key-release-manifest.json

## Launch principle
Ship a premium-looking, stable **basic** release of each service, with advanced incomplete features clearly disabled or marked coming soon. Never claim unverified external connections, published Bible narration, native app builds, or central control are working. No destructive database changes, account resets or secret copying.

## Central release control
The AOE Meta repository coordinates release manifests, cross-service contracts, QA evidence and deployment checklists. It does not become the authoritative production database or automatically own all six Cloudflare accounts. Account 4 remains the intended operational control room, subject to verified authentication and permissions.

## Approved automatic synchronization
- Account 6 Bible is authoritative for published scripture metadata, chapter availability, approved audio catalogue and publication version. App (5) and Community (3) fetch the same public versioned read-only feed; update their views on refresh or safe cache expiry. Offline content remains available, with user-approved downloads.
- Account 3 Community is authoritative for public feed, group summaries and discipleship catalogue. App (5) consumes a bounded, safe read-only feed and uses authenticated APIs for permitted member actions. Never copy community user records into the app.
- Account 5 app changes to shared public features are described in a reviewed, versioned feature manifest; Community (3) may render compatible capabilities after explicit release approval. Do not remotely replace Community executable code just because App code changed.
- Shared data contracts: version, publishedAt, contentId, contentType, canonicalUrl, locale, status, etag. Cache must use conditional fetch/TTL; never push raw credentials, tokens or private records.
- Avoid two-way write replication and feedback loops. Every domain has one authoritative writer; consumers are read-only or use reviewed APIs.
- Cross-account API access uses HTTPS, scoped credentials and least privilege; no raw shared Cloudflare database IDs, no permissive CORS, no token in public assets.
- User data and database migrations remain independently versioned and are never synchronized by a frontend release.

## Release quality gates
1. Website: responsive home, accessibility, contact/newsletter/partner flows, links, TLS, metadata, error handling.
2. Studio: live/recorded player, media upload/approval, social provider state, fallback, scheduling, recording, no false LIVE state.
3. Community: registration, login/logout, feed, privacy, moderation, messaging, abuse/rate limits, social sign-in only if configured.
4. Control Room: role-scoped dashboard, health visibility, immutable audit, no global superuser shortcuts.
5. App: PWA install, offline reader, community gateway disabled until integration passes, browser/device acceptance, no unpublished audio.
6. Bible: complete approved KJV text, chapter navigation, no login for public reading, honest audio availability, source/provenance notices.

## Current known blockers
- Account 3 wrangler.toml contains D1 and KV placeholders.
- Account 1 staging media engine host contains placeholder.
- App remote builds previously failed; member gateway integration disabled and real-device tests pending.
- Account 6 has no verified published narration catalogue.
- Account 2, Account 4 and Account 6 independent live Cloudflare inventory is not available through the connected GitHub evidence.
- Shared root platform and Account 1 have overlapping code; no automatic blind merge.

## Release sequence and copy policy
1. Preserve original branches and backups. Fix in feature branches with review.
2. Verify each account's actual Cloudflare staging resources and complete tests.
3. Produce one signed-off release manifest with exact commit SHAs, artifact digests, API contract versions, and rollback instructions.
4. Copy approved source into AllDayWow GitHub only after the user requests that step; do not overwrite unrelated work.
5. Later copy that approved release into the newly connected GitHub deployment account. No repository switch or DNS cutover is authorized now.

## Status
Coordination and contract documented; **automatic cross-service synchronization is a target architecture, not an already activated feature**. No production deployment is approved.
