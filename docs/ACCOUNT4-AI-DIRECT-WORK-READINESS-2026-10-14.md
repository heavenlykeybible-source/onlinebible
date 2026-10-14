# Account 4 AI direct-work readiness audit — 2026-10-14

## What is implemented
- Account 4 has an authenticated, stateless MCP endpoint at `/mcp`, with per-provider bearer tokens (ChatGPT, Claude, Gemini, custom). Its `/api/agent/info` endpoint and OpenAPI description expose limited AI integration capabilities.
- Tools include `get_account4_capabilities`, `get_repair_scopes`, `plan_repair_from_message`, `inspect_repair_scope`, `submit_scoped_repair`, and `list_my_proposals`.
- AI clients may inspect only allowlisted feature-level source files in Accounts 1–3, provided a dedicated `GITHUB_SOURCE_READ_TOKEN` with contents:read permission is installed as an Account 4 secret. It is never sent back to the client.
- AI-submitted repairs are quarantined. The bridge cannot approve, deploy, restore, read secrets, edit Account 4 core, modify CMS authority, or run database migrations. Owner-controlled release remains separate.

## Confirmed source-level issue repaired
The Account 4 GitHub Actions deployment workflow exported `RAW_CLOUDFLARE_API_TOKEN` but subsequent Wrangler commands expect `CLOUDFLARE_API_TOKEN`. The workflow now exports the correct variable, preserving the same GitHub secret `ACCOUNT_4_TOKEN`. The Account 4 Worker Env TypeScript interface now also declares the optional read-only source token and source ref used by the scoped source reader.

## Checks required before claiming deployment ready
1. Run the Account 4 deployment workflow's gates and build, including `scripts/test-account4-agent-bridge.mjs`, `scripts/test-account4-direct-upload.mjs`, `scripts/test-account4-local-login.mjs`, and `scripts/test-account4-update-centre.mjs`.
2. Confirm GitHub environment `account4-owner-approval` is configured, with existing `ACCOUNT_4_TOKEN`, `ACCOUNT_4_ACCOUNT_ID`, and pinned `ACCOUNT4_PROTECTED_D1_ID`. Do not reveal or rotate credentials.
3. Confirm the existing D1, R2 and KV bindings, including `CODE_INTAKE`, remain attached to the deployed Worker and migrations already exist. Never create replacement production resources during a routine update.
4. Configure per-provider connector tokens via the authenticated Account 4 dashboard. Configure a separate read-only GitHub source token only if AI source inspection is desired.
5. Test `/mcp` with an unauthorized request (expect rejection), an authorized capabilities request, scoped source inspection and a quarantine-only repair submission. Confirm a submission cannot trigger production deployment.
6. Deploy Account 4 only through the explicit owner-approved `cloudflare-recovery-control.yml` workflow and verify the live sign-in page and MCP response.

## Verdict
**Source-level restricted AI maintenance gateway exists; live operational readiness is not yet verified.** The gateway is not an autonomous coding runtime or an unrestricted remote computer. Compatible external AI clients connect to it and submit scoped repair candidates. This audit does not authorize production deployment.
