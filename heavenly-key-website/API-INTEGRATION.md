# API-INTEGRATION.md
**Heavenly Key Public Website — Current API Integration Guide**

## Production contract
- Canonical website: `https://www.heavenlykey.org`
- Canonical API: `https://api.heavenlykey.org`
- Account 1 Worker is configured with a Custom Domain for `api.heavenlykey.org` and keeps `workers.dev` enabled as a fallback.
- CORS is implemented for the canonical website origin.
- `js/api-client.js` and `js/main.js` both use the canonical API URL.
- CI and production deployment run `check:api-contract` so frontend endpoints cannot silently drift away from Worker routes.

## Live website endpoints
Public forms:
- `POST /api/contact`
- `POST /api/newsletter`
- `POST /api/partner`
- `POST /api/public/prayer`
- `POST /api/public/testimony`
- `POST /api/decisions`

Public reads:
- `GET /api/testimonies`
- `GET /api/devotionals`
- `GET /api/events`
- `GET /api/bible/verse-of-day`
- `GET /api/bible/memory-verse`

Unified blog endpoints are now defined in the Worker source and require migration `0040_blog_publishing.sql` before deployment:\n- `GET /api/blog/posts` — public list of published articles\n- `GET /api/blog/posts/:slug` — public article detail\n- `GET /api/admin/blog/posts` — authenticated admin article list\n- `POST /api/admin/blog/posts` — create draft, scheduled, or immediately published article\n- `POST /api/admin/blog/posts/:id/publish` — publish a saved draft/scheduled article\n\nThe homepage preview, footer preview, and internal `/blog/` pages read from the first-party blog API. The legacy Blogger feed is only a temporary fallback while legacy teaching content is migrated. Publishing an article can enqueue text-and-link announcements to connected Facebook, X, and LinkedIn accounts. Instagram, TikTok and YouTube are deliberately not reported as automated destinations by this text-only blog integration; they require media-specific flows and/or provider approval. Scheduled article publication runs in the Worker scheduled handler.

## Security
- Public intake submissions are server-validated, rate-limited, encrypted with AES-256-GCM and stored in D1.
- Decrypted public intake data is restricted to Deputy Super Administrator or higher.
- Member community submission routes remain separate and authenticated.
- Website API responses include security headers and canonical-origin CORS.
- API-derived URLs must pass `sanitizeURL()`; text interpolation must use `escapeHTML()`.

## Deliberately not connected
- Volunteer sign-up remains a mock adapter until a real volunteer API is approved.
- Event RSVP remains a mock adapter until a real registration API is approved.
- Counselling remains intentionally withheld pending safeguarding approval.

## Deployment rule
A production deployment must pass:
1. deployment preflight;
2. website/API contract check;
3. architecture regression check;
4. TypeScript check;
5. unit/integration tests;
6. Wrangler dry-run bundle compilation;
7. remote D1 migrations;
8. Worker deployment.

Do not bypass these gates merely to make a deployment turn green.
