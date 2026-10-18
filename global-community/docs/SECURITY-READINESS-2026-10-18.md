# Community security and international readiness

Status: tested source repairs, awaiting production approval and deployment.

## Repairs

- Rate-limit retries retain a fixed expiry rather than extending the waiting period; rate-limit keys hash account identifiers.
- Configuration preflight rejects plaintext session, password-pepper and interservice secrets.
- Space routes resolve encoded Unicode slugs, including Chinese, Arabic and Devanagari, and reject malformed encodings or encoded path separators.
- Registration and login reject overlong email identifiers instead of truncating them into a different identifier.
- Frontend API calls reject broken JSON and invalid response shapes instead of treating them as successful saves. Writes are not automatically retried.
- Text fields detect writing direction; form status updates announce through a polite live region.
- Radio display labels use Heavenly Key branding without changing player behavior or page layout.

## Text-only and navigation follow-up

- Calls are disabled at the API boundary, including old clients with configured relay secrets. Config returns disabled, incoming calls are empty, and call creation/signaling returns 410 to authenticated members.
- Worker and asset Permissions-Policy denies camera and microphone access. The cached calling module is inert.
- Retired the competing chat renderer that queried unsupported endpoints and could overwrite the canonical inbox. app.js remains responsible for text messaging and idempotent retries.
- Post timestamps and share actions use the same distinct post address. Space authors link to their encoded Space slug.
- Selected action links use compact wine/pink button accents, 44px targets, visible focus and reduced-motion support.
- Old ministry worker links on public HTML navigation point to the official ministry website.

## Reliability and audience follow-up

- Unsupported post audiences (including `private`, which the current post schema does not support) are rejected rather than silently published publicly. Supported personal-post audiences remain Public and Global Connections; Group posts require Group context.
- Late chat refresh responses cannot overwrite a more recent response or a different conversation.
- Network/service failures during sign-in verification show a retry message. Database verification outages return a safe 503 rather than a misleading 401.
- Identity changes and expiry clear private drafts, cached message history, retry identifiers and polling. Successful sign-out also cancels pending verification results.
- Profile connect, message-request, block and report actions expose errors in an accessible status message and recover their buttons.

## Administrator follow-up

- Draft advert images now have an administrator-only preview endpoint with `Cache-Control: no-store`. Public access still requires an actively published advert; ordinary members and moderators cannot use the admin endpoint.
- The advert form displays the saved image in its preview, including draft and paused adverts.
- Editorial publication, reply, edit and removal are batched with their audit writes. If the audit write fails, the content change rolls back. Regression tests reproduce the original partial-write failure and verify rollback and successful subject IDs.

## Repository blocker reconciliation

- The owner requested “Resolve all” after the protected-state and migration failures were identified. Source reconciliation keeps the protected-state gate active and saves its previous hashes in `review/security-baselines/pre-reconciliation-2026-10-18.json`; the exact reviewed changes are recorded separately.
- The protected-state gate now verifies 145 files. Tests confirm it rejects changed storage bindings, new SQL and unapproved workflows.
- Both root `0032` migration filenames and their SQL bytes are preserved. Architecture and preflight share a checker that recognizes the exact historical website-inbox supplement by hash and still rejects unknown migrations or changes to that supplement. No database migration was executed.
- Push-triggered production shortcuts and automatic credential regeneration were retired. Direct Control/Router maintenance now requires manual owner confirmation for the exact checked-out commit; canonical Account 1–3 signed Account 4 approvals remain in place.
- Fixed the CMS image-validator syntax error and tested safe/unsafe URLs. Link checking now resolves versioned assets correctly and validates actual Worker endpoints; broken navigation destinations and obsolete fragments were repaired without changing the approved homepage shell.
- Root test discovery now gives Node .mjs suites to Node and Vitest .ts suites to Vitest. Historical layout assertions were updated to the approved shell, whose consistency check still passes.
- Added PNG installation icons rendered from the existing app SVGs; all offline preservation and app tests pass. No device data keys or download caches were reset.
- Updated the platform, community, Media Engine, Control Room and app build tooling. The app now has a reproducible lockfile; audits report zero known dependency vulnerabilities across all five packages, including development tooling.
- Fixed the Account 4 embedded dashboard string and extra script brace; 49 dashboard, login, recovery, approval, upload and integration tests pass, with its six-migration preservation check.
- Local verification: 163 platform tests, 76 Node tests, 38 community tests and 11 policy/regression tests pass. Syntax, TypeScript, preflight, architecture, API contracts and the 19-page link audit pass. GitHub must confirm the new commit independently before promotion.

## Verification

- All 18 public JavaScript files passed syntax checks. The canonical text-only messaging contract and the additional live-chat quality gate passed.
- `npm run buildcheck`: passed, including TypeScript, frontend syntax, configuration preflight and 38 test cases.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities. This is not a full application security assessment.
- API security tests execute the actual Worker routes against an isolated SQLite database with the application migrations and KV test adapter. Privacy defaults, private posts, messages, reporting, independent appeals, account restrictions, CSRF rejection and oversized requests passed.
- Chinese, Arabic and Devanagari Space creation and URL lookup passed; malformed Space links and overlong emails were rejected.
- Live browser smoke check: home feed and Groups loaded, empty states rendered, and navigation worked. No application console errors observed in those views; browser extension metadata errors were excluded.
- Live GET health endpoint returned active service during the preceding check.

## Remaining release checks

- Real Cloudflare D1/KV integration: the separate Wrangler HTTP audit could not start in this execution environment (`uv_interface_addresses` error). The in-process tests do not replace deployed integration tests.
- Authenticated production administrator and member journeys, real Google/Facebook provider credentials and recovery workflows require verification in the target environment.
- Real iOS/Android, keyboard and screen-reader testing, load/concurrency testing, backup restoration and operational monitoring remain unverified.
- Direction detection does not translate the English interface or certify full multilingual/RTL layout support.
- KV counters remain best-effort under concurrency; strict distributed rate limiting is not certified.

No production deployment, moderation-policy removal, database change or layout redesign was performed by this repair.
