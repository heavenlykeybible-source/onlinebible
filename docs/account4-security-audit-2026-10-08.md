# Account 4 direct-upload and permanent CMS — security audit

Audit date: 2026-10-08. Branch: `feature/wordpress-style-visual-cms`.

**Release decision: HOLD.** The present branch is a review-only implementation, not an authorized Cloudflare deployment. Accounts 1–4 must not be updated until explicit owner approval and closure of all blocking issues below.

## Evidence inspected

- `recovery-control/src/index.ts`, `local-auth.ts`, `package-intake.ts`, `assistant-spec.ts`, `recovery-control/migrations/0002_direct_upload.sql`
- `scripts/cms-permanence-gate.mjs`, automated tests, Account 1 normal deployment and emergency restore workflows
- Current repository main head was `711f85b64931384cabd11cde84111ff5e2255579` during audit; the new control plane and CMS changes are **not in main or live production**.
- Successful dedicated CI runs at the review stage, including adversarial ZIP tests added during this audit.

## Findings and severity

### A-01 — BLOCKER — No GitHub-independent promotion pipeline

Upload endpoints `PUT /api/packages` and `POST /api/proposals` only save bytes or source text to R2 and create D1 quarantine records. They do **not** parse and certify manifest contents, compile, sandbox, stage, or deploy the uploaded code. The current production controls continue dispatching GitHub workflows. Never label quarantined packages as validated, preview-ready or deployable. Build a separate isolated builder and an independently permissioned production promoter.

### A-02 — BLOCKER — CMS permanence not guaranteed

The gate `scripts/cms-permanence-gate.mjs` is a useful static source check for presence of key files, routes, and tables. It cannot prove that the CMS works or that a privileged workflow editor cannot remove the check. Account 1 production and emergency-restore workflows on the review branch reference the trusted main-branch policy, but the policy is not currently installed on main. Protect main with required status checks and reviews, use a separately maintained trusted policy, and run live-like CMS API integration tests before promotion. Preserve D1/R2 bindings and require reviewed additive migrations.

### A-03 — HIGH — Six history entries are not six independently recoverable backups

Six choices come from recent **successful GitHub workflow commit SHAs**, not six verified Cloudflare Worker snapshots, R2 image backups and D1 database recovery points. GitHub workflow-history retention and later manual Cloudflare deployments may make the list incomplete or stale. Implement an immutable release manifest with Worker version IDs, digests, CMS compatibility, D1 recovery/bookmark metadata and R2 asset inventory; test restoration end to end. Avoid promising data rollback from code rollback.

### A-04 — HIGH — Owner authentication needs hardening

Dashboard uses one password plus signed cookie, with no MFA for publishing or emergency rollback. Password and bearer token prompts are currently browser `prompt()` dialogs rather than masked form controls. Dashboard password changes and connector key revocations are stored in Cloudflare KV, which is **eventually consistent**. High-assurance session revocation/credential rotation should instead use a strongly consistent authority (e.g. D1 transaction/Durable Object) and MFA for production operations. Rotate the previously shared original password before enabling external connections.

### A-05 — HIGH — Uploaded files share R2 storage permissions with recovery material

The code stores quarantined ZIPs/proposals under an `account4-intake/` prefix in the existing `RECOVERY_VAULT` binding. Although the object namespace is distinct by prefix, storage and permissions are shared. Use a separate R2 quarantine bucket with least-privileged write access and quotas, isolated from protected recovery snapshots.

### A-06 — HIGH — No upload rate/space limits across requests

Individual ZIP limit is 8 MiB, proposal limit is 250 KiB, but the intake endpoints have no actor-level rate quota or total storage cap. A stolen valid connector token can repeatedly upload packages and consume R2/D1 usage. Add per-actor intake quotas and risk alerts enforced atomically, plus connection-token rotation and an abuse-response path.

### A-07 — HIGH — AI providers are not connected through native login/OAuth

There is a proposed bearer-key intake protocol for clients labeled ChatGPT, Claude and Gemini, plus an OpenAPI description. Native ChatGPT plugin installation, Claude MCP/OAuth and Gemini authentication are **not configured** by creating these keys. Provider name reflects which bearer key was used, not independently verified provider identity. Tokens authorize candidate submissions only; they cannot publish code. Preserve this scope and avoid displaying 'Connected' until an integration actually completes a verified handshake.

### A-08 — MEDIUM — ZIP checks were incomplete; first hardening applied in this audit

Earlier index-only scanning allowed suspicious directory components and did not compare local file headers to the central index. This was corrected on the review branch, with new negative tests for directory traversal, filename and method/flags mismatch. **Still not full ZIP verification:** no trusted unpacker checks CRC, payload consistency, schema/cms compatibility or actual file content yet. Do not unpack untrusted ZIPs in the Account 4 Worker.

### A-09 — MEDIUM — Release status based on GitHub rather than actual Cloudflare state

'Live version' is computed from a successful GitHub workflow run label rather than a verified Cloudflare Worker deployment ID. Manual or failed-after-deployment changes could cause drift. Use Cloudflare live deployment/version queries to cross-check each account before displaying a definitive live version.

### A-10 — MEDIUM — Deployment architecture and UI require staging tests

The dashboard HTML/JavaScript passed static syntax tests, and Worker code compiled. Browser-based sessions, large-file behavior, D1 migrations against isolated databases, storage permissions, quota behavior and full sample website preview have not been verified in a live Account 4 staging environment. The current review branch is not authorized for deployment.

### A-11 — ACCESS LIMITATION — Main branch protection status unverified

An attempt to read GitHub branch protection returned HTTP 403 from the GitHub integration. This is **not evidence that branch protection is disabled**, only that we could not verify it. Have a repository administrator confirm protected main branch, required CI checks, CODEOWNERS and restricted workflow/secret changes.

## Positive controls verified

- User requests preserved: no automatic Account 1–3 production promotion without owner action.
- Review-only GitHub branch, no merge to main and no Cloudflare deployment triggered by this audit.
- Explicit target account, upload type and package size checks, quarantine default, SHA-256 content addressing and D1 package history.
- Connector keys are generated as random bearer tokens, stored as hashes and scoped to submission; only logged-in owner can rotate/revoke with password recheck.
- Normal website administration and Account 4 dashboard passwords remain distinct.
- Account 1 proposed workflows include trusted-source CMS presence checks.
- Adversarial ZIP validation tests and original dedicated review CI are passing.

## Required order before release

1. Correct browser password/token input UX, rotate the disclosed password and establish strongly consistent owner approval/revocation with MFA.
2. Separate the upload quarantine R2 bucket, enforce per-actor storage quotas, and strengthen ZIP/manifest validation.
3. Complete independently sandboxed building, signed candidate manifests, separate Account 4 previews and real API tests.
4. Implement a separate restricted deployer and read actual Worker version/deployment IDs.
5. Create and verify six durable code recovery points **plus** separate D1/R2 recovery plans.
6. Install and protect the CMS policy in main, verify branch controls, rehearse normal deployment and rollback.
7. Run browser and Cloudflare end-to-end tests, then seek explicit owner approval.

This audit intentionally makes no live Cloudflare or production database changes.
