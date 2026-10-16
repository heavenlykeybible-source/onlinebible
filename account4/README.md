# Account 4 Client Accounts integration status

## Separation enforced in this branch
The public website entry point at `src/index.ts` does **not** register Account 4 client management routes. The Account 4-only scaffold is `account4/worker/index.ts`.

## Before deploying
- Obtain the **actual** Account 4 Control Room Worker source, authentication and configuration.
- Replace the scaffold's imported public-site session/role middleware with Account 4's verified Owner authentication. Do not share public-site session secrets with Account 4.
- Create separate Account 4 staging D1 and apply `0001_client_accounts.sql`, then `0002_client_audit.sql`. Neither migration has been run.
- Implement auditable writes, per-client role enforcement, safe credential storage, and client/site ownership checks.
- Mount the HTML dashboard behind verified Owner access, with a suitable Content Security Policy.
- Implement isolated build preview and immutable artifact hash, explicit Owner approval, deploy and rollback. None is enabled in this branch.
- Run unit, integration, migration and staging tests before requesting production approval.

## Current files
- `account4/migrations/`: initial client/site registry and audit schema.
- `src/routes/control-clients.ts`: prototype registry endpoints, currently coupled to the public site's auth middleware.
- `account4/ui/client-accounts.html`: dashboard prototype; not mounted or live.
- `account4/worker/index.ts`: separate routing scaffold; not configured for production.
- `tests/control-clients.test.ts`: test source, not yet executed.

The source repository's default `wrangler.toml` targets the public website. **Do not run its default deploy command to deploy Account 4.** GitHub is optional source storage only, not a required deployment mechanism.
