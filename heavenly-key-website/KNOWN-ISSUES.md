# KNOWN-ISSUES.md
**Honest list of gaps, limitations, and deliberate omissions in the
Release Candidate.** Nothing here is hidden — if it's not fixed, it's
because it's out of scope, blocked on AI 1, or a decision that needs the
Project Lead rather than AI 2.

## 1. Deliberately Not Built: Counselling Form
AI 1's master spec (Phase 4) lists Counselling as **"UI, schema, API
only"** and explicitly says: *"Stop before implementing safeguarding
workflows until approved."* A public-facing form that invites personal
disclosures for pastoral counselling is exactly a safeguarding-adjacent
workflow — collecting sensitive personal content from potentially
vulnerable people needs a moderation/escalation/safeguarding process
behind it, not just a contact form.

**Decision:** No counselling request form exists on the website. The
only counselling-related content is the existing safe routing on
`pages/about.html` ("For Counseling & Prayer: WhatsApp or Call
+234 706 709 2254") — a direct human contact channel, not a data-collecting
form. **This is flagged as a halt condition per the standing project
rules ("a safeguarding decision is required") — building a real
counselling intake form needs explicit Project Lead + AI 1 sign-off on
the safeguarding workflow first, not just an API endpoint.**

## 2. Mock-Adapter Forms (UI complete, not connected to anything)
Per the governing rule in `API-INTEGRATION.md`, these forms are fully
built and accessible but deliberately do not call any endpoint, because
AI 1 hasn't published one:
- **Volunteer sign-up** (`pages/partner.html`, modal) — assumes a future `/api/volunteers`, not in AI 1's Section 5 list.
- **Event Registration/RSVP** (`pages/events.html`, modal) — assumes a future registration sub-path on `/api/events`, not published.

Both show an explicit "not connected yet" message on submit rather than
pretending to succeed.

## 3. Content sources and widgets
The homepage's **Recent Blog Posts** preview and footer list now load from the public Blogger JSON-in-script feed at `blog.heavenlykey.org`; they do not use an invented `/api/blog` endpoint. If the feed is unavailable or blocked by CSP/network policy, the homepage shows a fallback link to the official blog.

Other content widgets without a published API contract (including Featured Sermons where applicable) must remain static or clearly indicate unavailable data. Production JavaScript must not call unimplemented `/api/sermons` or `/api/blog` endpoints. Verify each widget against the latest HTML and script source before treating this historical note as a complete inventory.

## 4. Two Open Content Conflicts (need Project Lead decision, not a fix)
Documented in `CONTENT-INTEGRATION-REPORT.md` §2:
1. Homepage hero wording — approved spec copy vs. the real site's actual "REVIVAL, HOLINESS, POWER!" copy. Currently running the approved spec version.
2. Headquarters address — "Warri, Delta State, Nigeria" (early screenshot) vs. "Nigeria, Africa" (offline export, no street address). Currently showing "Nigeria, Africa."

## 5. Legacy teaching-article migration incomplete
94 real teaching articles exist in the offline export. The current homepage
preview is a **live, five-post Blogger feed**, which is separate from
migrating those 94 legacy teaching articles into the website's own
design system. The legacy migration remains outstanding and is logged as
a Legacy Review item in `PROJECT-CHECKLIST.md` §7. Do not mark those
94 articles migrated based only on the homepage Blogger feed.

## 6. Two Stat Categories Still Placeholder
"Bibles Distributed" and "Partners & Supporters" on the homepage stats
bar have no real source number in the offline export — left as
`[PLACEHOLDER]` rather than invented. See `CONTENT-INTEGRATION-REPORT.md`
§3.

## 7. PWA Limitations
- Icons were generated with PIL (text-on-circle), not real ministry
  artwork — a placeholder in the same spirit as the hero illustration,
  swap when official brand assets exist.
- `ASSET_VERSION` in `service-worker.js` must be manually kept in sync
  with the `?v=` query string used in every HTML file's CSS/JS links
  (`build_pages.py`) — there's no build tooling to automate this. If they
  drift, the service worker will precache stale or 404 the wrong
  versioned URLs.
- The offline "cache visited Bible chapters/devotionals/articles"
  behavior described in the Priority 4 request is architecturally
  planned (`API-INTEGRATION.md` §7) but not implemented — it needs real
  API response shapes to key the cache correctly, which don't exist yet.
- Install prompt (`beforeinstallprompt`) only fires on Chromium/Android;
  there is no equivalent on iOS Safari. This is a platform limitation,
  not a bug in this build.

## 8. Never Tested in a Real Browser
Everything in `TESTING-CHECKLIST.md` §2–5 — this build environment has
no browser, screen reader, or device to verify against. All automated
checks that *can* run here (tag balance, duplicate attributes/ids) do
run on every rebuild and currently pass.

## 9. CORS and public API configuration
CORS is implemented for `https://www.heavenlykey.org`, and the production Worker is configured for the canonical `api.heavenlykey.org` Custom Domain. Member authentication remains separate from anonymous public intake.

## 10. Form validation
Public intake now has server-side validation, rate limiting, encryption and D1 persistence. Client-side validation remains for user experience but is not trusted as the security boundary.

## 12. Cumulative 320px Horizontal Overflow (non-blocking, tracked for future work)
Three pages — `index.html` (24px), `pages/missions.html` (30px),
`pages/radio.html` (29px) — show small horizontal overflow specifically
at a 320px viewport width, confirmed via real Chromium/Playwright
measurement (see `FINAL-APPROVAL-PASS.md` §3). Zero overflow at 375px
or wider on any page, including these three. Root-cause investigation
(causally toggling the mobile nav, top strip, header, footer, and every
top-level content section off individually) ruled out any single
element as the sole cause — it appears to be a cumulative sub-pixel/
rounding effect across several sections rather than one clear defect.
**Explicitly approved as non-blocking** by the Project Lead (see
`FINAL-APPROVAL-PASS.md`, Project Lead Addendum) since it falls outside
the authorized remediation scope that produced it, was not a
regression, and was discovered only through testing broader than what
was requested. Tracked here as a maintenance item for a future pass.

