# Global Christian Community — Feature, UX, and Security Audit

**Scope:** Gated development branch only. This audit does not inspect the live website and does not assess deployment-provider readiness.

**Branch:** `audit/global-community-launch-readiness-20261020`  
**Status:** In progress — NOT launch-cleared.

## Confirmed strengths from source review

- Registration and login endpoints exist.
- Passwords are hashed with PBKDF2-SHA-256 and a per-user salt, with a server-side pepper.
- Login and registration have IP-based rate limits.
- Sessions use random opaque identifiers stored in KV; logout deletes the session.
- Session cookies are marked HttpOnly, Secure, and SameSite=Lax.
- Password change requires the current password and invalidates other sessions.
- Several API responses apply security headers.
- Community API modules cover prayer requests, testimonies, questions/answers, discussions, comments, reactions, follows and blocks.
- Bible endpoints cover chapters, bookmarks, highlights, notes, audio Bible, hymns and devotionals.

## Confirmed launch blockers / required fixes

### 1. No wired password-reset flow
The registered auth routes in `src/index.ts` include register, login, logout, profile and change-password, but no forgot-password or reset-password route. Although the auth service references reset-token columns during password changes, that is not a working recovery flow. Members must be able to request a time-limited, single-use reset link without exposing whether an email exists. A real transactional email provider/configuration is needed to deliver that link; do not simulate successful delivery.

### 2. Email verification is not implemented
Registration writes `email_verified = 0`, and the service comments that email-verification dispatch is a separate, unresolved implementation decision. Define the verification experience, token expiry, resend throttling, and which actions require a verified address before launch.

### 3. Registration is not atomic
The service inserts the user row and then inserts the auth row in a separate operation. If the second operation fails, a partial account can remain. Use a D1 batch/transactional approach and handle duplicate-email races safely.

### 4. Registration feedback can disclose account existence
The registration handler returns a distinct “This email is already registered” result. Consider a privacy-conscious, consistent public response where appropriate, with server-side diagnostics that do not expose personal information.

### 5. CORS / origin contract needs reconciliation
The auth response helper sets `Access-Control-Allow-Origin: https://www.heavenlykey.org`, while site metadata identifies `https://heavenlykey.org/` as canonical and the API client calls a separate Workers hostname. Verify the intended browser origins and credentials/cookie behavior together. Do not use wildcard CORS with credentialed sessions.

### 6. Fixes committed during this audit

- Registration now validates trimmed name/country values, caps email/password lengths, and avoids returning an explicit “email already registered” message. A duplicate-email race is handled with a generic account-creation response.
- Profile and credential creation are performed in one D1 batch to avoid creating a profile without matching credentials.
- The Worker now uses an explicit allowlist for browser request origins and no longer rejects every cross-origin state-changing request merely because the API is hosted on a different origin. OPTIONS preflight advertises credential support only for allowlisted origins.
- These are source changes, not proof of a complete browser CORS/session flow. Response CORS headers are still inconsistent across route handlers, and the authentication helper currently emits one fixed origin. End-to-end credentialed browser testing remains required before this can be called resolved.

### 6. Security and resilience gaps to test
- Confirm every private endpoint uses authentication and role checks, including account, Bible personalisation, groups, media, moderation and admin routes.
- Validate JSON bodies, field lengths, malformed input and unexpected storage/database failures consistently.
- Confirm state-changing cookie-authenticated routes have appropriate origin/CSRF protections.
- Ensure session parsing safely handles malformed KV data and that password reset/credential changes revoke all existing sessions.
- Confirm public community content is escaped/rendered safely and moderation/blocking behavior is consistent.
- Review logging and audit records for secrets, tokens, passwords and unnecessary personal data.

## Functional test pass — 2026-10-20

### Results from source and CI inspection

