# Heavenly Key central release workspace

This folder coordinates six independently deployed services. **It is not a monolithic deployment.**

- `service-catalog.json`: source ownership, interfaces, protected state, implementation evidence and copy sequence.
- `heavenly-key-release-manifest.json`: readiness gates and proposed content propagation.
- `verify-release.mjs`: read-only, offline checks of manifest consistency and release safety; no credentials, database mutations or deployment.

Run `node release/verify-release.mjs` from repository root. This command checks metadata only; it does **not** prove live service readiness. Do not enable Account 3 community bindings until actual D1/KV IDs are verified. Do not blindly copy Cloudflare resource identifiers between accounts.
