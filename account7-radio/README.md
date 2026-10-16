# Account 7 — Heavenly Key Radio

Account 7 is reserved for the dedicated public radio website at https://radio.heavenlykey.org . Account 2 remains the broadcasting, scheduling and Studio management account. Account 4 remains the central management account.

## Current status

Source registration only. No Worker, DNS route, database, bucket, secret or production deployment has been created by this registration. Existing resources reported by the owner must be inspected and reused where appropriate.

The Control Room lists Account 7 as setup pending. Editing remains disabled until the deployed account, authenticated backend, public renderer and CMS support have been connected and verified. The planning engine accepts Account 7 and cannot execute deployment.

## Connection work required

- Verify the authorized Account 7 Cloudflare account ID and account identity.
- Inspect any existing D1 and private R2 resources; record actual IDs and names rather than assuming they match another account.
- Prepare the approved public radio player to consume only Account 2 public programme, schedule and stream metadata. Do not duplicate Studio, move broadcasting or expose service secrets.
- Retain the existing approved artwork and radio appearance. The intended station name is Heavenly Key Radio.
- Add explicit Account 7 CMS publishing and renderer support only after its target is verified. Do not alias Account 7 content to Account 1 or Account 2.
- If community sign-in is needed, use a reviewed identity handoff; do not assume shared databases or copy passwords.
- Review configuration, backups, tests and rollback before any release. Public deployment remains disabled until separately authorized.
