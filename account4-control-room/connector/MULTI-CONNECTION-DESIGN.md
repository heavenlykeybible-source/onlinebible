# Multi-provider Account 4 connector — proposed design

Account 4 is the control centre. It can manage many websites, and each site may have **multiple selectable provider connections**:

- **Cloudflare:** one entry per authorized Cloudflare account and Worker/site.
- **GitHub:** one entry per authorized GitHub App installation and repository; different organizations/accounts can be added individually.
- **Site API:** one entry per owner-verified website API. Endpoints must be allowlisted server-side; never accept arbitrary URLs from agents.

## Intended control room interface
1. Choose a managed website.
2. Choose a provider path: Cloudflare / GitHub / Site API.
3. Choose an authorized connection within that path.
4. Choose read, propose, preview, or (owner-only) deploy.
5. Display the exact target website, provider identity, environment, and preview before committing an approved change.

Each connection has an immutable ID, stable account identity, resource identity, roles, enabled status, and verification status. Switching is a **selection of an existing authorized connection**, never a provider-login bypass. An AI agent cannot create or modify a connection or supply arbitrary account IDs/tokens.

## Secrets and safe execution
- Keep each Cloudflare token or GitHub App installation credential in a server-side encrypted secret manager (not browser, chat, GitHub source, or D1 plaintext). Store only the provider credential reference in a restricted mapping.
- Use per-site, per-provider least-privilege scopes. One account's credential cannot operate on another account.
- Owner authentication is required to add, verify, revoke, or change connection permissions.
- Require owner approval for **each exact destination and immutable Git revision** before production deployment.
- Test in staging, return a preview URL, validate health, and preserve rollback information.
- Audit all connector access, failed authorization, preview generation, and publishing.
- Enforce outbound URL allowlists, SSRF protections, CSRF protections on browser actions, quotas and per-token rate limits.
- Never expose a production API token or a protected Control Room setting to a connected AI.

## GitHub Actions and cost
No GitHub Actions are required for connector routing or live CMS draft previews. GitHub remains optional for content editing and strongly recommended for source versioning. Cloudflare and external service free-tier quotas still apply.

## Candidate module
`multi-connection-registry.ts` validates owner-provisioned metadata and provides a **non-executing** routing plan. This is not hooked into the production dashboard, does not store tokens, does not deploy and does not make network requests.

## Work required before activation
Owner-managed connection registry storage; per-agent identities and grants; safe token storage; exact account verification; provider-specific read/preview adapters; authenticated preview renderer; tests and owner approval; deployment and rollback adapters (a later, separately approved change).
