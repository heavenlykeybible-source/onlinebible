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

## Repository CI status

- At commit `e6aea2a224b5cbcc3283bdc40bd1cb55f0247390`, GitHub's Account 3 community source check passed.
- Full repository CI remains blocked by `scripts/protected-state-gate.mjs`, which detects protected-source/binding/workflow and migration differences from its reviewed baseline. This gate was not removed or rebaselined.
- Shared architecture CI also fails because the root contains 40 migration files ending at 0039, including both `0032_social_provider_apps.sql` and `0032_website_ai_inbox.sql`. The checker expects 39. These shared production migrations were not renamed, deleted or applied; reconcile them against actual deployment history before changing migration identity.
- Green local community tests do not establish that the complete repository or production deployment passes all checks.

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
