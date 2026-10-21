# Global Christian Community deployment

Source directory: `global-community/`. GitHub Actions is not required.

Use Node.js 22.13 or newer for the local SQLite and TypeScript test tools. From this directory:

1. Install the locked dependencies with `npm ci`.
2. Run `npm run buildcheck`. This includes frontend syntax, application checks, registration, groups, feed, adverts, stewardship and the local Worker API audit.
3. For another Cloudflare account, prepare a separate TOML configuration beside `wrangler.toml`. Set that account's existing D1 database ID, session KV ID, media bucket and public origin. Do not copy Account 3 resource IDs into another account or replace populated stores with empty resources.
4. Run `npm run preflight -- --release --config wrangler.target.toml` and `npx wrangler deploy --dry-run --config wrangler.target.toml`.
5. Verify the intended Cloudflare account and resource access. Preserve its existing secrets. `PASSWORD_PEPPER` is essential for email authentication and must match existing password hashes; `SESSION_SECRET` decrypts saved social-provider settings and must not be rotated during deployment. Calling requires separate TURN configuration. AI controls, generation routes and the Workers AI binding are removed for this release.
6. Check the target database's applied migrations against `migrations/`. Schema changes require separate review and recovery preparation; a code deployment does not apply them.
7. Deploy the tested version with the selected target config, then verify its HTTPS domain, sign-in continuity, posting, requests, messages, uploads and moderation. Verify social sign-in and AI only when configured.

`wrangler.toml` retains the existing Account 3 resource identities. No resources, passwords, secrets or domain routes are changed by these source repairs. The configuration check is offline; it cannot confirm access to a remote account.

The runtime test environment was unavailable during preparation of these repairs. Full Node/Worker tests and remote checks must pass before declaring this version ready.
