# GRDPC Reminder App — source audit (2026-10-20)

## Scope and source baseline

- Audited the latest `main` source tree at commit `146ecd64321976344b08596beaf605e17e525ee0`, not the deployed website.
- Relevant files: `heavenly-key-website/pages/grdpc.html`, `heavenly-key-website/js/grdpc.js`, `heavenly-key-website/js/grdpc-admin.js`, `src/routes/grdpc.ts`, `src/services/grdpc-service.ts`, `migrations/0035_grdpc_reminders.sql`, and `test/unit/grdpc.test.ts`.
- Deployment/GitHub Actions are outside this audit's scope, per owner instruction.

## Confirmed issue and correction

Migration 0035 seeded four reminder slots (Friday 20:00, Saturday 20:00, Sunday 16:00 and Sunday 19:00 Lagos time), while the public schedule and administrator UI describe Sunday 20:00 and Monday 00:00 Lagos time. This mismatch could cause reminders to be scheduled at unexpected times on a fresh install.

Migration 0040 corrects only the exact untouched seed value to Sunday 20:00 and Monday 00:00. If an administrator has already changed the schedule, the migration leaves their custom configuration unchanged.

## Code paths reviewed

- Public page checks `GET /api/grdpc` and only exposes the WhatsApp subscription link when the configured phone is valid.
- Subscription instructions require an explicit `GRDPC SUBSCRIBE` consent command and support `GRDPC STOP`.
- Admin API requires Administrator access to read and Deputy Super Administrator access to save; settings validation constrains schedule slots, template, phone, and daily budget.
- Reminder dispatch is driven by the Worker's one-minute cron, uses idempotency uniqueness for recipient/slot, and limits each invocation to 20 recipients.
- Unit tests cover Lagos time conversion, Monday midnight, next-prayer calculation, invalid configurations, paused sending, and explicit opt-in/opt-out.

## Verification status and limitations

This is a source-level audit plus a targeted database migration correction. The connected GitHub interface can inspect and edit repository files, but this session does not provide a runnable checkout, browser automation session, iOS/Android hardware, or access to the production WhatsApp/Cloudflare credentials. Therefore no claim is made that the full test suite was executed, that the migration was applied to a database, or that real push/WhatsApp delivery was verified.

Before deployment through the separate account, run `npm ci`, `npm test`, `npm run check:frontend`, `npm run check:api-contract`, `npm run check:links`, and the repository's deployment preflight in the intended staging environment. Apply migrations to staging, then test reminder opt-in/out, exact Africa/Lagos slot boundaries, duplicate prevention, daily budget limits, provider failures, and administrator authorization. Validate responsive layouts and keyboard/screen-reader access in current Chrome/Android, Safari/iOS, Firefox, and Edge/desktop; actual device delivery needs a real opted-in test number and approved Meta template.
