# Six-service live smoke test — 13 October 2026

Scope: Read-only public HTTP/browser extraction and source inspection. No authentication, no mutation, no automated test suites executed. Results are not a production launch certification.

| Account | Target | Result | Interpretation |
|---|---|---|---|
| 1 Website | https://www.heavenlykey.org/ | Page loaded; existing ministry content rendered | Public homepage reachable; not proof the latest Worker is mapped to this domain |
| 1 Website API | https://heavenlykey.alldaywow247.workers.dev/api/site-content/homepage | JSON `success:true`, structured homepage fields | Public content endpoint works |
| 1 Website API | https://heavenlykey.alldaywow247.workers.dev/api/events | JSON `success:true, items:[]` | Endpoint works; no events returned |
| 2 Studio | https://heavenlykey-media.omegawealthcreator.workers.dev/ | Redirected to Account 1 admin studio page | Endpoint responds, media stream/recording not verified |
| 3 Community | https://global.heavenlykey.org/ | URL fetch service returned `invalid_url` | Inconclusive; does not establish domain failure or successful deployment |
| 4 Control | https://heavenlykey.alldaywow247.workers.dev/pages/admin | Admin page loaded and sign-in UI present | Page reachable; authentication, Account 4 authority and controls unverified |
| 5 App | https://heavenly-key-app.workers.dev/api/health | URL fetch service returned `invalid_url` | Unverified host; not evidence that app is offline |
| 6 Bible | https://heavenlykey.alldaywow247.workers.dev/pages/bible.html | HTTP 404 | This *guessed path* does not exist; does not establish separate Bible project failure |

## Source checks
- App `src/site-sync.js`: real public homepage/events gateway, enabled by `SITE_PUBLIC_SYNC_ENABLED=true`.
- App `src/index.js` and `src/member-gateway.js`: Community public gateway and member gateway implemented; `COMMUNITY_PUBLIC_READS_ENABLED=false` and `COMMUNITY_MEMBER_ACCESS_ENABLED=false` in Account 5 config.
- Account 3 `global-community/wrangler.toml`: resource identifier placeholders still present in GitHub default branch.
- Main AOE root `src/index.ts`: actual routes for Bible, community, admin, media, broadcast, WhatsApp, social publishing, CMS, system updates and scheduled jobs.
- App docs indicate 66 books/1,189 chapters KJV text but zero approved published audio chapters.

## Next tests required
- Obtain canonical deployed URL for each of Accounts 2–6 and verify Cloudflare deployments directly.
- Execute `npm test`, `npm run build` or documented equivalent on each repository/subproject in an authorized runner. The current connected GitHub API does not expose a general workflow dispatch action.
- Verify identity/session, browser CORS, radio/TV player, community feed and moderation, app offline, Bible reader and content propagation using staging fixtures, not real member accounts.
- Validate account-specific D1/KV/R2 bindings, secret presence (never values), backup/rollback, and production deployment gates.

Status: PARTIAL TESTING COMPLETE; FULL SIX-ACCOUNT FUNCTIONAL TESTING NOT COMPLETE.
