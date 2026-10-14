# Account 4 direct uploads and AI connectors — Owner setup

This document covers the implementation on `feature/wordpress-style-visual-cms`. The code stays **review-only until the owner explicitly approves the deployment**. The current live Account 4 dashboard is unchanged.

## What is implemented

- A modernized mobile-responsive Website Update Centre and an R2-backed **direct ZIP intake** with an 8 MB size ceiling.
- Structural ZIP checks: file count, duplicate paths, traversal, unsafe special files, encrypted archives, oversized expansion, unsupported compression, missing root manifest, and suspicious file types.
- Immutable SHA-256-addressed storage in the existing protected `RECOVERY_VAULT` bucket; D1 package history and append-only intake events.
- Quarantine-only status. Uploaded source **is not executed, built, staged, deployed or promoted**. ZIP structural checks cannot prove that it is trusted code.
- A separate JSON text-code proposal API for API clients: 250 KB max, 1–25 files. Also quarantine-only.
- Six previous distinct successful software release SHA selections for Accounts 1, 2, 3 (when that many exist), with **explicit owner confirmation**.
- Account 1 production deploy and emergency recovery include CMS permanence checks sourced from the **main branch**, not the rollback candidate.
- Account 4 remains password-authenticated without relying on Cloudflare Access. Admin password is separate from website admin password.
- Independent one-time-displayed, revocable bearer submission tokens for ChatGPT, Claude and Gemini. Password re-entry is required to generate or revoke. GitHub remains connected via existing workflows.

## Independent Account 4 administrator password rotation

After the code is approved and deployed to Account 4, sign in using your existing Account 4 credentials and open **Account 4 Security → Change Dashboard Password**. Confirm the old password and choose a unique password of at least 16 characters. A new salted PBKDF2-SHA256 password record is stored in Account 4's persistent KV; it is **not committed to GitHub**, and code deployments do not overwrite it. The existing Cloudflare deployment secret remains a legacy fallback for installations that have not changed their password.

Changing the password changes the session signature and rejects cookies issued under the old password record. Cloudflare KV is eventually consistent across locations, so immediate global invalidation should not be treated as a substitute for revoking a compromised deployment/connector token.

This dashboard credential is **separate from the regular ministry website administrator password**. For stronger protection against a compromised password, add second-factor authentication before exposing powerful direct deployment capabilities.

## How the owner uploads directly

1. Sign into the Account 4 Website Update Centre.
2. Select Account 1, 2 or 3. Choose Source Code ZIP or Theme ZIP.
3. Give the package a descriptive title, select the ZIP, and click Upload for Inspection.
4. Account 4 returns an SHA-256 receipt and **QUARANTINED** status. No production changes occur.

A safe package includes a root `account4-package.json`:

```json
{
  "schemaVersion": 1,
  "targetAccount": "1",
  "kind": "theme-zip",
  "cmsCompatibility": "1"
}
```

The current quarantine intake checks that this named file is present but **does not yet parse or certify its contents**. A separate trustworthy validator/builder is still required before any candidate can move beyond quarantine. Ordinary WordPress PHP themes are **not** executable Cloudflare Worker packages.

## Connecting AI assistants

After this upgrade is approved and installed in Account 4, open **Connections** and select Create / Rotate Key next to a provider. Re-enter the Account 4 administrator password. The unique bearer token is revealed **once**. Store it only in that assistant application's confidential configuration, not in source code, a chat message or a public GitHub repository. **Revoking** in Account 4 disables it.

**ChatGPT:** A compatible custom GPT Action can use API-key/Bearer authentication and the machine-readable JSON schema at `/api/integrations/openapi.json`. Creating and authorizing an action in ChatGPT is a separate user action; the dashboard does not connect it automatically.

**Claude:** A Claude-compatible developer integration or remote tool bridge can POST to the same API with its own token. Native Claude sign-in/OAuth and MCP transport are **not** included in this first stage.

**Gemini:** A Gemini developer-client tool using HTTPS requests can POST with its own token. Native Gemini account OAuth is **not** included in this first stage.

**GitHub:** The existing token-backed staging, preview, approval and deployment workflows remain usable. GitHub credentials are not shared with AI connectors.

### JSON code proposal request

`POST https://heavenlykey-recovery-control.emmanuel2026miracle.workers.dev/api/proposals`

Headers:

- `Authorization: Bearer <PRIVATE_PROVIDER_SUBMISSION_KEY>`
- `Content-Type: application/json`

Body:

```json
{
  "schemaVersion": 1,
  "account": "1",
  "name": "Update homepage welcome copy",
  "files": [
    {
      "path": "heavenly-key-website/index.html",
      "content": "<!doctype html><html><body>REVIEW CANDIDATE ONLY</body></html>"
    }
  ]
}
```

This example shows the request format only; it should not be submitted as real website code. A successful submission returns a package id, SHA-256 and status `quarantined`. **Assistant tokens cannot access `/api/action`, trigger production, or rotate tokens.** The agent proposal is not applied until a separate builder, security validation, testing and owner's approval are implemented.

## Still required before live direct deployments

1. A **separate isolated build/scan service** with no production credentials, capable of safely unzipping and testing packages, checking the actual manifest and comparing changes against a **trusted** CMS baseline.
2. Versioned package contracts and compatibility testing against a realistic but non-sensitive Account 4 preview.
3. A separate **production promoter** with narrowly scoped Cloudflare Worker-version/deployment tokens for each destination account; API upload must use versions without immediately deploying.
4. A durable signed artifact/approval ledger, cloud version IDs, trusted backup snapshots of D1 and R2, and a code rollback mechanism independent of database recovery.
5. Stronger Account 4 owner security, such as passkeys/TOTP, and rotation of the previously disclosed dashboard credential before activating external integrations.
6. Protected main branch rules so that a direct GitHub push cannot delete or bypass the CMS policy workflow.

**We must never treat `quarantined` as `validated` or `preview-ready`.** The current intake intentionally provides no endpoint for promotion of ZIP/AI proposals.
