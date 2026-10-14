# Messaging and groups audit — 5 October 2026

Scope: current member-to-member text messenger and group creation/management. Voice calls, video calls and voice notes remain disabled.

## Corrected
- Chat reads, sends, acceptance and inbox listing recheck participant scope, both account statuses and blocks.
- Message retry IDs are unique per sender/conversation. Retrying a saved message does not insert another copy, including after a notification failure. Reusing an ID for different text is rejected.
- Messages exceeding 3000 characters are rejected instead of silently truncated.
- Concurrent conversation requests use a conditional insert to avoid duplicate conversation rows.
- Group request management requires an active group.
- Administrator removal checks the target role in the update itself: a concurrent promotion cannot allow an administrator to remove a manager.
- A declined chat request is labelled unavailable rather than falsely labelled requested.

## Validation
- Frontend and backend syntax checks passed.
- SQLite regression test applies all additive migrations and exercises actual service functions.
- Verified: pending-chat denial, outsider denial, recipient-only acceptance, held-message exclusion, duplicate retries, saved-message/failed-notification retry, direct block with stale conversation status, suspended recipient denial, private roster protection, group approval, manager-only posting, role permissions, removed-member rejoin denial, owner protection, leaving and hidden-group discovery protection.

## Limits
- Production deployment and browser/device tests are not confirmed while GitHub jobs remain queued.
- Text chats use 15-second polling and return the latest 100 messages. This is not instant push delivery or complete searchable history.
- No end-to-end encryption or read receipts. No attachment uploads, voice notes or calls.
- Group member listing returns up to 100 active members.
- Group owners cannot leave or transfer ownership in this release.
- Removing a member prevents automatic rejoining; a reinstatement interface is not implemented.
- Hidden groups cannot accept new joins in this release.
- Group manager-only posting controls new posts; approved members can react and reply.
- Notification failures can delay a notification even though a message was stored.
- No large-scale load test or worldwide legal-compliance certification is implied.
