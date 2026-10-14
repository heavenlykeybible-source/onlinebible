# Five-account recovered-work audit — 10 October 2026

## Verified sources
- Main: 7e48aaf586a8993ff16f5fd63b295a2b90e98ca0.
- Recovered PR #32: cd204d282f0e1631a454656346985a38f47ba2a7, conflicts with main.
- Integration PR #55: 052454123586ac0d9970243f0ad9642fc8049699, conflicts with main.
- AI repair PR #62: c706faf362a1333216ae24d94f301a1c838f7edf; mergeable when checked. GitHub CI queued.
- Account 5 separate repository aoemeta247-cell/heavenly-key-mobile-app: f13018eda15cf6090cf7a11f908086056389f921.

## Confirmed repair
Restore the recovered Community AI doctrine guidance, common confidential-input rejection, and unavailable responses for missing/failing/empty providers. New behavioral tests verify no provider invocation for rejected confidential material and bounded reviewable drafts. Authentication, CMS, storage, migrations and release workflows remain untouched.

## Passed
- Main source transport verified against Git blob fingerprints before checks.
- 112 protected main files; Account 1 authentication continuity and Account 4 permanence.
- Platform: 153 tests across 19 files; root and Community TypeScript.
- 27 Community checks including three AI privacy/provider tests.
- Frontend syntax, API contract, architecture and placeholder-aware preflight.
- Account 5: 10 tests and syntax. GET /api/health at https://heavenly-key-app.heavenlykeyapp.workers.dev returned 200 and {"service":"heavenly-key-app","status":"ok","release":"starter"}.
- GitHub records successful Account 1–3 preview runs at main 7e48aaf and an Account 4 deployment run. These do not establish that PR #32/#55 is released.

## Failed or not established
- Local Community API audit: Wrangler 4.149.0 failed to launch with uv_interface_addresses system error. Not an application-test pass.
- Normal Community dependency installation encountered a peer-version conflict; existing workflow legacy-peer-deps mode installed dependencies. Dependency manifests were not changed.
- Recovered PR #32 lock snapshot has 187 entries, with two mismatched Git blobs: global-community/public/app.js and global-community/public/styles.css. No hashes regenerated.
- Main branch protection disabled.
- No authenticated live member/admin/owner journeys, full cross-country legal review, real-device playback tests or exact production-candidate approval verified.
- Official published Statement of Faith URL could not be fetched in this environment; recovered policy reference is not a fresh live doctrinal verification.
- Production Community AI binding not enabled in current main; runtime generation remains unverified.
- Recovered footer/App/Bible/audio integration remains in unmerged branches. Account 5 is a separate starter shell, not the completed integrated Discipleship App.
- Audio hosting, approved public recordings and offline permissions remain unverified.
- No production deployment performed by this audit.

## Required next release work
Reconcile both branch histories, review the two lock mismatches without overwriting unrelated changes, validate the exact integrated candidate through CI and isolated Account 4 previews, verify existing resources and Account 4 owner identity, obtain the existing signed release proof for the exact version, then use the protected account-specific workflow. Do not rotate passwords, recreate databases, bypass signed approval or publish unapproved audio.
