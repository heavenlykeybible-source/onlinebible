# Heavenly Key Global Christian Social Network

The network uses the existing Global Community account, database and authentication. It remains separate from the ministry command center and TalkMoney. The current colours remain until the owner chooses a preferred palette.

## Experience

- Wider reading column, four primary destinations, mobile navigation, author rows, contextual group links and post options.
- Compact composer with editable Design Cards, long Articles and linked videos; no photo or video uploads.
- Latest, Connections, Articles, Videos and Saved feeds. Server-side filtering and pagination load twenty posts at a time, with reaction totals fetched together.
- Native sharing or copy-link fallback; post links obey the same visibility rules as the feed.
- Searchable Group and Space directories, personal memberships/managed Spaces, clear create actions, designed covers and entity-specific feeds. Covers use CSS, not image storage.
- Private Group requests require manager approval. Repeat joins preserve owner roles and pending status. Pending members cannot read, comment on, save or react to private Group posts.
- Member search replaces numeric recipient entry. Incoming message requests have Accept/Decline controls; approved conversations have message bubbles and timestamps. Recipient privacy preferences and blocking remain enforced.
- Notifications are loaded on demand. Inbox refresh runs only on the Messages page while visible. No invented posts, profiles or member statistics are displayed.

## Voice and video calling

Calling is implemented but disabled unless both `CALL_TURN_URLS` and `CALL_TURN_SECRET` Worker secrets are configured. The relay must support the coturn TURN REST convention: expiring `timestamp:userId` usernames and HMAC-SHA1 credentials. Use TURN/TURNS endpoints owned or authorized by the operator. Never expose the shared relay secret in frontend code or commit it to GitHub.

Members must already have an accepted conversation. Each call then requires explicit recipient acceptance. Microphone/camera capture begins only when initiating or accepting a call. Calls use relay-only WebRTC; audio and video do not pass through the Worker and are not recorded. TURN traffic consumes relay bandwidth and members' internet data; this is not a promise of unlimited free calls.

Default video requests 640×360 at up to 15 fps, with 250 kbps video and 32 kbps audio target caps. Browser/network behavior may vary. Controls include mute, camera off, decline and end. Invitations expire after 60 seconds; accepted calls have a 30-minute cap. Participant locks prevent simultaneous calls. Blocking revokes signalling access. End/decline clears connection descriptions; expired rows are deleted hourly and before new calls. No audio/video storage is created.

Incoming calls are checked while the Messages page is open and visible. Background push ringing is not implemented. Calls are not claimed production-ready until a configured TURN relay is tested between devices on different networks.

## Validation

Buildcheck, approved terminology contracts and network safety unit tests cover relay gating, expiring credentials, owner-role preservation, pending membership, block enforcement, manager authorization and ordinary message delivery. Real local Worker/browser checks cover posting/editing, message approvals, group visibility, saved posts, feed filters and mobile/desktop layouts. Calls must additionally be tested with two browsers and a real relay before activation.
