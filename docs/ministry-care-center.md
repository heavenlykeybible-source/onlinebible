# Heavenly Key Ministry Care Center — Public Sites (Account 1 + Account 3)

**Scope:** This is the **approved small floating Ministry Care Assistant**, not a homepage redesign. The production CMS engine, homepage sections, Account 4 deployment center, community data, and radio/broadcast engines remain untouched. The feature is independently authored in `ministry-care.js`, `ministry-care.css` and local face/logo images, and connected through a script loader on public pages.

## Visitor behavior

- **New anonymous visitor:** small launcher with modest assistant portrait at the edge; once per browsing session a single soft visual invitation briefly displays the animated message **"How may we be of help to you today?"**. The entire panel never opens without a click.
- **Exploring, returning, or interacted visitor:** teaser becomes a quiet compact button without repeated automatic animations, remembered only in same-browser session storage; no tracking service or advertising pixels.
- **Signed-in Global Christian Community member:** small portrait-only sidebar launcher, gentle one-time glow and no interfering large popup. On opening, greet by the person's own display name. If the person chose a title in a separately approved addressing preference flow, use their self-selected greeting rather than guessing gender, clergy credentials or status.
- **Accessibility:** buttons keyboard-operable; Escape minimizes; reduced-motion setting disables cues; message links open safely in a new tab; never auto-start audio; typing text is not announced letter-by-letter.

## Expanded guide

Compact wine-red/royal-blue/gold assistant using the approved modest woman's portrait, official HKEM logo and country **flags only**.

Only six approved actions:

1. Join Community
2. Prayer Request
3. GRDPC
4. Listen to Radio
5. Learn More About the Ministry
6. Speak with Evangelist Emmanuel

The user can type a short question. **This release is a local, rules-based navigation assistant, not a live generative-AI endpoint.** It redirects to existing ministry/community resources for salvation, prayer, messages, radio, help, login, Spaces, Groups and the Statement of Faith. Do not describe it as human live chat or falsely promise a reply. User-entered text is not sent to a server or saved. To contact ministry personnel, follow the actual contact link.

## Preventing regressions

- The new module uses only `#hk-ministry-care`-scoped CSS. It never changes existing CMS tables, website design, page content, page navigations, post feeds, or radio playback.
- It gently avoids overlapping the existing draggable floating radio by repositioning vertically on the main ministry site.
- Community member authentication is communicated as a read-only `hk-care-session` browser event after the existing `/api/me` call. The assistant receives no session keys and has no account privileges.
- Main website public pages without the shared footer use a single defer script tag; those using `site-footer.js` receive it from a shared loader. Community pages each load it with the same module. **Admin and scheduled publishing controls deliberately do not mount it to avoid conflicts with sensitive editor screens.**
- `scripts/test-ministry-care.mjs` and required GitHub CI checks validate exact UI controls, first-run behavior, real local assets, both-site parity, CMS and radio isolation, and public-page coverage.
- Production remains **owner-approval-only**. Merge/release only after the authorized operator validates a staging build on desktop and mobile, checks panel placement alongside the radio, verifies every link, and confirms the existing homepage and community feed render unchanged.

## Known limits / future enhancements

- The component is not yet a full AI-service chat backed by a ministry-grounded knowledge base. Such a service will need an approved read-only knowledge API, strong theological oversight, anti-abuse policies, secure retention/no-data-sharing design, and human escalation.
- The portrait uses the approved small web-friendly avatar asset, not an interactive animation or human video.
- Cross-site dismissal/visit preferences are scoped to the same browser session and site origin; they are not synchronized across accounts without opt-in.
