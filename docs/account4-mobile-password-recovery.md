# Account 4 — Mobile administrator password reset

## Proposed change (review first; does not modify Accounts 1–3)
- Login page adds **Forgot your password? Reset by email**.
- `GET /forgot-password` shows a phone-friendly form, `POST /forgot-password` emails one-time URL.
- `GET /reset-password?token=...` shows a phone-friendly form; `POST /reset-password` changes the administrator password.
- Tokens are randomly generated (256 bits), stored as SHA-256 digests in existing D1 table `account4_security_state`, expire after 15 minutes and are deleted on first use.
- Reset recipient is **hard restricted** to `emmanuel2026miracle@gmail.com`. Login/email sender cannot be modified through the public form.
- Three requests per hour per IP (best-effort KV throttle); at least two minutes between emails. Additional Cloudflare WAF/bot protection is recommended.
- Email is sent only by the Cloudflare Worker, without revealing its link in HTML, logs or a public API response.
- Existing sessions become invalid after reset because signed session validation includes the current password record.
- `/api/login` returns a readable JSON error on backend exceptions; the login page explains when a Cloudflare Access or routing page is returned instead of JSON.
- The recovery forms use ordinary browser form posts, so there is no JavaScript JSON parsing error.

## Cloudflare configuration needed before email can actually send

Cloudflare Account 4 must have outbound email sending enabled and a verified sender domain. This is **not yet proved configured**, so do not claim recovery emails are live.

1. Open https://dash.cloudflare.com and choose the Cloudflare account hosting `heavenlykey-recovery-control`.
2. Open **Compute > Email Service > Email Sending** and onboard a domain **present in that same account**. Complete the SPF/DKIM requirements. This is necessary to use an official sender such as `security@your-verified-domain`.
3. Under Email Routing/Destination addresses, register and verify **emmanuel2026miracle@gmail.com** as a recipient (if the account's sender configuration requires it). Follow the confirmation email in that inbox.
4. Once verified, add this binding to **recovery-control/wrangler.toml** and select a verified from address in `[vars]`:
   
   ```toml
   [[send_email]]
   name = "RESET_EMAIL"
   destination_address = "emmanuel2026miracle@gmail.com"

   [vars]
   GITHUB_REPOSITORY = "aoemeta247-cell/All-Nations-For-Christ-Outreach"
   RESET_EMAIL_FROM = "security@YOUR-VERIFIED-DOMAIN"
   ```

   Do not duplicate the existing `[vars]` table; append the extra variable inside it. Replace the uppercase placeholder with an *actually onboarded* sender domain. The destination binding must be restricted to the administrator Gmail address.
5. In Account 4, stage/test the change; then deploy **only the Account 4 recovery Worker** after explicit owner approval. Verify login route JSON and a real received reset email before marking production healthy.

If Account 4 does not manage a domain for email sending, do **not** move or disturb the production website's DNS merely for password reset. Instead, onboard a dedicated domain or subdomain that Account 4 controls, or design an explicitly authorized mail integration. Until then, the recovery form displays **Email setup needed** rather than pretending that it sent a message.

## Testing and operating safely

Review `scripts/test-account4-password-recovery.mjs` and the Account 4 PR checks. Tests use an in-memory D1 stub and fake outgoing email; they do not send real emails or change any live password.

Do not paste reset URLs, raw tokens or passwords into GitHub issues, logs or chat. If a previously disclosed password was used, rotate it with this reset feature as soon as emails work. To protect this powerful deployment control plane, add Cloudflare Access/MFA after ensuring that `/api/login` receives JSON and that the reset pages are reachable by the authorized owner.
