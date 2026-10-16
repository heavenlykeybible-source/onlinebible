# Account 1 corrections — 16 October 2026

Development only: `draft/radio-logo-before-deploy`. No production merge or deployment authorized or performed.

## Corrections

- Removed the unwanted assistant implementation and its styles from the Account 1 CMS runtime. The former shared footer loader also created a duplicate radio link, changed navigation, replaced footer content, and loaded another CMS runtime; these automatic replacements are retired in this website copy.
- Account 1 pages use a separate `account1-cms-runtime` asset name so the portal router cannot substitute Account 4's old shared assistant implementation. Published CMS content and visual editing remain available.
- Preserved the existing approved assistant portrait asset, removing requests for the nonexistent `assets/ministry/approved-online-assistant.webp`. Chat opens, closes, displays Typing…, and retries one server failure within the existing timeout. Approved controls are excluded from CMS edits.
- Floating Faith of Our Fathers Radio retains playback, volume, mute, minimize, close and drag behavior. Its wine-red/gold/white player and fire symbol render without relying on emoji fonts. It does not initialize on the dedicated radio page.
- Cleanup targets explicit retired element IDs, never text phrases or the approved assistant.
- About Us and Resources are dropdown controls on the homepage and existing inner-page navigation. Menus overlay beneath their headings, close on outside click/Escape, and stay within viewport bounds. Existing destinations remain.
- Preserved the homepage five-column footer and app emblem. Gallery cycles through all six outreach photographs available in this branch. Share stays beside legal links. CMS footer updates preserve legal/social controls and replace credits instead of duplicating them.
- Blog grid uses 5/3/2/1 columns, with a tablet breakpoint at 900px. Mandate content and Mark 16:15 remain intact.
- Versioned changed asset references and advanced the service worker cache namespace.

## Text import

Source: `aoemeta247-cell/All-Nations-For-Christ-Outreach`, current `main`, `heavenly-key-website/pages/`.

Imported authored headings, paragraphs, lists, scripture and content links from `about`, `the-ministry`, `what-we-believe`, `meet-the-pastor`, `ministries`, `partner`, and `contact`. The homepage's The Ministry destination remains `about.html`; both ministry pages carry their corresponding source content. Kept the current approved page titles, content containers, header/footer layouts and assets. Did not import old page designs, scripts, form controls, modal controls or navigation furniture. Automated content comparison confirmed every extracted source content block appears in its destination.

## Verification

- JavaScript syntax checks passed for all changed scripts.
- Chromium tests passed at 1440, 1024, 768 and 390px: approved chat and radio visibility; Typing… and response; audio playback using a generated local WAV fixture; volume; minimize/close; no duplicate assistant after refresh; independent homepage dropdown layout; gallery rotation; no missing homepage assets, page exceptions, or horizontal overflow.
- Final regression at 1440 and 390px passed after all corrections: one simulated provider failure followed by successful chat response; all seven imported pages; inner-page dropdowns and content width; single updated footer credit; dedicated radio-page exclusion and mobile menu toggle.
- Desktop and mobile screenshots reviewed locally, including imported content pages, the homepage footer, and both approved launchers.
- Live public AI endpoint: first request returned provider 503 UNAVAILABLE, subsequent request returned HTTP 200 with a real welcome response. This external service can still experience provider outages; client retry cannot guarantee upstream availability.
- Live radio programme endpoint returned HTTP 200 with `mode: offline` and no items. Player controls were verified with test audio; live broadcast audio cannot be verified until a programme exists.
- No Cloudflare settings, credentials, main branch, production website, or other account code changed.

Reproduce UI checks with Playwright installed: `node scripts/account1-handover-ui.cjs`. Optional: set `HK_CHROMIUM_EXECUTABLE` and `HK_TEST_WIDTHS`. API responses are stubbed for deterministic browser checks; the live service checks above are separate. The test starts its own local server on port 8765 and generates audio in memory.

Production readiness remains subject to owner review/authorization and availability of an actual radio programme. No deployment is included in this change.
