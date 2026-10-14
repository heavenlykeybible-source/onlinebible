# Heavenly Key sign-in and account security review — 10 October 2026

## Scope and evidence
Code review of Account 1 ministry website login, Global Community login and OAuth onboarding, Account 4 protected-state release gate, current Cloudflare Worker/D1/KV route behavior, and mobile browser forms. GitHub CI is an automated code check, not a real sign-in test on connected production accounts.

## Separate account systems — critical UX distinction
- Ministry website (Account 1): its own user/auth D1 and revocable SESSIONS_KV cookie `hk_session`, 1-hour session, password minimum 8 and digit, admin role gating.
- Global Community (Account 3): distinct user/profile D1 and `gc_session`, 30-day cookie, 6–128-character mixed-case password policy, Google/Facebook OAuth options if provider credentials enabled.
- Account 4 recovery/release is a separate owner-only security domain. Do not silently merge identities, sessions, owner recovery secrets or account resources.

## Confirmed working safeguards in code
- Strong random session IDs, HTTPS HttpOnly SameSite=Lax cookies and logout revocation.
- Per-route role checks, user status checks, password-derived salted hashes and rate limiting. Administrator accounts still need stronger attack resistance.
- Community social login uses OAuth state and PKCE (Google), issuer/audience/nonce checks, and explicit account linking; do not auto-link by email.
- Session values are read from KV server-side, not accepted solely from a client-signed JSON token.

## Findings and priorities
1. **High — website registration not atomic in main**: existing implementation creates user then password credential separately; a failure can leave an account that cannot sign in. Proposed D1 batch/rollback fix is in PR #46; protected state gate correctly blocks it pending owner-only security review and a backup.
2. **High — administrator second factor not established**: no complete mandatory owner/admin TOTP, passkey or managed Cloudflare Access policy verified. This requires an owner-approved security configuration plan and real controlled-device recovery tests.
3. **High — email verification / account recovery incomplete**: website sets `email_verified=0` while allowing login; publicly verified recovery/transactional email workflow is not established. Do not enable verification enforcement without first configuring reliable delivery and grandfathering existing accounts.
4. **Moderate — independent sign-ins**: Global Community and ministry website do not share credentials. UI-only PR #47 clarifies the distinction and defaults returning Global Community visitors to the Sign in tab.
5. **Moderate — inconsistent session durations**: website 1 hour, community 30 days. Test on shared phones and explain log-out controls; do not lengthen admin sessions without stronger MFA.
6. **Moderate — KV rate counters are non-atomic**: concurrent invalid login attempts may bypass intended per-window counts. Both systems use Cloudflare KV-based read-then-write increments. High-assurance administrator rate limiting should be reinforced with Cloudflare WAF/Turnstile or another atomic control following owner review.
7. **Moderate — client UX**: ministry login lacked password reveal and cleared/handled invalid credentials poorly on phones. PR #47 adds explicit accessible show/hide, keeps email for retry, resets rejected password, and labels the correct login destination.
8. **Moderate — auth input bounds & corrupt session handling**: proposed protected-service fix in PR #46 caps oversized credentials, validates session IDs and rejects malformed KV data instead of throwing.
9. **Compatibility**: preserve current password hashes, existing account records, sessions, original roles and Account 4 recovery controls. Any future password policy upgrade should allow existing users to log in before an explicit password change.

## Release sequence
- **PR #47**: run CI plus staging mobile/desktop sign-in, register, failed-login, show/hide and logout tests; safe UI only.
- **PR #46**: remain draft and blocked. Use designated Account 4 owner-only security change process, review patch, snapshot D1/KV and test D1 batch rollback and current-account logins before authorized manual deployment.
- After this, conduct real browser tests of MFA/recovery and administrator permissions. Never request production passwords in chat or write them to GitHub.

## Not verified here
No real end-user passwords were submitted, no production session was rotated, no private account/login audit logs were read, no production database was modified, and no active devices were signed out.
