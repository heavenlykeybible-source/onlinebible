# Account 4 Direct Upload and Permanent CMS — implementation contract

**Status:** review-only implementation. The ZIP and AI proposal intake, owner connector key management, six code-restore choices and CMS gate have been implemented in the development branch and tested. Uploaded packages remain quarantined; the isolated builder, validated preview pipeline and GitHub-independent production promotion are NOT yet implemented or deployed.

## Objectives and ownership

- The Heavenly Key visual CMS is accessed through the *normal ministry Administrator* session. It stores edits in production D1 and pictures in production R2. The Website Update Centre's password is **not** the normal website administrator password.
- Account 4 hosts a separate owner-controlled **software delivery centre** for Accounts 1, 2 and 3. It must not silently modify any production website or share staging and production databases.
- GitHub is optional for **new package submission**. Existing GitHub workflows can remain a supported source.
- An uploaded file becomes a **review candidate only**. The user separately approves the exact scanned artifact for the exact production account.

## Permanent CMS contract

1. Maintain the same production D1, R2 and public media paths during code redeploys. Never delete or re-create production data resources as part of normal deployment.
2. Preserve CMS runtime API routes and the normal-admin visual editor. Run `node scripts/cms-permanence-gate.mjs` from a **trusted** build pipeline before promotion.
3. Protect migration 0039 and all later CMS schema. Reject destructive migrations; require forward-compatible/additive schema changes, reviewed and backed up separately.
4. Before each production software promotion, record the active Worker version, D1 Time Travel bookmark (when supported), CMS logical export and asset inventory. Keep separate dated recovery copies in protected storage.
5. Test the candidate against a *copy* of safe sample data, including login, create draft, picture upload, save, publish, restore and public rendering. Production data must never be imported into a publicly accessible staging system.
6. Check that the candidate still supports the previously deployed CMS schema, as tested on Account 4, including API contract and resource binding names.
7. Roll back **code versions** independently of data recovery. A code rollback does not automatically restore D1/R2 content. Data restores require a separate explicit owner decision.

## Direct-upload intake implemented; trusted build, preview and production promotion not yet implemented

**Front end in Account 4**

- Project: Heavenly Key (initial), with possible future TalkMoney, each isolated.
- Target: Account 1 (website), Account 2 (media), Account 3 (community).
- Upload a ZIP bundle or supported theme package (file size/type limits, checksum and clear validation errors).
- Buttons: **Upload → Validate → Preview → Approve & Publish → Rollback**.
- Existing signed-in Account 4 administrator login is mandatory; require extra confirmation for any live release.
- "Upload" must never mean "publish to production."

**Package types and compatibility**

- **Content/theme package:** image, CSS, HTML and approved theme configuration; schema-versioned manifest; never treat a WordPress PHP theme as a runnable Cloudflare Worker.
- **Full application update:** lockfile + verified supported project layout; full source and compiled asset checks. Executable builds must run in an isolated builder, **not inside the Account 4 Worker**.
- Require a versioned manifest declaring package type, target app, compatible CMS API version and allowed changes. Reject path traversal, links escaping the archive root, oversized archives, hidden executables, secrets, unauthorized bindings/routes and unrecognized manifests.
- Reject removal of essential CMS files/API routes and any D1/R2 resource rebinding. Validate JS/TS/HTML syntax, migration compatibility, asset references, tests, and response smoke tests.
- Static checks and malware scans reduce risk but cannot prove that arbitrary code is completely safe. Trusted sources, sandboxing, least-privilege tokens and human review are essential.

**Backend and storage**

1. Normal Account 4 login -> a non-executable upload intake Worker.
2. Intake streams the package to an **isolated Account 4 R2 intake bucket** using narrowly scoped upload credentials; records immutable SHA-256, actor, time, project and chosen target in the control database.
3. A separate isolated build worker (for example Cloudflare Containers/secure CI runner if available) unpacks under strict limits and performs all validation. No production API token available to the builder.
4. Tested output is stored under a content-addressed immutable artifact key and staged into an Account 4 **preview Worker**, with separate D1/R2/KV sample resources.
5. The user must view the preview and explicitly approve the **exact artifact digest**, target and compatible config. The approval service issues a single-use, short-lived authorization.
6. A separate limited **production promoter** reads only signed validated artifacts and calls the appropriate Cloudflare Workers deployment/version API using a server-side token scoped to that one destination account. It cannot accept arbitrary code directly from the browser.
7. Record Cloudflare Worker version IDs, approval, hash, test reports, operator, deployment and recovery metadata in an append-only audit store. Provide "Restore previous working version" with separate confirmation.
8. Never apply unreviewed schema migrations automatically during a code upload. Require migration preflight and snapshot/backup, and do not run destructive migrations.

## Optional assistant integration

A custom connected app could expose only `upload_candidate`, `get_validation`, `open_preview` and `request_approval`. Live publishing must require the owner's intentional authenticated approval, not a self-authorizing automated assistant. A connected tool or user-authorized browser workflow must actually exist before claiming direct ChatGPT access.

## Required credentials and costs

- No additional nameservers are needed just to create Account 4 preview Workers.
- Production deployment via Account 4 needs Cloudflare API tokens with appropriately restricted **Workers script/versions/deployments** permissions for **each production account**. Account4's existing token does not automatically grant control over Accounts1–3. Store secrets server-side, never in uploaded ZIPs or browser code.
- A separate builder/CI service is required to build arbitrary uploaded TypeScript projects. Verify resource pricing/plan access before selecting Cloudflare Containers or an alternative.
- Cloudflare Access can remain optional. The separate Account 4 admin login must continue to work. For sensitive code uploads, add passkey/TOTP or equivalent step-up approval.
- Ensure build/deploy policy and CMS permanence gate are maintained **outside uploaded candidate code**, so uploading a malicious package cannot remove its own checks.

## Rollout stages

1. CMS release gate, migration and binding invariants (**implemented in review branch; does not provide absolute permanence**).
2. Owner-facing R2 upload interface, immutable archive records, independent authentication and audit (**implemented in review branch; no untrusted code executed**).
3. Compatible package validator and sandboxed builder, no production credentials.
4. Account 4 previews + automated regression tests.
5. Narrowly scoped manual production promotion/rollback.
6. Optional connected-app access for assistant to submit/test candidates; never silently publish.

Keep all steps on a review branch until explicit owner authorization to deploy.

Detailed configuration and API documentation: [Account 4 Owner Guide](./account4-direct-upload-owner-guide.md).
