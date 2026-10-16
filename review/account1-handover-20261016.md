# Account 1 corrections — 16 October 2026

Working branch: `draft/radio-logo-before-deploy`. The owner authorized Account 1 deployment on 16 October 2026 at 17:00 WAT. No production deployment has occurred; the Waiting Room stopped because the repository approval secret is missing.

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

## Owner-requested individual page designs

The owner subsequently authorized distinctive designs for each imported content page, with all visible text at least 14px and some bold emphasis.

- About: green introduction, broad story panels and an editorial faith collection.
- The Ministry: real outreach photography, a wine-red mission panel and a numbered vision.
- Statement of Faith: individually framed beliefs beneath a wine-red title banner.
- Meet the President: actual ministry portrait beside an elegant biography panel.
- Ministries: scripture introduction and a responsive collection of ministry tiles.
- Partnership: scripture introduction, prominent giving details and service panels.
- Contact: distinct headquarters, email, telephone, social and partnership cards.

All seven pages use the approved green, wine-red, gold and white palette. The homepage is unchanged. Existing navigation destinations, page wording, assistant, radio and footer remain available. Selective bold emphasis was added without changing any words.

Validation: exact word-token comparison confirmed all imported content remains in order. Desktop (1440px) and mobile (390px) Chromium checks passed for every redesigned page, including an audit of rendered text confirming no visible text below 14px, no horizontal overflow, working dropdowns, assistant/radio regression checks, and visual screenshot review. The shared stylesheet includes responsive layouts and reduced-motion support. Reproduce with `node scripts/account1-page-design-ui.cjs` and the same Playwright setup described above.

These page designs are saved to the draft branch only; they have not been merged or deployed.

## Transparent homepage portrait and right-side companions

The owner requested the pastor photo from Meet the Pastor in the homepage president message, with a transparent background and both approved controls to its right.

- Background-extraction edit created with the built-in image-generation tool from the existing `pastor-emmanuel-adiohwo.jpg` reference. Prompt: remove only the black background with actual alpha transparency, preserving the pastor's identity, blue suit, yellow-orange shirt, microphone, hands and pose; no added objects or invented body parts. Saved project asset: `heavenly-key-website/assets/ministry/pastor-emmanuel-transparent.webp` (RGBA, alpha extrema 0–255), encoded as WebP for website delivery.
- The homepage president section consumes this transparent asset. The original portrait file and Meet the Pastor page remain intact.
- The existing approved AI assistant and radio controls are grouped vertically immediately to the right of the portrait on desktop, tablet and mobile. Existing panels open within viewport bounds. Opening chat minimizes the radio surface without stopping audio; opening the radio collapses chat.
- Corrected stacking so the open radio player cannot be blocked by the assistant launcher. Corrected two existing low-contrast text treatments within this same president section.
- Chromium verification passed at 1440px, 768px and 390px: true alpha asset, controls positioned right of the photo, no horizontal overflow, chat Typing… and response, audio playback and minimize, and no JavaScript exceptions. Screenshots reviewed on desktop and phone.
- Test: `node scripts/account1-president-companions-ui.cjs` (Playwright; optional `HK_CHROMIUM_EXECUTABLE`). Deterministic test responses/audio only; no live deployment is part of this update.


## Final owner corrections and deployment attempt

- President invitation (“Join, support and partner…”) now renders black on its light background.
- Footer share label is now “Share to Bless Others”, centered on its own final row of the black secondary footer. Share behavior remains unchanged.
- Restored existing CMS script entry-point references required by the immutable production compatibility gate. These legacy scripts return without mutating the current approved television layout when their legacy selectors are absent.
- Updated visual-CMS regression assertions to the approved current homepage and current public-page runtimes. The eight local compatibility tests passed, and browser regression passed at 1440, 768 and 390px, including explicit black-text and centered-share assertions.
- The connected GitHub app successfully launched the existing Account 4 Waiting Room workflow for Account 1: https://github.com/heavenlykeybible-source/onlinebible/actions/runs/38929221853 . The workflow stopped at its first credential check. Cloudflare Account 4 token and ID are present; `HKEM_CONTROL_TOKEN` (mapped to `REVIEW_SEED`) is absent. No preview resources were provisioned, and nothing was deployed.
- The isolated staging trigger workflow only dispatches the existing main-branch Waiting Room for Account 1. It cannot dispatch production or sign owner approval.
- Browser-based GitHub dispatch could not access this private repository with its saved browser profile. Separately, automatic approval review blocked navigation to the recovery-control owner portal, citing private administrative access outside the isolated staging task. No alternate path was used to enter that blocked portal.
- Next action: restore the existing owner-approval secret through the authorized Account 4/GitHub setup, stage the latest exact candidate again, review its temporary preview and complete the existing signed owner approval. Do not generate a substitute signing secret or bypass these gates.

## Verified production releases — 16 October 2026, 16:26 UTC

The owner subsequently authorized direct Account 1 deployment and separately requested Account 4 automatic uploading/deployment. This supersedes the earlier pending-staging status above.

- Account 1 release succeeded: https://github.com/heavenlykeybible-source/onlinebible/actions/runs/38931610846 .
- Published 190 static website assets from exact tested candidate `4a7838c73427c2d1e183c54b4efa439e76633421` directly to existing Account 1 Worker `heavenlykey`. No merge to main, Account 4 dependency, database migration, credential rotation or other-account release was used.
- The earlier full-Worker repository baseline found pre-existing protected-file differences. Those files were not deployed and the baseline was not modified. The assets release re-uploaded the running Account 1 compiled module byte for byte, SHA-256 `09b3be0d41f8f0d47e4b329c15044d27fbce142ffaae8d5b9fe9246de530755d`, and preserved existing bindings and checked settings. Private rollback backup saved in the successful run.
- Live byte checks passed for homepage, president CSS/JS, transparent portrait, Meet the Pastor and Partner pages.
- Live browser: both dropdowns open; approved chat opens, displays Typing… and returns a real ministry response; radio opens with volume/minimize/close; no scheduled programme is currently available; gallery moved from image 1 to image 6 automatically. President portrait and black invitation visually verified.
- Account 4 existing automatic workflow `deploy-account4-control-room.yml` already listens to relevant `main` changes in `account4-control-room/**`, `cms-public/**`, `shared-cms/**` and its own workflow file. It remains enabled; unrelated website pushes do not deploy Account 4.
- Owner-authorized Account 4 run succeeded: https://github.com/heavenlykeybible-source/onlinebible/actions/runs/38931649924 .
- Control Room version `fb7ebc94-aea6-438b-a7ca-4fb8a18fa0b8`; public CMS version `ff354579-39fc-4bf2-a839-c2a2a17dfe98`; owner dashboard version `7754e0c1-7c73-4147-9171-81b43ab991ef`.
- Account 4 install/typecheck/tests, fixed existing resource checks, non-destructive CMS migration, live CMS health, real AI inference, private Access gate and unauthenticated editing API rejection all passed. `https://control.heavenlykey.org/` visually opens the Website Control Room.
- No recovery-control Worker was found in Account 4. It was not created or substituted for the existing deployed CMS/owner dashboard.
