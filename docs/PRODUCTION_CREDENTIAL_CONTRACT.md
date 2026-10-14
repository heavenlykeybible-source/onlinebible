# Production Cloudflare credential contract — keep existing credentials

The four accounts use independent Cloudflare account credentials. Their **GitHub Actions secrets** are not website login passwords. GitHub **repository secrets** and **environment secrets** are distinct; an environment secret of the same name takes precedence in a job which declares that environment. GitHub cannot reveal saved secret values.

| Account | Production environment | GitHub secret for Cloudflare API token | Other required GitHub secrets |
|---|---|---|---|
| 1 website | repository scope (no GitHub environment selected) | `CLOUDFLARE_API_TOKEN` | `HKEM_CONTROL_TOKEN` for signed release |
| 2 media | `media-engine-production` | `ACCOUNT_2_TOKEN` | `HKEM_CONTROL_TOKEN` for signed release |
| 3 community | `global-community-production` | `CLOUDFLARE_ACCOUNT3_API_TOKEN` | `CLOUDFLARE_ACCOUNT3_ACCOUNT_ID`, `ACCOUNT3_PROTECTED_D1_ID`, `ACCOUNT3_PROTECTED_SESSIONS_KV_ID`, `HKEM_CONTROL_TOKEN` |
| 4 recovery | `account4-owner-approval` | `ACCOUNT_4_TOKEN` | `ACCOUNT_4_ACCOUNT_ID`, `ACCOUNT4_PROTECTED_D1_ID` |

**If a workflow reports missing secrets:**
1. Confirm the account and environment named above. In the private GitHub repository use *Settings → Secrets and variables → Actions* (and *Settings → Environments* for an environment-scoped secret). Do not paste secret values into PRs, issues, or chat.
2. Check that the **correct original** secret exists in that scope; never replace Account 1's token with Account 2's token (or vice versa). Run `scripts/check-deployment-credentials.mjs <account number>` only in an authorized deployment runner; it checks presence/format and normalizes accidental `Bearer ` prefixes. It does **not** validate token ownership or perform Cloudflare mutations.
3. For Account 4, verify the **existing** `heavenlykey-recovery-control-db` D1 database UUID in the *original* Account 4 Cloudflare dashboard and pin it under `ACCOUNT4_PROTECTED_D1_ID`. The repository cannot recover a missing D1 identity safely from a guessed new database.
4. Owner-signed per-account production approval, original D1/KV/R2 IDs, existing Worker secrets and successful staging remain mandatory. Do not create new databases, rotate passwords, or bypass approval checks during a routine deployment.

A successful preflight confirms configuration is in scope, **not** that the real Cloudflare token has permission or that a live release succeeded. Subsequent protected resource verification and actual deployment must also succeed.
