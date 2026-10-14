# Module 1 — Cloudflare Deployment Runbook
**To be executed by a human with real Cloudflare account access. This sandbox cannot perform any step below — no network access exists here to Cloudflare's API, npm, or GitHub.**

---

## Prerequisites
- A Cloudflare account (free tier is sufficient to start)
- Node.js installed locally
- This repository (`heavenlykey-platform`, tagged `v1.0.0-stage1-freeze`) cloned or copied to a machine with internet access

## Step 1 — Install dependencies
```bash
cd heavenlykey-platform
npm install
```

## Step 2 — Authenticate Wrangler
```bash
npx wrangler login
```
Opens a browser window to authorize against your actual Cloudflare account.

## Step 3 — Create real D1 databases (production and staging)
```bash
npx wrangler d1 create heavenlykey-db
npx wrangler d1 create heavenlykey-db-staging
```
Each command prints a `database_id`. **Copy both into `wrangler.toml`**, replacing `REPLACE_WITH_REAL_PRODUCTION_D1_ID` and `REPLACE_WITH_REAL_STAGING_D1_ID`.

## Step 4 — Create real KV namespaces
```bash
npx wrangler kv:namespace create SESSIONS_KV
npx wrangler kv:namespace create SESSIONS_KV --env staging
npx wrangler kv:namespace create RATE_LIMIT_KV
npx wrangler kv:namespace create RATE_LIMIT_KV --env staging
```
Copy each printed `id` into the matching binding in `wrangler.toml`.

## Step 5 — Apply the migration, in order, per `migrations/MIGRATIONS.md`
```bash
npx wrangler d1 migrations apply heavenlykey-db-staging --env staging --remote
```
**Verify before proceeding:** run a manual query to confirm tables exist —
```bash
npx wrangler d1 execute heavenlykey-db-staging --env staging --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```
Compare the output against `migrations/MIGRATIONS.md`'s expected table list. Do not proceed if anything is missing.

## Step 6 — Set secrets (never commit these anywhere)
```bash
npx wrangler secret put SESSION_SECRET --env staging
npx wrangler secret put PASSWORD_PEPPER --env staging
```
Use long, random values — e.g., generate with `openssl rand -hex 32`.

## Step 7 — Run locally against the real staging D1/KV first
```bash
npx wrangler dev --env staging --remote
```
The `--remote` flag is important — it runs against the *real* staging D1/KV, not a local emulation, closing the exact gap this project's sandbox couldn't close.

## Step 8 — Manually verify each endpoint (this is the actual Cloudflare-Verified evidence)
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123","country":"Nigeria"}'

curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  -c cookies.txt

curl http://localhost:8787/api/auth/profile -b cookies.txt

curl -X POST http://localhost:8787/api/auth/logout -b cookies.txt

curl http://localhost:8787/api/auth/profile -b cookies.txt
# ^ this last call should now return 401 — if it doesn't, logout isn't
#   actually revoking the session on real Cloudflare KV, and Module 1
#   has NOT earned Cloudflare-Verified status regardless of what the
#   sandbox found earlier.
```
**Also confirm response headers include** `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security` — verifiable with `curl -i`.

## Step 9 — Deploy to production only after staging passes every check above
```bash
npx wrangler deploy
```

## Step 10 — Record the result honestly
Update `PROJECT-CHECKLIST.md`:
- If every check in Step 8 passed against real `--remote` infrastructure: **Module 1 → Cloudflare-Verified**, with the date and who ran it.
- If anything failed: record the specific failure. That's real evidence too, and per Evidence-Based Advancement, a failed check is not something to quietly retry until it passes — it's information about what the sandbox verification couldn't have caught.

---

*Only after this runbook is actually executed — not read — does Module 1 earn Cloudflare-Verified. Reading this document is Specified-level evidence about a plan; running it is the only thing that produces the next real status.*
