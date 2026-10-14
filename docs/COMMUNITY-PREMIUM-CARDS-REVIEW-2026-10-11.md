# Heavenly Key Global Community — premium visual review (11 October 2026)

Status: **DRAFT ONLY — no live deployment, no Waiting Room promotion, no automatic publication.**

## Scope
- Work only in `aoemeta247-cell/All-Nations-For-Christ-Outreach`.
- Add 12 sapphire/amethyst, wine, gold, emerald and light editorial signature palettes after the first 12. Retain original card-0 through card-575 identity and layout, enabling **1,152 combinations** (24 palettes × 6 layouts × 8 patterns).
- Add an accessible picker of 12 premium card previews; keep normal pattern choices, manual text editing and saving drafts.
- Support 1:1 square and 1:1.1 slightly tall Facebook card shapes (CSS aspect ratios 1 and 10/11), keeping auto/portrait/landscape.
- Improve Community home navy/gold background with refined purple and wine touches. Do not replace photographs, logos, people or words.
- Keep all artwork in CSS; message text remains readable. Avoid extra network images and decorative click-blockers.

## Owner-controlled release path
1. Review this draft pull request and automated checks; make further edits here if requested.
2. Owner explicitly approves the design and merging after tests pass.
3. Merge only after owner approval. The **Account 4 draft-review gate** must prevent auto-forwarding unapproved AI work into the Waiting Room. This draft is not a production approval proof.
4. Use Account 4 controlled preview and signed owner release process for Account 3; do **not** trigger `cloudflare-global-community.yml` without successful exact-SHA preview and approved proof.
5. After any production release, test public home, mobile navigation, post composer, existing cards, new cards and member sessions without altering account data.

## Checks
- `cd global-community && npm run check && npm run frontend && npm run test:design`
- Verify that old saved cards render unchanged, invalid IDs fail safely, new cards save and preview correctly, and no input controls are blocked.
- No changes to Cloudflare D1/KV/R2 resource identities, permissions, migrations, deployment workflows or authentication.
