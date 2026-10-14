# Backend audit continuation — 2026-09-27

## Changes completed

- Restricted media registration to Moderator+ so ordinary members cannot turn the platform into a general media-upload host.
- Restricted live-broadcast heartbeat to Moderator+ to prevent an authenticated member from keeping another broadcast alive by guessing a session ID.
- Enforced one active live-broadcast session at a time.
- Fallback live media must be stored, published, and license-approved before a live session can use it.
- Preserved the live title/fallback information in heartbeat status updates.
- Added immediate cleanup of live recordings after all associated distribution jobs are successfully sent/cancelled, unless the recording is explicitly kept.
- Restricted completion of assigned ministry tasks to the assigned worker.
- Approved Bible and hymn media are explicitly marked KEEP so the temporary 48-hour media cleanup cannot remove them.
- Restored the missing RBAC import in spiritual-resources routes.

## Verification

- 25 migrations replayed successfully in SQLite.
- 101 tables created.
- `PRAGMA foreign_key_check` is clean.
- Deployment preflight passes with placeholders explicitly allowed for local validation.
- TypeScript compiler parsing was run with Cloudflare type declarations unavailable in the sandbox; remaining diagnostics are environment/type-definition errors rather than errors in the changed distribution, Bible, hymn, or RBAC logic.

## Resource policy

The backend is intentionally being kept lean for Cloudflare Free: temporary media is cleaned aggressively, permanent media is limited to approved ministry resources, and unnecessary video-processing/clip-generation features are excluded.

## Remaining deployment gates

Real Cloudflare resources/secrets, a network-enabled dependency install and full Vitest run, live staging verification, and the actual provider credentials for automated social publishing are still required before production deployment.


## Additional hardening pass

- Media registration, direct media upload, and KEEP operations are now Moderator+ only, preventing ordinary community accounts from creating or retaining large objects.
- Multipart media endpoints were removed from the active router to avoid turning R2 into a large-file upload facility. The direct temporary upload path remains capped at 100 MB.
- Live heartbeat requires Moderator+ and preserves the broadcast title in cached status.
- Starting a live session requires no other active/reconnecting session; migration 0026 adds a database-level unique partial index so concurrent starts cannot create two active sessions.
- Live fallback media must be published and license-approved before use.
- Finalized live recordings are eligible for immediate R2 deletion after all linked distribution jobs are terminal, unless explicitly kept.
- The scheduled monitor remains every minute because the 30-second encoder heartbeat/10-minute reconnect design needs timely detection; heavier retention cleanup remains every 15 minutes.

Fresh audited source bundle SHA-256: `499d16f05af579398d75c9ac72f8d1f27ebffc7dbf78da16460c82f59e756d77`
