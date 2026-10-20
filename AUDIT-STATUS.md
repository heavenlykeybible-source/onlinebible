# Backend and Release Audit Status

Updated: 2026-10-20
Reviewed branch: feature/simple-bible-sharing-20261020

## Source inventory

- Core platform: 40 numbered SQL migrations, 0001–0040.
- Global Christian Community: 15 numbered SQL migrations, 0001–0015.
- Media Engine: 5 numbered SQL migrations, 0001–0005.
- Recovery Control: 6 numbered SQL migrations, 0001–0006.
- Corrected a duplicate core migration number by moving the idempotent website AI inbox schema to migration 0040. Existing migration contents were not edited.
- Added the new 0040 migration to the protected-state hash baseline so the immutable-state gate recognizes it and guards it against later edits.
- Updated the core deployment preflight and architecture gate to expect the 0040 schema tip.
- Expanded frontend syntax validation to include JavaScript in heavenly-key-app/public and checks for the Bible sharing controls.
- Added the Workers AI binding to the community staging configuration and added a preflight check that production and staging both declare their required bindings.
- Corrected Bible share URLs so they preserve the selected book/chapter and the verse anchor, and made shared links scroll to the intended verse after the chapter loads.
- Added regression assertions for share URL context, anchor navigation, and stale URL-object access.
- Expanded the independent frontend audit to parse every public app JavaScript file and validate the KJV manifest, safe book paths, per-book chapter counts, verse data, and the 66-book / 1,189-chapter / 31,102-verse totals.
- Strengthened the core deployment preflight so production bindings are checked separately from the `[env.staging]` resource declarations instead of letting production resources satisfy staging checks.
- Fixed the staging deployment path so staging deploys and remote staging migrations run the staging-specific preflight; production remote migrations now run production preflight first. The architecture gate checks these command guards.
- Expanded the architecture gate to check migration continuity for Global Community and Recovery Control as well as the core and Media Engine.

The migration filenames and sequence were inspected from the source tree. A full SQL migration replay and foreign-key integrity check have **not** been rerun during this review; the previous 101-table result below was from an earlier snapshot and is not asserted for this branch.

## Latest security hardening already present in source

Manual ministry task completion:
- rejects missing tasks;
- rejects non-pending tasks;
- rejects completion by a different assigned worker;
- uses a conditional update to prevent completing a task twice in a race.

The route propagates service failure instead of always returning success.

## Validation and release status

**Deployment readiness is not certified.** No merge or deployment was performed.

Still required before a future release:
- run the dependency-backed TypeScript checks and application test suites locally or in a separate free validation environment;
- replay all migrations against a disposable local database and run foreign-key/integrity checks;
- verify target-account Cloudflare resource IDs, required secrets, and separate staging resources;
- exercise registration, login/logout, account recovery, authorization, privacy, moderation/appeals, Bible sharing/offline downloads, media upload/playback/deletion, and cross-service contracts;
- verify real social/broadcast provider credentials and permissions before enabling automation;
- complete staging smoke tests, backups/rollback verification, and explicit owner approval.

GitHub Actions are not a dependency for this source review and are not being retried. They have not supplied passing test evidence for this branch.

The Worker is a control plane for live/broadcast state; it does not claim to be a video encoder or social transport.
