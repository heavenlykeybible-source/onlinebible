# Verified source bundle

The current reviewed backend implementation is packaged separately as a deployment source bundle while the GitHub repository is being populated incrementally.

Current reviewed bundle SHA-256:

`1359b6817ff263fd3cc3cb1d16b7af2acd5c2287f21c61b37ce481d340564b59`

Latest backend hardening in this bundle includes:
- Broadcast/media administration restricted to Administrator.
- Bible and hymn media attachment restricted to Administrator.
- Livestream start/stop/heartbeat restricted to Administrator.
- Prerecorded playout, recording management and social-account/distribution controls restricted to Administrator.
- Ordinary members retain playback/listening access to approved Bible and hymn resources.
- One active live session at a time is enforced by the database.
- Live encoder heartbeat timeout is 180 seconds, followed by a 10-minute reconnect grace period.
- Fallback media must be stored, published and license-approved.
- Lightweight broadcast source selection supports camera, picture+audio, approved Bible audio, approved hymn media and approved prerecorded video.
- A broadcast picture can be used instead of showing the operator's face.
- Approved Bible/hymn media is marked KEEP so temporary-media cleanup cannot remove it.
- Successfully distributed recordings are deleted immediately unless explicitly kept.
- Assigned ministry tasks cannot be completed by another worker.
- Multipart large-media API paths remain disabled to keep Heavenly Key resource-light.

The bundle now contains the reviewed Worker source, 27 migrations, Wrangler configuration, tests and deployment documentation. It contains no production Cloudflare IDs or secrets.

Before production deployment, the source bundle must be unpacked as the project root and the release checklist completed.

Important architecture note: the Worker stores broadcast control/source configuration; actual live encoding and transport to Facebook/YouTube/etc. still requires the eventual external streaming/provider connection. No fake provider integration is claimed.
