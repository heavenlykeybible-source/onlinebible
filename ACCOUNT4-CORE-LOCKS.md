# Account 4 Core Locks

Account 4 is the Heavenly Key deployment control plane. It is not an ordinary application target and must remain stable while Accounts 1–3 evolve.

## Permanently protected through ordinary AI, ZIP and proposal intake

The following classes are locked and cannot be changed through an AI connector, direct ZIP intake, candidate proposal, CMS edit or ordinary target deployment:

- `recovery-control/**` — Account 4 control plane and authentication.
- `.github/workflows/account4-*.yml` — Account 4 review, approval and recovery authority.
- `.github/workflows/cloudflare-*.yml` and emergency restore workflows — production authority.
- `wrangler.toml`, environment/binding configuration and Cloudflare resource mappings.
- secrets, credentials, API keys, connector token hashes and encryption material.
- authentication, passwords, roles, permissions and owner identity.
- deployment approval, rollback, restore and audit-history rules.
- D1/KV/R2 bindings and protected migrations.
- permanent CMS compatibility/security controls.
- ministry identity/security policy designated as protected configuration.

## AI connector boundary

Approved AI systems may connect through the restricted OpenAPI/MCP gateway and may:

- read safe capability information;
- submit bounded source proposals for Accounts 1–3;
- inspect their own proposal history.

They may not deploy, approve, restore, read secrets, edit Account 4, change credentials, change security policy, change protected CMS infrastructure, or obtain production authority.

Connector credentials are individually rotatable/revocable. A provider token is an intake credential, never an administrator credential.

## Release boundary

Normal pushes to `main` do not stage or deploy Account 4. Account 4 maintenance is manual-only and must use an immutable 40-character commit SHA. Production remains behind explicit owner approval.

## Unlock procedure

A locked component may change only through an intentional Account 4 core-maintenance release performed by an authenticated owner/operator, after review and tests. An ordinary application release must never unlock a protected component implicitly.

## Stable baseline

After final certification, record the approved Account 4 core commit SHA as the baseline. Future integrity checks compare protected core files to that baseline and reject accidental mutation outside an approved core-maintenance release.
