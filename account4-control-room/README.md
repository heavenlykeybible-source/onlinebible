# Account 4 — Heavenly Key Central Control Room
Initial working CMS foundation. NOT production-ready until all placeholders and security checks are resolved.

## Features implemented
- Six-site content namespace with JSON page/menu/footer/image/section/settings entries.
- Version conflict detection, revision history and restoration.
- Cloudflare Access JWT signature verification (RS256/JWKS), audience and issuer checks.
- R2 image upload with content-type and size limits.
- Workers AI suggestion endpoint, never automatically publishes.
- No automated cross-account deployment: this requires independent Cloudflare credentials and a safe publish/rollback protocol.

## Provisioning (no existing production data may be deleted)
Create a NEW Account 4 D1 database and R2 bucket only after checking existing resources. Fill the placeholders in wrangler.toml. Configure Cloudflare Access with an administrator-only application for the control room, then set ACCESS_TEAM_DOMAIN and ACCESS_AUD to its verified values. Install dependencies, run typecheck, apply D1 migration, test access rejection and revision round-trips, and only then deploy. Never put API tokens in frontend assets or wrangler vars. Protect the entire hostname with Cloudflare Access, not just /api/.

## Important
Saved CMS data is not yet wired to Account 1–6 rendering. A production publish manager must be separately implemented and approved. GitHub remains a recovery source until verified otherwise.
