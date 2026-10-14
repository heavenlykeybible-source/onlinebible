# Project Nehemiah — source of truth

The reviewed Project Nehemiah build is preserved in the ChatGPT Library as the deployment artifact:

- heavenlykey-two-account-final-v6-with-frontend.zip
- 2.18 MB
- Contains the reviewed Worker backend, 28 D1 migrations, Account 2 media engine, CI/staging workflow, and the Heavenly Key public website frontend.
- The bundle intentionally contains Cloudflare placeholders rather than production IDs/secrets.
- The frontend contains 12 HTML documents including the homepage and public pages.

Important: do not replace the reviewed application with a newly invented implementation. The Library bundle is the source artifact to import into this GitHub repository.

Current repository state is still deployment-gated. Production deployment must not occur until the reviewed source tree is present, Cloudflare bindings are reconciled, staging resources exist, migrations pass, and the live frontend/backend integration is verified.

The bundle's Cloudflare configuration expects:
- D1: heavenlykey-db
- KV: SESSIONS_KV, RATE_LIMIT_KV, LIVE_STATUS_KV
- R2: MEDIA_R2
- Account 2 media engine URL/secret

The currently provisioned Core resources in Cloudflare are not yet equivalent to that reviewed binding set, so they must not be silently substituted into the full application configuration.
