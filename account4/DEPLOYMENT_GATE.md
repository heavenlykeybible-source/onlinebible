# Account 4 staging deployment gate

**NOT DEPLOYABLE YET.** This repository contains an isolated Account 4 prototype, not the verified source of the currently deployed `heavenlykey-control-room` Worker. Never overwrite that Worker with this scaffold.

## Mandatory gates before a staging release
1. Obtain the actual Account 4 Worker source and compare current routes, bindings, and auth. Back up existing Worker and D1 first.
2. Remove the import from `../../src/routes/control-clients` in `account4/worker/index.ts`; that route uses public-site auth and is not appropriate for Account 4.
3. Integrate `createReleaseRouter` with the **verified Account 4 Owner session**. Reject unauthenticated requests. Do not invent an Owner account or hard-code passwords.
4. Provision a separate staging D1 binding and apply migrations 0001–0004 in order.
5. Run `python3 account4/tests/test_migrations.py` and `npm test`, then staging HTTP security and end-to-end tests.
6. Implement actual Owner-managed users, password reset, Studio SSO, isolated preview, deploy and rollback with audit logging.
7. Verify domain bindings and storage credentials without exposing secrets. Obtain explicit Owner approval of exact website output before production deployment.

## Existing code
- `worker/release-router.ts`: injectable Owner-only approval router; not mounted on production.
- `worker/release-approval.ts`: compare-and-swap approval guarded by database trigger.
- `migrations/0003_release_approval_trigger.sql`: transactional audit.
- `migrations/0004_release_integrity_guard.sql`: allowed transitions and immutable approval metadata.

**Do not use the repository's default `npm run deploy` for Account 4.** It targets the public website.
