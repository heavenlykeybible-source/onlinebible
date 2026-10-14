# Heavenly Key AI Connector Standard

## Goal
Heavenly Key Global Community must be AI-provider-neutral. Administrators can connect approved AI providers without rebuilding the platform, and external AI clients can work with Heavenly Key only through explicit, revocable, least-privilege authorization.

## Provider gateway
All AI traffic goes through one server-side gateway. Provider credentials are secrets and are never returned to browsers, stored in D1 as plaintext, committed to Git, or exposed in logs.

Initial adapters:
- OpenAI-compatible API
- Anthropic-compatible API
- Google Gemini-compatible API
- Custom OpenAI-compatible endpoint for future approved providers

The gateway normalizes chat requests/responses, model selection, timeouts, usage metadata, and errors. Provider-specific code stays behind adapters.

## External AI access
External AI platforms must not receive unrestricted database or administrator access. Heavenly Key exposes a scoped connector API using OAuth 2.1-style authorization semantics and short-lived bearer access tokens. Tokens are hashed at rest and support expiration, revocation, rotation, audit trails, and per-scope rate limits.

Recommended scopes:
- profile:read
- community:read
- community:write
- groups:read
- groups:write
- messages:read
- messages:write
- media:read
- ministry:read
- cms:read
- cms:write
- ai:chat
- deployment:read

High-risk actions such as role changes, credential management, production deployment, destructive moderation, billing, and secret access are never granted to ordinary external AI tokens. They require the normal administrator approval workflow.

## Connector discovery
Expose machine-readable connector metadata describing API version, supported scopes, authentication method, capabilities, and health. Keep a stable versioned API (`/api/v1/...`) so ChatGPT-class assistants and other approved agent clients can integrate without depending on private implementation details.

## Safety and governance
- Explicit user/admin consent before connecting an AI provider or external agent.
- Least privilege by default.
- Separate read and write scopes.
- Human approval for consequential/destructive operations.
- Audit every external-agent action with actor, provider/client, scopes, timestamp, request ID, target resource, and result.
- Never place ministry member private data into model prompts unless the user has authorized that use and the task requires it.
- Redact secrets and authentication headers from logs.
- Enforce request-size limits, rate limits, origin/authentication checks, and outbound-host allowlists.
- Permit an administrator to disable a provider or revoke an external client immediately.

## Deployment principle
AI connectivity is independent from Cloudflare deployment. A provider may be configured only after its secret is installed securely. Missing provider credentials must disable that provider gracefully rather than breaking the Worker build or the rest of Heavenly Key Global Community.
