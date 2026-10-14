# Global Community Design Cards

Members can publish a Design Card, an Article / Long Post with a title cover, or a YouTube/Facebook Video Link with a caption. The same composer and post renderer are used in Fellowship, Groups and Spaces. Home, Prayer and Missions use the same renderer.

The catalogue supplies 576 reusable combinations (12 colour themes × 6 layouts × 8 patterns). Nineteen separate subject categories include Business, Ministry, Faith, Revival, Prayer, Rapture, Eternity, Salvation, Jesus, Repentance and The Gospel. Categories suggest a colour theme; members can change the theme, layout, pattern, shape, font size, alignment and decoration.

Design Cards store text and validated settings, not raster image files. New community uploads and file attachments are rejected on the server, including previously registered pending uploads. Existing records and legacy media are retained by the additive migration. Cards and video captions allow 10,000 characters; articles allow 30,000 with a required title. Long content expands with Read more and remains selectable.

Members can save, restore and discard device-local drafts. Draft keys are scoped by account and posting context. The author can edit an available published post; edits pass validation and text moderation again. Changes preserve post identity, author, Space/Group and visibility.

Video links accept only HTTPS YouTube/Facebook video URLs. The external player loads only after Play is clicked. Original links remain available if embedding is disabled, the video is private/deleted, or provider playback fails. Facebook short links open the original. Text moderation does not inspect the contents of externally hosted videos; member reporting and moderator review remain necessary.

Every post displays “Keeping this community healthy is everyone’s responsibility,” Community rules and Report this post. Signed-in members select a reason and optional explanation. Reports enter the existing moderation queue. Moderators can dismiss a report or remove its post from the feed; actions are recorded in moderation_events. Reports do not trigger automatic removal.

## Validation

- `cd global-community && npm run buildcheck`: TypeScript, both frontend scripts, eight design/link/validation regression tests and preflight.
- `vitest run test/unit/global-community-contract.test.ts`: six community contract tests, including direct rejection of uploads.
- All five SQLite/D1 migrations applied successfully locally.
- Local real-Worker API checks: publication, long articles, video canonicalisation, upload rejection, invalid design/link rejection, text moderation, owner-only editing, report creation, moderator access control and reported-post removal.

Deployment uses the existing Account 3 workflow. Migration 0005 must run before the new Worker starts. No changes to the ministry command centre or Accounts 1/2 are required.

## Social feed layout

The Home, Fellowship, Group and Space feeds share a compact composer with an initials avatar, the life/destiny/faith posting prompt and Design Card / Article / Video Link shortcuts. The full editor opens in an accessible native dialog; closing it retains unfinished text during the page session. Design customisation is expandable. Posts use an author row, concise metadata, readable content and a smaller reaction/action area. All existing reactions remain available through More reactions.

Home puts the composer above the feed, with navigation on the left and spiritual/discovery content on the right on large screens. Small screens use a single column. Groups and Spaces keep their own context when publishing or refreshing. The visible identity is Heavenly Key Global Christian Social Community.

Local browser checks passed for mobile/desktop widths, modal open/close, shortcuts, draft restore, publish/edit/report, group-specific publishing, single-feed refresh and absence of page errors.

The Groups directory uses the same social layout, with group discovery in the main column and group creation in an expandable sidebar panel. Additional local checks confirmed Space publishing context, unfinished text on editor close/reopen and guest routing to sign-in.
