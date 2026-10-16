# Account 4 awaiting-room release rule

Every public presentation update arrives as **New update** in one awaiting-room table. CMS edits, restored edits and structured AI edits enter immediately. Repository/AI source updates use `scripts/account4-intake.mjs`; the workflow sends complete public file snapshots. It has no production-deployment credentials and cannot approve releases.

The table contains Accounts 1–6 and independent Bible, community, radio, study and My Walk with God app entries. It records arrival, approval and verified live status. Preview is a sandboxed template inspection with page selection, colour settings and HTML editing. A changed revision requires a new preview by the approving administrator. The two row actions are **Preview** and **Approve**; there is no draft workflow.

## What approval replaces

A complete website snapshot replaces the previous public file set, including text, pictures, styles, scripts and public manifests. Missing files return 404 rather than silently loading the old design. Individually approved app snapshots take precedence according to approval time, so an older child release cannot mask a newly approved complete website.

Existing server CMS overrides are retired by captured revision numbers, without deleting them. New CMS edits approved afterwards still work. The legacy presentation CMS cannot apply old layout/slider/page overrides over an approved new snapshot or bypass Account 4 approval.

The gateway serves the new public files and forwards existing backend APIs to the same original Workers. It does not replace backend code, change a database binding, run SQL against a site database, migrate data, reset credentials, update secrets or provision resources. Users, passwords, sessions, member data and existing API keys stay with the original services. Backend/infrastructure/API-key maintenance remains a separate direct operation outside ordinary presentation publishing.

App service-worker code, private notebook/progress keys, downloaded Bible/audio stores and existing storage formats are preserved. Public files remain cacheable for offline use; canonical pages revalidate, while versioned dependencies are immutable. The app and community security policies remain enforced. Colour settings use a same-origin stylesheet rather than adding inline code to strict-CSP app pages.

## Independent sources

The homepage bundle no longer contains Bible and mini-app implementation files. Their exact existing Git blobs are retained in `bible/public/` and `public-apps/`, so they can be reviewed independently without reintroducing them into the homepage source. `bible/wrangler.toml` and Bible checks use the independent public folder. The intake builder mounts mini-app files at their existing public paths.

## Installation state

This change is prepared for review only. No production migration, deployment, secret write, route activation, intake or approval has been executed by this work.

A later explicitly authorized installation must deploy the Control Room/public CMS/router code together, apply only the new Account 4 review-metadata migrations, configure the submit-only `ACCOUNT4_RELEASE_INGEST_TOKEN` GitHub secret and matching Control Room Worker secret `RELEASE_INGEST_TOKEN`, activate the declared portal routes, then set repository variable `ACCOUNT4_RELEASE_PIPELINE_ENABLED=true`. The workflow is gated off until that installation is complete. Normal releases then only upload snapshots and switch Account 4 metadata after administrator approval; they never invoke deployment workflows or site-database migrations.

The old automatic production push triggers are removed from the Account 3, Control Room, portal-router and public-app deployment workflows. Direct maintenance workflows remain manual.

## Validation

- SQLite-backed end-to-end tests cover all eleven targets, immutable file intake, exact-revision preview/approval, replacement, removed-page handling, colour/HTML edits, protected API pass-through, source-uploader restrictions and preservation of seeded user/password/API-key data.
- DOM interaction tests cover the table, preview acknowledgement, settings edits, invalidated approvals and verified-working display.
- Existing portal/auth routing tests and CMS/password/public-AI tests pass.
- Bible checks cover 66-book checksums, reader, offline integrity, UI assets, study tools and read-only Worker isolation.
- Existing app offline/private-notebook preservation checks pass.
- TypeScript and JavaScript syntax checks pass.
- A full rendered-browser pass remains unverified in this environment: Chromium was unavailable and its download failed. No live behavior is claimed before the authorized installation and verification.

## Verse commentary

Every displayed KJV verse now has a commentary entry point, with Ask Kumuyi AI and Deeper Life as the preferred study sources. Scripture text, hashes, user notes and progress remain separate. Source links open in new tabs; a copyable question includes the exact verse and requests a source citation. Imported notes display their author, study title and preferred-source link. No generic AI text is labelled as Pastor Kumuyi's words.

The source catalogue explicitly reports **0 imported commentary verses** until an authorised corpus is supplied. `bible/scripts/import-commentary.mjs` validates canonical references, source attribution and corpus rights metadata, supports a partial corpus, and rejects a falsely declared complete corpus unless it covers all 31,102 verses. Imported public files still pass through Account 4 Preview and Approve. No new database or credential is created.

A public Ask Kumuyi API was not verified, and the site could not be retrieved during research. Deeper Life's Search the Scriptures publication states that bulk reproduction needs permission. The feature therefore links to those sources and accepts authorised content rather than claiming that all official explanations have already been imported.
