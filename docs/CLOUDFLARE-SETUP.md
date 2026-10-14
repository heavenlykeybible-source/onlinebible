# Heavenly Key — Cloudflare setup

This document is the controlled setup path from an empty Cloudflare account to a deployable staging environment. Do not put IDs, API tokens, encryption keys, OAuth tokens, or provider secrets into Git.

## 1. Authenticate

Use a Cloudflare API token with the minimum permissions needed to manage Workers, D1, KV, R2 and the relevant account resources. For local setup:

```bash
npx wrangler login
npx wrangler whoami
```

For GitHub Actions, add these repository/environment secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 2. Create staging resources first

Create separate resources for staging. Never point staging at production data.

```bash
npx wrangler d1 create heavenlykey-db-staging
npx wrangler kv namespace create SESSIONS_KV --env staging
npx wrangler kv namespace create RATE_LIMIT_KV --env staging
npx wrangler kv namespace create LIVE_STATUS_KV --env staging
npx wrangler r2 bucket create heavenlykey-media-staging
```

Copy the returned D1/KV IDs into the staging section of `wrangler.toml`. The bucket name is already defined.

## 3. Create production resources

Only after staging is accepted:

```bash
npx wrangler d1 create heavenlykey-db
npx wrangler kv namespace create SESSIONS_KV
npx wrangler kv namespace create RATE_LIMIT_KV
npx wrangler kv namespace create LIVE_STATUS_KV
npx wrangler r2 bucket create heavenlykey-media
```

Copy the returned IDs into the production section of `wrangler.toml`.

## 4. Set secrets

Generate a random 256-bit encryption key and strong independent session/pepper secrets. Set them with Wrangler; never commit them.

```bash
openssl rand -hex 32
npx wrangler secret put SESSION_SECRET
npx wrangler secret put PASSWORD_PEPPER
npx wrangler secret put ENCRYPTION_KEY
```

Repeat the secret setup with `--env staging` for staging.

## 5. Deploy staging

```bash
npm run preflight
npm run migrate:staging
npm run deploy:staging
```

Run the complete staging acceptance checklist before touching production.

## 6. Deploy production

```bash
npm run migrate:prod
npm run deploy
```

Production deployment is intentionally blocked while `wrangler.toml` contains `REPLACE_WITH_REAL_*` values.

## 7. Media and retention

R2 is the only large-media store. D1 stores metadata. The Worker cleanup job runs from the Cron Trigger and removes expired temporary media. Explicitly kept media is exempt from automatic deletion.

Social-distribution media should be deleted from Heavenly Key storage after confirmed successful distribution. Live recordings follow the recording retention rules and can be explicitly kept for download.

## 8. Social providers

A database capability flag is not proof of a working integration. Each provider/account must be separately connected, authorized, tested and marked usable before automation is enabled. Never store raw provider access tokens in D1 fields intended only as credential references.
