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

### 6. Security and resilience gaps to test
- Confirm every private endpoint uses authentication and role checks, including account, Bible personalisation, groups, media, moderation and admin routes.
- Validate JSON bodies, field lengths, malformed input and unexpected storage/database failures consistently.
- Confirm state-changing cookie-authenticated routes have appropriate origin/CSRF protections.
- Ensure session parsing safely handles malformed KV data and that password reset/credential changes revoke all existing sessions.
- Confirm public community content is escaped/rendered safely and moderation/blocking behavior is consistent.
- Review logging and audit records for secrets, tokens, passwords and unnecessary personal data.

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
