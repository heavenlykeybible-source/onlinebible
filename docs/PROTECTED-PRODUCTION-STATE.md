# Heavenly Key — protected production state policy (Accounts 1–4)

This policy applies to Account 1 (main ministry and visual CMS), Account 2
(media engine, scheduled programming, broadcasting credentials and stored media),
Account 3 (Christian social community), and Account 4 (owner recovery centre).

## Immutable during ordinary releases
- Existing D1 database identities, tables, users, posted content, audit trails,
  administrator roles, hashes, recovery material and schema history.
- Existing KV namespace IDs, sessions, public media and private R2 objects.
- Password peppers, HMAC/session secrets, LiveKit/RTMP provider secrets,
  encryption keys and Cloudflare access credentials.
- Published CMS content, visual-editor revisions, approved branding assets,
  broadcast sources, scheduler state and configured stream keys.
- Migration contents, schema changes and security-affecting source files recorded
  in `scripts/protected-state-gate.mjs`.

**Normal promotion means code only.** No D1 migrations, no storage creation,
no binding substitutions to replacement IDs, no runtime secret generation and
no automatic reset of admin/member access. The guarded source tree must match
the audited baseline, otherwise the release fails before production access.
Code-only release is still subject to Account 4 preview, exact SHA and
signed owner approval for Accounts 1–3.

## Necessary security or database maintenance — explicit exception
An owner-requested change requires a *separate* approved workflow:
1. A precise change request stating affected account, storage resource, tables,
   intended user-visible behavior, rollback strategy and why the change is needed.
2. Confirm authoritative owner identity, enable GitHub required reviews and
   environment protection. An AI assistant or human contributor may propose
   work but cannot authorize the security exception.
3. Create and verify a recovery point before D1 changes. Verify applicable D1
   Time Travel availability/window. Export evidence and inventory R2 objects
   where content/recording deletion could occur. A Git code rollback does not
   restore D1/KV/R2 content.
4. Test the exact migration or credential change in isolated staging with
   representative sanitized data. Make explicit checks for current admin login,
   user accounts, CMS revisions, media playlists, secret references and
   partner integrations. Prefer additive/reversible operations.
5. Separate approval for the *specific* protected files. Update the baseline
   only after independent review; do not suppress or delete the gate.
6. Apply the explicitly reviewed modification, validate live content/identity,
   retain audit evidence, and document recovery instructions.

## First-install provisioning is separate
Account 3's production D1 UUID and sessions KV namespace must be pinned in
repository or environment secrets `ACCOUNT3_PROTECTED_D1_ID` and
`ACCOUNT3_PROTECTED_SESSIONS_KV_ID`. Account 4's D1 UUID must be pinned as
`ACCOUNT4_PROTECTED_D1_ID`. The owner must first verify these against the
existing Cloudflare resources. If absent, incorrect or changed, *do not* allow
the normal release workflow to create a new database or session store. Account 2
uses the original UUIDs pinned in `media-engine/wrangler.toml`.

These are identity pins, not passwords. Do not share password hashes, admin
passwords, OAuth tokens or stream keys in commits or Actions logs.

## Enforcement beyond source code (owner action in GitHub/Cloudflare)
- Enable GitHub branch rulesets on `main`: require pull requests, successful
  status checks (including protected-state tests), code owner review and
  prevent bypass/force pushes. CODEOWNERS without a ruleset is **not** enforcement.
- Restrict actions and GitHub environments for production, recovery, media
  engine and community to the owner and required reviewers; reduce cloud API
  token scope to the smallest resource/operation needed. Prefer a deployment
  token without D1 write privileges for ordinary code releases.
- Keep signing/encryption and media provider secrets in Cloudflare-managed
  secret storage. Use uniquely scoped credentials per Cloudflare account,
  audit accesses and enable MFA on owner accounts.
- Reconcile R2 object inventories and D1 recovery points; monitor unexpected
  binding changes, new storage objects, user role changes and auth failures.

## Limitations
This is an automatic **release-time** guard, not an absolute guarantee that
data can never be lost. Code bugs at runtime, Cloudflare administrator actions,
expired backup retention, compromised owner credentials, and applications with
write access can still alter records. Runtime authorization checks, least
privilege, working backups and monitored recovery drills remain necessary.

TalkMoney is a separate project and is **not included** in these deployment
changes; finish Heavenly Key and verify first.
