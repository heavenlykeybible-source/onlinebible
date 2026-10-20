# Restricted Account 4 AI Connector — owner review candidate

This connector is **implemented as a candidate module, not activated**. It never performs deployments, reads secrets, grants admin sessions, approves changes, or edits Account 4. The existing protected deployment controls stay unchanged.

## Integration gates (owner/operator only)
1. Review security and test isolation; deploy staging first.
2. Run `account4-control-room/migrations/0006_connector_proposals.sql` on Account 4 D1 only after backup and review.
3. Generate a high-entropy random agent token in a trusted environment. Store only its SHA-256 hex digest as `CONNECTOR_TOKENS_SHA256` via Cloudflare Worker secret. Give the token to the authorized integration through its secure credential manager, **never in chat, frontend, repository, logs, or D1**.
4. Mount `handleAgentConnector` for `/api/connector/v1/*` only after validating the Cloudflare Access administrator policy for this hostname, and retaining same-origin browser security rules for owner actions.
5. Add token rotation/revocation, scoped identity and rate limiting before production. Current single role is intentionally narrow. Do not enable production based only on this candidate.
6. Test malformed requests, cross-account attempts, protected paths, token rejection, D1 audit failures, no CORS, and recovery.
7. Review and approve the exact commit SHA through the Account 4 maintenance procedure. Never auto-merge to main.

## Candidate API
- `GET /api/connector/v1/capabilities` — list permitted non-privileged actions.
- `POST /api/connector/v1/proposals` — queue an immutable Git SHA and source paths for Accounts 1–3 and 5–6.
- `GET /api/connector/v1/proposals?site=account3` — latest proposals.

Example proposal shape:

```json
{"site":"account3","revision":"0123456789012345678901234567890123456789","summary":"Community messaging changes for owner review","changedPaths":["community/src/messages.ts"]}
```

No endpoint can deploy. Production execution must be added in a separately owner-reviewed release with account ID verification, staging gates, immutable revision approval, least-privilege Cloudflare credentials, audit records, and rollback verification.


## Multi-connection directory implementation (candidate)
- `src/connection-directory.ts`: administrator-authenticated read-only list and routing-plan routes.
- `connector/multi-connection-registry.ts`: validates owner-verified Cloudflare, GitHub and website-API identities.
- `account4-control-room/migrations/0005_provider_connections.sql`: metadata-only registry. No keys or tokens are stored in this table.
- `public/index.html` and `public/app.js`: connection-pathway selector and plan-check UI.
- `src/index.ts`: mounts directory routes **after** Control Room owner authentication.
- No provider accounts are auto-provisioned; disabled/unverified connections cannot be selected.
- Account 4 remains excluded from agent-targeted sites. Production deploy remains disabled.
- Before merging: migrate staging, run TypeScript check and auth/security tests, provision verified account identities through owner-only workflow, set scoped credentials and activate only after owner-authorized maintenance review.


## Audit findings — 2026-10-20
- Added the actual numbered Wrangler migrations to `account4-control-room/migrations/`; previous connector-local SQL files alone were invisible to the default migration command.
- The Control Room now returns a non-sensitive 503 if the connection registry has not been provisioned, rather than leaking raw SQL exceptions.
- Added focused routing security regression tests under `test/connections.mjs` (not yet executed against a full installed repository environment).
- **Release blocker:** production operations remain planning-only. Live website edits, real provider API calls, image previews, owner connection registration, per-token authorization and production execution are not yet implemented.
- **Account 4 core-lock policy:** merge and deployment require an intentional protected maintenance review with staging verification. No automated PR merging or GitHub Actions needed.
