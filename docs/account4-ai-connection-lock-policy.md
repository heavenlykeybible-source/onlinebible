# Account 4 – AI Connections and Locked Core

## Confirmed scope

Account 4 gateway for the Heavenly Key project lives at `https://heavenlykey-recovery-control.emmanuel2026miracle.workers.dev/`.
- Compatible AI tools (ChatGPT Actions, Claude developer clients, Gemini developer clients and other MCP clients) can connect with an **independently issued bearer key**.
- Password-authenticated Account 4 owner opens **Connections** and chooses **Create / Rotate Key** for ChatGPT, Claude, Gemini or Other AI. Token is shown once; do NOT put it in GitHub source or chat.
- Connect via the HTTPS MCP (stateless JSON-RPC) endpoint `https://heavenlykey-recovery-control.emmanuel2026miracle.workers.dev/mcp` when supported by the assistant client.
- Alternatively configure a compatible API Action using `https://heavenlykey-recovery-control.emmanuel2026miracle.workers.dev/api/integrations/openapi.json`.
- Supported MCP tools are `get_account4_capabilities`, `submit_code_proposal`, `list_my_proposals`. List endpoint is private, history contains only the same provider key's candidate metadata.

## Mandatory security boundary

1. **AI keys can never publish production**, stage an untrusted package, restore a release, change password, access secrets, change account bindings, or create deployment tokens.
2. AI candidates must contain **unprivileged, source-only website/interface content** for exactly one selected Account 1, 2 or 3. `recovery-control/`, `.github/`, `cms/`, `scripts/`, `review/`, authentication/security files, CMS builder/editor components, Wrangler configs, package manifests, migrations, credentials and privileged routes are blocked.
3. All accepted proposals/ZIPs stay **QUARANTINED**. Their contents are not executed, compiled, staged, merged or automatically published. A true GitHub-independent build/scan/stage/deploy pipeline is still NOT implemented; do not label candidates deployable until separately verified.
4. Production promotion remains owner-only through an independently authenticated dashboard and a tested preview with separate release approval.
5. Separate keys per assistant provider, with revoke/rotate controls requiring password re-entry. Generic provider is for other authorized AI clients; a key labels which credential was used, not proof of which AI produced a submission.
6. Cloudflare Access (if enabled) must separately allow authorized machine requests to the MCP route or use an authorized service-token policy. Unverified Access redirects can return HTML instead of JSON and prevent login.
7. Account 4 infrastructure deployments must pass the security regression test suite. Unrelated CMS manifest changes no longer trigger Account 4 deployments.
8. **Not a cryptographic immutable lock on GitHub**: a person with repo admin or Cloudflare admin permission can still change code. For protection against privileged edits, set branch rules with required reviews, CODEOWNERS and protected workflows, require MFA, restrict Cloudflare API tokens, and maintain independent immutable backups.

## Restricted bootstrap / activation

**One-time authorized steps:**
- Cloudflare Account 4 already has a D1 database and recovery Worker; preserve their existing resource IDs and D1/R2/KV bindings.
- To make password reset emails functional, onboard a Cloudflare Email Service sending domain in Account 4 and verify the designated sender. Only then add the verified `RESET_EMAIL_FROM` and a destination-restricted `RESET_EMAIL` binding to `recovery-control/wrangler.toml` for `emmanuel2026miracle@gmail.com`.
- Account 4 *cannot* send reset emails until that domain and binding are established. Do not pretend registration alone is sufficient.
- Test by requesting an actual email, opening the one-time link (15-minute expiry), changing password and verifying that the old password is invalidated.
- Put an approved test proposal through MCP from each connected assistant. Expect `quarantined` status, not `published`. Verify the UI says key issued, not falsely "Connected" before a real client handshake.

## Deployment/rollback

This feature must be built, tested, and released as **Account 4 only**, without automatic Account 1–3 production promotion. Preserve Account 4 D1 security records during redeploy; code rollout cannot change owner security state by itself. The dashboard sign-in is distinct from the ministry website administrator.

Future full direct-deploy capability would require a separate sandboxed validator/builder, signed artifact, independent staging, and a short-lived, narrowly scoped production promoter with explicit owner approval. Until that is implemented, verified GitHub staging + owner approval remains the release path.
