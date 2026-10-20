# Heavenly Key Bible Reader — Audit Record

**Branch:** `feature/simple-bible-sharing-20261020`  
**Scope:** KJV reader, Bible study aids, reading routine, responsive layout, offline shell and doctrinal framing.  
**Status:** Source-level fixes and regression checks committed; full browser/device test execution and final pastoral approval remain outstanding. This document must not be read as a certification that every device has passed.

## Doctrine sources used for comparison

- Heavenly Key Evangelistic Movement, **What We Believe**: https://heavenlykey.org/what-we-believe/
- Deeper Life Bible Church, **Our Beliefs** (public church site): https://www.deeperlifeha.org/our-beliefs/
- Ask Kumuyi AI: https://askkumuyi.ai/ — a separate external service. This project has no verified API connection to it, and must not imply endorsement or that its answers have been reproduced.

Scripture remains the primary authority. Dictionary entries, cross-references, reading-plan reflections and AI-generated explanations are study aids, not Scripture. Do not describe the Bible reader as officially affiliated with or certified by Ask Kumuyi AI or Deeper Life Bible Church.

## Changes made in this audit

- Removed the remaining Audio Bible link and its chapter-navigation URL update from the KJV reader.
- Removed the Audio Bible link from the Bible downloads navigation.
- Removed the deleted Audio Bible page/player/catalogue entries from the service worker's offline shell so a missing file does not break cache installation.
- Corrected Genesis 1 speaker-colour ranges so verses narrated by the author are not incorrectly coloured as direct speech from God.
- Changed the colour legend from “God the Father” to “God”, avoiding an identity claim not explicitly made in the annotated verse.
- Revised the baptism and sanctification definitions and added study entries for entire sanctification, Holy Ghost baptism, restitution, the Lord's Supper, personal evangelism and the Rapture, framed according to Heavenly Key's published statement of faith.
- Added regression checks for removed Audio Bible references, core doctrinal entries, viewport metadata, mobile breakpoints, fluid typography, touch-target sizing, safe-area navigation and accessible status announcements.

## Doctrine review points

The current study aid is framed to preserve these key positions expressed in Heavenly Key's published statement of faith and the Deeper Life doctrinal statement:

- The Bible is inspired and the final authority for faith and conduct.
- The Godhead: Father, Son and Holy Ghost.
- Jesus Christ's virgin birth, atoning death and bodily resurrection.
- Repentance, justification by grace through faith, and a life of obedience and holiness.
- Water baptism by one immersion in the name of the Father, Son and Holy Ghost.
- Entire sanctification as a definite act of God's grace subsequent to the new birth.
- Holy Ghost baptism, with the stated initial evidence of speaking a language not previously learned as the Spirit gives utterance; this must never be coached or manufactured.
- The Lord's Supper, restitution, personal evangelism, Christ's return and the Rapture position stated by the movement.

This is a consistency review of the current study aids, not a verse-by-verse theological certification of all 66 books or all reading-plan reflections. The KJV text itself must not be rewritten to force an interpretation. Cross-references and commentary should distinguish direct biblical wording from interpretation. The speaker-colour dataset explicitly remains partial and requires careful editorial review before being described as comprehensive.

## Device and functional test matrix still required

Run on real browsers/devices before calling the reader production-ready:

- Android: Chrome and Samsung Internet; portrait and landscape; narrow screens and large system text.
- iOS/iPadOS: Safari on iPhone and iPad; portrait/landscape, safe-area insets and text scaling.
- Desktop: Chrome, Edge, Firefox and Safari where available; keyboard-only navigation and zoom.
- Reader functions: all 66 books, first/last chapter boundaries, chapter changes, deep links to verses, search, bookmarks, copy/share fallback, font sizing and sermon-note persistence.
- Offline: service-worker installation, updating from the previous shell, explicit book download, offline reopen, and graceful handling when a download is missing or corrupt.
- Accessibility: visible focus, meaningful labels, sufficient contrast, status announcements and no horizontal overflow at 320 CSS pixels.
- Regression: run the existing frontend syntax/content checker and the app's `npm run check` locally. Do not trigger paid GitHub Actions or deploy as part of this audit.

## Remaining sign-off

1. Execute the source checkers locally without deployment.
2. Complete the browser/device matrix above; source inspection alone cannot establish real-device pass status.
3. Have Heavenly Key's responsible Bible teacher/pastor review the doctrine entries and reading-plan reflections against the movement's current approved Statement of Faith.
4. Re-check the source of the KJV compilation and applicable distribution rights before public release.


## Installation compatibility finding

The current web app manifest and Apple touch-icon link reference SVG-only icons. Some install surfaces, especially iOS/iPadOS Home Screen icon handling, are more reliable with a conventional PNG touch icon and raster 192px/512px manifest icons. This remains a compatibility risk to resolve before claiming fully verified installation on iPhone/iPad and all Android launchers. The present source-level check confirms that the referenced SVG files exist, not that every operating system accepts them as install icons.

## Device test record (not yet executed on physical devices)

| Device/browser | Result | Required verification |
|---|---|---|
| Android / Chrome | Not run | Install prompt or browser-menu install, launch icon, standalone display, reader navigation, offline reopen |
| Android / Samsung Internet | Not run | Add to Home screen flow, layout, downloads, offline reopen |
| iPhone / Safari | Not run | Share → Add to Home Screen, icon appearance, standalone launch, safe areas, font scaling |
| iPad / Safari | Not run | Home Screen install, portrait/landscape, split-screen and larger text |
| Windows / Chrome or Edge | Not run | Install action, standalone window, keyboard and zoom |
| macOS / Safari and Chrome | Not run | Add to Dock/install flow, icon, navigation and zoom |
| Firefox desktop/mobile | Not run | Browser fallback, responsive reader, search, bookmarks and sharing |
| Offline / airplane mode | Not run | Reopen previously saved book, navigate saved chapters, handle uncached books gracefully |
| Service-worker update | Not run | Install a new shell version and confirm saved Bible books/private stores remain intact |

The newly extended `npm run check` adds a full 66-book data integrity pass and PWA manifest/icon existence checks. It has been committed but was not executed in this session because the repository's local Node environment and physical-device browsers are not available here. Do not treat added checks as passing until someone runs them.
