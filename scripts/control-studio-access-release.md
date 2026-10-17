# Owner access repair: Accounts 4 and 2

Prepared code, not a production completion report.

## Resulting access

One central account system, with the owner login `owner` and a separate administrator login `admin`. Both can enter Account 2 Studio from Account 4 without another password. Direct Studio visits use the same central login and return automatically to Studio. Passwords and users are managed through the Control Room interface. The owner remains the ownership authority; the administrator receives full broadcasting permissions without a hidden authentication bypass.

The one-time setup page receives a random, expiring installation token in its URL fragment. Only its SHA-256 hash is configured as a Cloudflare secret. The owner enters two different private passwords in the setup page. Passwords are hashed, never included in GitHub source or reports. Installation cannot be replayed.

## Resources and release scope

Preserve Account 4 database `heavenlykey-control-room-db`, Account 2 database `heavenlykey-media-db`, media R2 objects, schedules, existing records and KV. No Worker/database/object deletion is included. Existing service-to-service capability protection stays in place; the Studio session adapter creates those credentials on the server. It does not send them to frontend JavaScript.

The inspected media-engine source redirects its root to the main website admin page. A fresh live check instead finds studio.heavenlykey.org rendering the ministry administration screen at /pages/admin; the custom-domain route and actual deployed source still require Account 2 API verification. The adapter makes Account 2 its own authenticated Studio entry and exposes existing media-engine operations behind the signed-in session. The server's scheduled handler is preserved.

This Studio shell covers library upload/preview, playlist publication/switches, scheduled playout, direct stream sessions and service checks. Existing advanced camera composition/social-streaming interfaces still require integration and browser testing; do not report the entire professional Studio feature set as complete.

The branch is based on `fix/account4-awaiting-room-20261016`, which supplies prerequisite central identity APIs. These changes must not be installed as standalone assets against the older main backend.

## Pre-release work

1. Run the read-only inventory workflow. Use Cloudflare API results to resolve conflicting UI observations. Capture current Worker deployment IDs and D1 recovery bookmarks. A bookmark is a recovery point, not an independent off-site backup.
2. Compare Account 2's bound D1/KV identities against source config and protected-state policy. Previous inspection found different IDs; do not overwrite bindings or bypass a failed policy check.
3. Review prerequisite migrations and apply only to the verified existing Account 4 D1. Migration 0009 adds usernames and one-time installation metadata; it does not remove records.
4. Configure `OWNER_INSTALL_TOKEN_HASH`, `OWNER_INSTALL_EXPIRES` (Unix seconds), and `OWNER_EMAIL` in Account 4; installation must be limited to a short window. Keep the raw random token private and out of logs.
5. Deploy to an isolated preview, test the two accounts and SSO end to end, then promote under the owner's release instruction. Verify direct Studio entry, Control Room entry, logout/revocation, uploads and schedules.
6. Only after both logins work should redundant Cloudflare Access gates or old login entry points be retired. No removal of effective authentication is required.

Rollback: restore the previous Account 2/4 Worker versions. Retain additive tables and user data. Use the verified D1 recovery bookmark only if a database rollback is needed, with owner review of changes since the bookmark. No production rollback or deletion was performed while preparing this branch.

Local tests: 18 tests passed covering identity roles, password reset/revocation, one-time setup, usernames, shared sign-on, direct Studio entry, CSRF, replay rejection and backend capability isolation. Production credential creation and real browser tests remain pending.

## Verified inspection checkpoint (17 October 2026, 03:52 UTC)

GitHub run 39000447341 confirmed the Account 4 D1 ID and R2 bucket, and recorded its recovery bookmark in the private `control-studio-recovery-metadata` artifact. The managed identity tables are not yet installed. Current Worker version IDs: control-room `28a8ae0e-96e2-4b9d-98b0-33f8e3b431a4`; CMS public `ff354579-39fc-4bf2-a839-c2a2a17dfe98`. Read the artifact for the owner-dashboard version and bookmark. Account 2's API token was unavailable at repository scope; the follow-up check uses the same `media-engine-production` environment as its existing deployment workflow. Unit tests and Account 2 TypeScript checks passed in GitHub Actions. No production changes were made.

## Follow-up verification

The read-only check also confirmed that `ACCOUNT_2_TOKEN` is missing in the existing `media-engine-production` environment. No Account 2 API backup or deployment was attempted without that credential. The authenticated dashboard observations are not sufficient to resolve the binding mismatch.

All Account 4 routes now pass through the Worker so `/security`, `/setup`, and root authentication cannot be swallowed by static asset routing. Studio preserves the initiating Control Room origin for sign-on, defaults direct visits to the owner dashboard, and normalizes workers.dev entry before setting host cookies. A repair restores only the configured known owner and revokes their previous sessions and proofs.

Existing DOM checks lacked their jsdom dependency; their workflows now install a pinned test-only version without changing production packages. The verified Access test explicitly configures its fixture owner email to test the new owner allowlist.

## Final source-check checkpoint

Commit `83ed619f7edf862f716c24678562186856b12daf`: owner/Studio unit tests and media-engine typecheck passed (run 39000727267, access-tests job); full protected-access/recovery/bundling/permanence checks passed (39000726593); Account 4 typecheck, awaiting-room, portal, DOM, Bible and app preservation workflow passed (39000726574). The read-only inventory job still fails specifically because Account 2 has no configured deployment token. This is an unresolved deployment prerequisite, not a passed production test.

Fresh read-only public entry checks found Control Room content at control.heavenlykey.org and the owner-dashboard workers.dev address, and the older ministry administrator screen at studio.heavenlykey.org/pages/admin. Public page visibility alone does not verify login, permissions, or playable radio. No owner/admin passwords have been installed in production, and email recovery delivery has not been configured or verified.

Next handoff: connect an Account 2-scoped Cloudflare API credential as the private GitHub Actions secret ACCOUNT_2_TOKEN (repository or media-engine-production environment). Never paste the token into chat or commit it. Re-run inventory, preserve actual bindings and recovery points, stage the matching backend, and privately complete the one-time password setup. Do not retire old login gates until the replacement is verified in a real browser.
