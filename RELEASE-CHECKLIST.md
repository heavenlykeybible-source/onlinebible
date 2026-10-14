# Heavenly Key release checklist

## Source gate
- [ ] Review current `main` commit.
- [ ] `npm run preflight` passes with real Cloudflare IDs.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm test` passes.
- [ ] No secrets or provider tokens are committed.

## Cloudflare staging
- [ ] Separate staging D1 created.
- [ ] Separate staging KV namespaces created.
- [ ] Staging R2 bucket created.
- [ ] Staging secrets set.
- [ ] Staging migrations applied.
- [ ] Staging Worker deployed.

## Functional acceptance
- [ ] Register/login/logout/profile.
- [ ] Community posting, comments and reactions.
- [ ] Prayer/testimony/Q&A flows.
- [ ] Group privacy and membership authorization.
- [ ] Moderation and appeals authorization.
- [ ] Decisions/counselling access audit logging.
- [ ] Media upload, approval, playback and delete.
- [x] Core Worker multipart upload endpoints remain disabled; Core normal uploads are capped at 100 MiB.
- [ ] Verify the Core 100 MiB normal-upload ceiling is enforced in staging.
- [ ] Verify the separate Account 2 Media Engine resumable upload path handles approved audio/video up to 2 GB without routing large bodies through Core.
- [ ] 48-hour cleanup and KEEP behavior.
- [ ] Live heartbeat, 10-minute reconnect window and fallback playback.
- [ ] Recording download/delete/keep behavior.
- [ ] Campaign scheduling and distribution lifecycle.
- [ ] Real social account authorization before automation.

## Production
- [ ] Production D1/KV/R2 resources created.
- [ ] Production IDs placed in `wrangler.toml`.
- [ ] Production secrets set through Wrangler.
- [ ] Production migrations applied after staging acceptance.
- [ ] `npm run deploy` succeeds.
- [ ] Smoke test production endpoints.
- [ ] Verify Cron Trigger execution and R2 cleanup.
- [ ] Record deployed Worker version/commit SHA in the ministry deployment log.