- **Full test suite: NOT RUN in this session.** The execution environment cannot resolve GitHub to clone the repository, and dependencies/runtime are not available here. Do not treat this as a pass.
- **Current audit-branch CI: no run/status found** for the current branch head at the time of inspection.
- **Existing branch workflow run:** the latest visible Six-Service Read-Only Audit run (run 39409250214, commit 367573566c7a361ef6b5c9003851f0ec5c5dd93b) concluded **failure** in three jobs: shared platform contract/architecture checks, six-service release manifest consistency, and Account 3 community source checks. This run predates the newest audit commits, so it is evidence of unresolved prior CI failures, not a test result for the current head.
- **Confirmed likely test failure by repository tree inspection:** `test/unit/frontend-contract.test.ts` reads `heavenly-key-website/pages/community.html`, but that file is absent from the current branch tree. The test suite is expected to fail on this missing file unless the test or page is restored.
- **Password reset: NOT FUNCTIONALLY CONNECTED.** Service functions have been added, but `src/routes/auth.ts` still has no password-reset handlers and `src/index.ts` has no reset endpoints. The reset service must not be advertised as working until route wiring, UI pages, configuration and tests are complete.
- **CORS/session browser flow: NOT VERIFIED.** The main Worker has an origin allowlist, but `src/routes/auth.ts` still sets a fixed `Access-Control-Allow-Origin: https://www.heavenlykey.org` response header. This can break credentialed responses from other allowlisted origins. Resolve this mismatch and test preflight, login, profile and logout from every intended frontend origin.
- **Runtime, D1/KV integration, email delivery, browser/mobile end-to-end and security penetration tests: NOT RUN.** No live account creation, password reset email, database mutation or production data was exercised.

### Immediate blockers before a pass can be claimed

1. **Community page contract:** source-level fix committed — added `heavenly-key-website/pages/community.html` with discussion, prayer, testimony and group feeds, API error states, and community navigation. It has not yet been executed in a browser.
2. **Password recovery wiring:** source-level fix committed — added request/complete handlers at `/api/auth/password-reset/request` and `/api/auth/password-reset/complete`, exact-origin CORS on auth responses, rate limiting, a reset UI, and member login/register pages. Automated token lifecycle, email-delivery and session-invalidation tests are still required.
3. **CORS:** auth responses now echo only an exact trusted origin and enable credentials for that origin. **This is only a partial fix:** legacy community/group and other route helpers still call the shared security-header helper without passing the request origin, so cross-origin behavior from the apex domain and subdomains still needs a consistent end-to-end fix.
4. Run `npm ci`, `npm test`, `npm run check:api-contract`, `npm run check:architecture`, `npm run check:frontend`, `npm run check:links`, and `npx tsc --noEmit --pretty false` in CI; then run relevant Global Community and browser tests.
5. Fix all failed checks and rerun from the final audit-branch commit. Do not deploy as part of this step.

## Required member experience

- Clear register / sign-in / sign-out pages and helpful validation errors.
- Password visibility toggle, password confirmation and accessible form labels.
- Forgot-password and reset-password flow with neutral responses, expiring one-time tokens, rate limiting and email delivery.
- Email verification and resend flow.
- Profile view/edit, password change, account status messaging and session expiry handling.
- Mobile-friendly forms, keyboard accessibility, loading states, retry feedback and no silent failures.
- Useful empty states and error recovery for Bible reading, bookmarks, highlights, notes, groups and community interactions.

## Verification gate

Before marking launch-ready, run and record:
1. Frontend JavaScript syntax and HTML/link checks.
2. API route/contract and architecture checks.
3. Unit tests for registration, duplicate-email races, login, rate limits, session expiry/revocation, role boundaries, password change and reset tokens.
4. Browser-based end-to-end tests on desktop and mobile viewport sizes.
5. Security tests for unauthenticated access, privilege escalation, CSRF/origin handling, injection/XSS, rate limiting and account enumeration.
6. A final review of every failed test and regression.

**Important:** This report records source-review findings. No automated suite or browser end-to-end test is claimed to have passed here. Deployment configuration is intentionally outside this audit.


## Follow-up source changes — 2026-10-20

- Added the missing public community page expected by the frontend contract test.
- Added member sign-in and registration pages with client-side validation, loading/error feedback, and API requests.
- Added a reset-password page supporting both email request and token-based completion.
- Wired password recovery handlers into the Worker router. Public reset-request responses are neutral for existing and unknown accounts; requests and completions are rate-limited.
- Made auth route responses origin-aware for the explicit trusted-origin allowlist. The shared legacy response helpers used by other route modules are not yet fully origin-aware.
- Extended the frontend contract test to require the login, registration, and reset pages and their expected API endpoints.
- Added unit-test cases for missing email configuration, malformed reset tokens and password-policy rejection.
- Hardened recovery email failure handling so both provider HTTP failures and network exceptions clear the stored one-time token.
- Updated the API contract checker to recognize the exact-origin CORS allowlist rather than requiring a single hard-coded response origin.

**Verification status remains unchanged:** these changes were committed to the audit branch but the Vitest suite, TypeScript compiler, API contract checks, frontend syntax/link checks, email delivery, and browser/device flows have not been executed in this environment. Do not treat source changes as a passing test run.
