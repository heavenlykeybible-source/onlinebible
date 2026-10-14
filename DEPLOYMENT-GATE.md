# Heavenly Key — Deployment Gate

This project is **deployment-ready only after the live Cloudflare resource IDs and secrets are supplied**. The repository intentionally contains placeholders and the normal `deploy` script refuses to deploy while they remain.

## Required Cloudflare resources

Production:
- D1: `heavenlykey-db`
- R2: `heavenlykey-media`
- KV: `SESSIONS_KV`
- KV: `RATE_LIMIT_KV`
- KV: `LIVE_STATUS_KV`

Staging must use separate D1/KV resources and `heavenlykey-media-staging`.

## Required secrets

Set through Wrangler secrets, never in `wrangler.toml`:
- `SESSION_SECRET`
- `PASSWORD_PEPPER`
- `ENCRYPTION_KEY`

Social-provider credentials must be connected through the provider/account integration workflow; raw access tokens must never be written into D1 `credentials_ref`.

## Validation sequence

1. `npm run preflight`
2. `npm run migrate:staging`
3. `npm run deploy:staging`
4. Test authentication, community, media upload/delete, 48-hour retention, KEEP, recording download/delete, campaign scheduling and cleanup against staging.
5. Verify each real social provider account and permissions before enabling it for automation.
6. Verify R2 cleanup and that no temporary object remains after successful distribution.
7. Run production migrations only after staging passes.
8. `npm run deploy`

The application deliberately does not claim that a social platform is live merely because its database capability flag exists. A provider must be configured and authorized before it can be automated.

## Media upload path

- Core Worker normal media uploads are capped at 100 MiB; Core multipart endpoints remain disabled to keep the main application resource-light.
- The separate Account 2 Media Engine supports resumable multipart audio/video uploads up to 2 GB using 8 MiB parts directly to its R2-backed media path.
- Large Media Engine uploads must stay behind Administrator authorization and must not be proxied through D1, KV, or buffered as one large Worker-memory object.
- Temporary Media Engine files follow the retention/KEEP rules; do not use the feature as an unrestricted general-purpose file warehouse.

## Spiritual Media Rule
Bible audio, hymn audio/video, and prayer audio are served only from approved Heavenly Key media objects stored in R2 and referenced by D1 media IDs. No random external website is used as the playback source. Administrators attach an already-uploaded, approved media item to the relevant Bible chapter or hymn.
