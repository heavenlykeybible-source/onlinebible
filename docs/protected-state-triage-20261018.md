# Protected-state gate triage — 18 October 2026

## CI evidence
GitHub Actions run 39135967431 failed at `scripts/protected-state-gate.mjs`. This failure exists independently of the diagnostic-only change in PR #18.

### Existing protected-file drift reported
- `global-community/wrangler.toml`
- `heavenly-key-website/js/site-cms.js`
- `media-engine/wrangler.toml`
- `src/routes/auth.ts`
- `wrangler.toml`
- `.github/workflows/account4-stage-all.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/cloudflare-media-engine.yml`
- `.github/workflows/cloudflare-recovery-control.yml`

### Production SQL awaiting review
- `migrations/0032_website_ai_inbox.sql`
- `global-community/migrations/0012_ministry_editorial.sql`
- `global-community/migrations/0013_ministry_editorial_audit.sql`
- `global-community/migrations/0014_ministry_post_actions.sql`
- `global-community/migrations/0015_ministry_bulk_activation.sql`

### Workflow additions
The gate also reports unapproved workflows, including account deployments, login diagnostics, and verification jobs. Consult the complete CI log for the authoritative full list.

## Separation of duties and repair order
1. **Do not update baseline hashes just to pass CI.** Determine whether each protected change was owner-approved, review the diff, and either revert unauthorized drift through a separate reviewed PR or authorize a new protected baseline with backups.
2. **Preserve SQL and database history.** Read-only inspect production D1 migration journal and schema before selecting a forward-only reconciliation for duplicate 0032.
3. **Review new workflow permissions and secrets individually.** Remove or authorize only after owner review. Never bypass manual approval.
4. **Test the resulting isolated changes.** Run the protected-state gate, architecture check, Account 3 source tests, and relevant deployment previews.
5. **Promote only after signed owner approval.** Keep the live site unchanged until the release gates pass.

This document is a diagnostic checklist, not evidence of successful production remediation.
