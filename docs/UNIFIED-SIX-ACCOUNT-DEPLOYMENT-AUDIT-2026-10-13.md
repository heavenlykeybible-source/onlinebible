# Heavenly Key — Unified Six-Account Deployment Audit
Date: 2026-10-13
Status: PRE-DEPLOYMENT / NOT APPROVED FOR PRODUCTION
Scope: Consolidated planning and evidence, not migration of live Cloudflare resources.

## Authoritative service map
1. Main Website — Cloudflare Account 1 — GitHub source: alldaywow247-ops/heavenlykey
2. Studio / Radio / TV / Media — Cloudflare Account 2 — linked media-engine endpoints; independent source and live resources not yet verified
3. Global Christian Community — Cloudflare Account 3 — GitHub source: aoemeta247-cell/All-Nations-For-Christ-Outreach/global-community
4. Main Control Room — Cloudflare Account 4 — centralized orchestration intended; independent implementation, permissions and deployment not yet verified
5. Mobile App — Cloudflare Account 5 — GitHub source: aoemeta247-cell/heavenly-key-mobile-app
6. Heavenly Key Bible — Cloudflare Account 6 — standalone deployment not verified; Bible text and player also present in app and shared platform

## Central AOE Meta preparation workspace
This file is the central audit index in aoemeta247-cell/All-Nations-For-Christ-Outreach. The account remains the planning and integration workspace. Do not assume GitHub ownership changes Cloudflare deployment account ownership. Do not copy credentials, move databases, switch DNS, overwrite projects, or deploy without separately verified configuration and backups.

## Verified from GitHub repository inspection
- Account 1: README, package.json, wrangler.toml inspected. Website static assets + Worker API, D1/KV/R2, staging configuration. Staging MEDIA_ENGINE_URL is a placeholder.
- Account 3: global-community/package.json, wrangler.toml, src/index.ts inspected. Includes account registration, social auth, feed, profiles, global connections, spaces, groups, messaging, calls, prayer circles, growth, discipleship, moderation, ads, notifications, AI writing. D1 and KV identifiers are placeholders; source comments explicitly prohibit deployment with this config.
- Account 5: package.json, docs/UNIFIED-APP-INTEGRATION.md, docs/APP-PLATFORM-AND-AUDIO-AUDIT.md inspected. PWA app with complete KJV text, offline reader, reading programme, audio UI; member integration flags disabled, remote build failures and physical-device tests pending. Audio catalogue contains zero approved narrated chapters.
- Shared platform: root src/index.ts, README, wrangler.toml inspected. Community, evangelism, ministry management, WhatsApp/social management, media, broadcast, playout, CMS, GRDPC, scheduled jobs. Existence of routes does not prove external services operate.

## Critical gates
1. Inventory each Cloudflare account's actual Workers, routes, domains, D1, KV, R2, secrets and permissions.
2. Resolve Account 3 resource placeholders using correct Account 3 resource identifiers; preserve separation.
3. Verify Account 2's media engine and live social providers; test failover, recording, publishing.
4. Verify Account 4 central control, scoped roles, service-to-service authentication and audit trails.
5. Resolve Account 5 remote builds, integrate Account 3 identity safely, test Android/iOS and offline behavior.
6. Verify Account 6 separate Bible Worker/domain, KJV provenance, public reading and audio approval; do not claim narration complete.
7. Reconcile duplicate/shared code between Account 1 and AOE root platform; select canonical source of truth before merges.
8. Run migrations against isolated staging data, automated tests, security review, integration tests, backups and rollback rehearsal.
9. Confirm DNS, TLS, CORS, cookie boundaries, abuse controls, monitoring, and accessibility.
10. Require documented owner approval before production cutover.

## Integration principles
- Single central audit and release manifest; six logical services with distinct environments and resources.
- Keep Account 3 authoritative for community identity; no duplicated production member database in Account 5.
- Cross-account Workers cannot use same-account Service Bindings directly. Use authenticated HTTPS APIs or consolidate Workers to a single Cloudflare account only through a separately approved migration.
- Maintain versioned API contracts, per-account secrets, staging/prod isolation, and migration-ready configuration.
- Never treat local tests or source-code routes as proof of live readiness.

## Audit limits
Only three relevant GitHub repositories were visible across the connected GitHub identities. This audit does not certify unseen Cloudflare resources, successful builds, production availability or the entirety of files in all projects. No live deployment or migration has been performed.
