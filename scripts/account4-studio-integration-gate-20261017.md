# Account 4 + Studio integration safety gate — 2026-10-17

Status: integration preparation only. **Not merged, deployed, or approved.**

## Verified inputs
- PR #2 contains Account 4 Awaiting Room, CMS editing, identity and migrations 0006–0008.
- PR #6 is stacked on PR #2 and contains managed usernames, one-time owner installation, Studio SSO and migration 0009.
- The source branch of PR #2 has diverged from main (8 ahead, 171 behind at inspection). Do not merge the old tree into main wholesale.
- GitHub Actions run 39000447341 rerun: inventory-and-recovery-points and access-tests both succeeded. Recovery metadata artifact was uploaded. This is not a production authentication test.
- Existing deploy-account4-control-room.yml assumes an old Cloudflare Access redirect. Do not run it against the replacement login without a separate review and a verified transition plan.

## Required integration
1. Cherry-pick or port *only* the relevant Account 4/Studio commits to a current-main integration branch; resolve each conflicting file with the current-main version as baseline. Preserve current homepage, Bible, app, community, radio, PWA and protected access changes.
2. Compare current production Worker version IDs, Account 2/4 bindings, D1 schema and migration state to the private recovery metadata. Do not print tokens, raw bookmarks, password hashes or backups in logs.
3. Reconcile old Cloudflare Access redirects and the replacement owner login without leaving any unauthenticated admin API route. Preserve effective protection until new owner and Studio logins pass real browser tests.
4. Run migration dry-run/review before applying additive 0006–0009 to the verified existing Account 4 D1. Preserve Account 2 D1, R2, KV, schedules and media assets.
5. Preview both accounts; verify one-time owner setup, password reset, owner/admin permissions, Studio SSO and direct Studio login, logout and revocation, CMS preview/approval, Community launch, and protected API denial to unauthenticated visitors.
6. Request explicit owner approval for production promotion. Do not enable auto-merge or deploy this branch as-is.

## Rollback
Record and preserve previous Worker versions and D1 recovery metadata; rollback Workers first. Database restore requires separate owner review of any writes since the recovery bookmark.
