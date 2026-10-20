# Restricted Account 4 AI Connector — owner review candidate

This connector is **implemented as a candidate module, not activated**. It never performs deployments, reads secrets, grants admin sessions, approves changes, or edits Account 4. The existing protected deployment controls stay unchanged.

## Integration gates (owner/operator only)
1. Review security and test isolation; deploy staging first.
2. Run `account4-control-room/migrations/0006_connector_proposals.sql` on Account 4 D1 only after backup and review.
3. Generate a high-entropy agent token in a trusted owner environment. Store **only its SHA-256 digest** in `cms_agent_credentials.token_hash` with a distinct `agent_id`, an explicit `allowed_sites` JSON array, and `enabled=1` after verification. Provision through a protected operator process; never paste the token into chat, frontend assets, repository, logs, or D1. Set `enabled=0` or `revoked_at` to revoke it.
4. Mount `handleAgentConnector` for `/api/connector/v1/*` only after validating the Cloudflare Access administrator policy for this hostname, and retaining same-origin browser security rules for owner actions.
5. Add token rotation/revocation, scoped identity and rate limiting before production. Credentials are per-agent and site-scoped; a 30-requests/minute server-side quota is enforced. Do not enable production based only on this candidate.
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

## Additional implementation: agent CMS draft inbox
- `src/agent-drafts.ts` provides validated agent CMS document intake and owner-only draft review.
- `/api/connector/v1/cms-drafts` accepts a structurally validated CMS draft with a bearer token **only after secure edge access and secret provisioning**.
- `/api/agent-drafts` and `/api/agent-drafts/:id` are owner-authenticated review endpoints; accepting saves a **private draft only** with a version check.
- The dashboard renders an escaped, sandboxed text-content preview. This does **not** reproduce the exact site's visual design yet.
- Migration `0007_agent_drafts.sql` provisions the queue.
- No API token, cross-account execution credential or arbitrary destination URL is supplied by the AI.
- The agent bearer route is not ChatGPT integration by itself. A separately configured ChatGPT-compatible OAuth/MCP app, secure credential registration, per-agent scopes, rate limits, staging tests and owner release approval are required.
- The entire Control Room hostname must stay behind Cloudflare Access; routing code alone is not sufficient access control.
- **No live deployment has occurred**. This PR is not production-ready until these gates pass.


## Agent credential migration / review update
- Migration `0008_agent_credentials.sql` adds hashed, revocable, site-scoped agent identities and request quota counters.
- Remove any former `CONNECTOR_TOKENS_SHA256` secret if it was staged for this candidate. The current candidate reads the owner-managed database credential registry instead.
- The restricted HTTP bearer API is **not a ChatGPT MCP server**. ChatGPT authentication and approved MCP/OpenAPI connector registration remain separate tasks; do not claim ChatGPT is connected based on API availability.
- Protect the owner hostname and provide an explicitly authenticated agent ingress that does not expose owner-only routes. Any Cloudflare Access machine-to-machine policy must be separately verified.

## Deployment safety clarification (2026-10-20)
The HTTP connector route is now **disabled by default**. Its dedicated host must match `AGENT_INGRESS_HOST` and `AGENT_INGRESS_ENABLED=true` must be explicitly set by the authorized operator. The hostname must have a separate verified machine-to-machine Cloudflare Access policy and no owner routes exposed there. Never enable it on the owner dashboard hostname.

Hardening changes: malformed JSON gets a 400 response, source-code proposal creation and the audit entry run together as one D1 batch, and additional negative security tests cover protected site scopes. These tests have been added, **not yet run**.

Production release remains blocked on: a confirmed deployment identity, tested Cloudflare Access policy, staging migrations, running `npm run check` and Node regression tests on a checked-out repository, real ChatGPT MCP/OAuth app integration, and owner approval of the immutable revision. No GitHub Actions are required.
