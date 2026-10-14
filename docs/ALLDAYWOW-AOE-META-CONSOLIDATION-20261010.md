# AllDayWow → AOE Meta recovery and consolidation (10 October 2026)

## Source authority

- Historical GitHub: `alldaywow247-ops/heavenlykey`, reference `60c4487831a4065873c23e605a7dd08f4981ca16` (6 October 2026).
- Current development authority: `aoemeta247-cell/All-Nations-For-Christ-Outreach`, based on `main@915c451829c86a969e56c91031b51f92ce7817e3` (10 October 2026).
- Mobile App / Account 5: separate AOE repository `aoemeta247-cell/heavenly-key-mobile-app`.
- This recovery is a review branch only, NOT production deployment, merge, database change or member migration.

## Inventory checked: old vs newer main

| Area | AllDayWow tracked files | Files in current AOE Meta matching path | Byte-identical files | Paths changed in AOE | Old-only assets |
|---|---:|---:|---:|---:|---:|
| Main website | 101 | 101 | 77 | 24 | 0 |
| Global Community | 64 | 58 | 38 | 20 | 6 obsolete community portrait PNG variants |

- AOE Meta has 131 website files and 66 Community files. Its main website and Community have added features since the old project.
- The six PNG variants only found in AllDayWow are `community-network-foreground.png`, `community-network-headwrap.png`, `community-network-natural-portraits.png`, `community-network-portraits-diverse.png`, `community-network-portraits.png` and `community-network-tailored.png`. AOE's active community app does not reference them; it now uses `community-network.svg`. These obsolete ~12MB assets were NOT copied into production-facing public assets.
- Comparisons of `global-community/public/app.js` showed all 78 named functions from AllDayWow's application present in AOE's current version, plus newer `mountReferenceFrame` and `openHeavenlyKeyAi`. This is structural evidence, NOT a guarantee of every interactive behavior.
- Current AOE adds Community AI search assistance, AI writing help in post composer, `/api/community-ai` backend handling, privacy checking and a new site/community Ministry Care assistant. Do not overwrite the newer `app.js`, `styles.css`, `src/index.ts`, auth, database or settings with historic sources.

## Recoveries in this review branch

1. `heavenly-key-website/index.html` now contains the five-column **SPIRITUAL CAUTION! — END-TIME HAS COME** warning **immediately before the footer**, after the existing Scripture banner.
2. The sections warn that religious titles or church membership do not themselves guarantee salvation; exhort repentance, prayer, love and fear of God, watchfulness and preparation for eternity. They preserve the historic AllDayWow "Pray Hard, Keep Watch, Stand Firm..." theme.
3. Preserved exact historical source (clearly marked archival, not active) at `recovery-archive/alldaywow-homepage-original-20261006.source.txt` and `recovery-archive/alldaywow-community-original-20261006.source.txt`. This protects the older rich homepage layout and older Community logic for selective future use without rolling AOE backward.
4. Added `test/unit/homepage-community-recovery.test.ts` to assert pre-footer position, five columns, and preservation of the radio, assistant, and Community AI entrypoints.
5. No change to old AllDayWow repository, the currently active Community application, Account 4 owner security, Cloudflare identifiers, existing D1/R2/KV state, CMS data, and Account 5 app.

## Material work that must not be misrepresented as complete

- The large old premium homepage has many sections missing from AOE's slim current homepage; source is archived so those can be selectively reconciled without reverting modern design. **Not all old visual components have been reactivated.**
- Browser testing and any production content changes require the exact candidate to pass GitHub CI and Account 4 review and owner-signed release workflow.
- The complete 66-book KJV and discipleship experience resides in AOE's separate unmerged `integration/discipleship-app-safe-20261010` branch; the Account 5 standalone application currently hosts a starter shell. This homepage recovery does not silently merge that integration or claim it is live.
- Generation-based Community AI requires an actual approved provider binding; presence of the user interface and backend route alone does not certify responses.
- The spiritual-caution copy was recovered and organized into five scripturally referenced reminder columns, but final editorial wording and placement should be reviewed by the ministry owner against the ministry's established statement of faith and original published content.
- `heavenlykey.org` is a separate existing live site from Account 1 Cloudflare's `workers.dev` URL; a code release does not automatically repoint DNS/custom-domain routing.

## Release recommendation

Review the visible recovery source, confirm no CMS-published homepage sections override its output, run all account-specific tests and a live mobile/desktop preview, resolve any failures, then submit exact-SHA staged release to Account 4 for the owner's approval. Never bypass trusted gates or replace user data.
