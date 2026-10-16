# Account 4 Client Accounts — isolated implementation branch

This branch introduces the initial database schema for **Client Accounts** and is not a production deployment.

Navigation target: **Heavenly Key | TalkMoney | Client Accounts**. Selecting a client opens only that client's sites, CMS, AI workspace, previews, and release history.

## Security gates before activating endpoints
- Authenticate every request through the Control Room; derive user ID from verified server-side session, never client input.
- Owner has oversight. Client members are authorized only through `control_client_members`; always scope queries by `client_id` and `site_id`.
- Cloudflare credentials are encrypted and stored server-side per connection; never send them to an AI agent, client, or browser.
- No direct production deploy from an AI edit. Build in isolation, scan, produce immutable SHA-256 artifact and preview, require explicit Owner approval for that exact hash, then deploy.
- Protect against cross-tenant IDOR, malicious ZIP paths/symlinks, unsafe dependencies, SSRF and leaked secrets.
- Use separate execution identities and audit records for client deployments.
- GitHub synchronization is optional backup only, never a required deployment step.

## Remaining work
Implement authenticated CRUD endpoints and client dashboard UI, isolated build/preview service, secure Cloudflare connection flow, approval/deploy API, rollback and integration tests. Run D1 migration only after schema review. Do not merge or deploy this branch until all security and regression gates pass.
