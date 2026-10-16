# Account 4 Deployment Executor — activation gates

The executor is intentionally NOT mounted in the Account 4 Worker entry point.
Do not activate it until all gates pass.

1. Apply migration 0009 on the intended D1 database and verify target mappings.
2. Provision an R2 bucket bound as DEPLOY_ARTIFACTS, containing immutable release artifacts.
3. Configure DEPLOY_EXECUTOR_SECRET and a narrowly scoped CLOUDFLARE_DEPLOY_TOKEN using Worker secrets, never browser code.
4. Verify the Cloudflare Workers upload API payload against the currently deployed Workers format and compatibility settings.
5. CRITICAL: The initial module PUT implementation does not preserve existing bindings, routes, or compatibility flags. It must not be used against production until a safe deploy mechanism preserves all current configuration. Prefer a versioned deployment workflow with a validated configuration manifest.
6. Ensure production requires Owner approval and tested artifact digest. Verify audit log and rollback to a known prior version.
7. Test a disposable Worker first; compare actual configuration before/after, then perform end-to-end health checks.
8. Only after all checks, mount the executor behind a separate service credential and allow execution. Never expose that credential to the Control Room browser.

The portal currently supports registering target records via database configuration and
creating/approving jobs. It does not automatically provision six Cloudflare accounts
or discover their account IDs. Pages targets remain unsupported by the executor.

The CMS and AI Studio are independent and must not be deployed as part of a target
unless explicitly selected and approved.
