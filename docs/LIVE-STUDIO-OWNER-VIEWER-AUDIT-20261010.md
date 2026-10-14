# Heavenly Key — Live Studio broadcaster / owner / viewer audit
Date: 2026-10-10. Development review; not evidence of an actual live broadcast or Account 4-approved production deployment.

## Architecture inspected
- Account 1 administrator studio and broadcast proxy; Account 2 Media Engine, D1, LiveKit tokens, R2 and LiveKit Egress.
- HTML canvas + Web Audio mix and local MediaRecorder in the browser; LiveKit for live camera/microphone transport.
- Public Radio and Faith of Our Fathers TV programme endpoints and LiveKit viewer tokens.
- Owner-approved RTMP/RTMPS social destinations and official Meta/YouTube OAuth preparation, with provider status checks.

## Broadcaster / user checks
- The studio has preview, device selection, audio mixer, scene switching, source media, local recording, GO LIVE / End, recovery and standby functionality.
- Browser/device compatibility and camera/microphone permission cannot be guaranteed by source inspection; iOS Safari, Android Chrome and desktop Chrome need tests.
- External-source failure after server session creation previously erased the local session identifier. Corrected: failures attempt server stop and keep a visible stop warning if that fails.
- Social distribution failure must not destroy the website's external-source broadcast; local and provider status are now shown separately.
- A local LiveKit connection and publisher track calls are necessary, but not proof that remote viewers heard sound or saw picture. Viewer playback must be checked externally.
- The 'Connected viewers' display was the LiveKit room participant count, not a worldwide audience count. Relabelled accordingly.
- Client capture and recording are tied to the broadcaster's browser. Closing the device can interrupt manual live; unlike the 24/7 cloud playlist, manually originated studio video cannot keep publishing from a turned-off phone.

## Owner and security checks
- Restream replacement now validates its source and the selected active LiveKit room before stopping existing Egress. It still stops old Egress before starting a valid replacement; therefore a provider outage during replacement may cause a gap and needs staging soak tests.
- Updating/disabling/removing an RTMP destination that is actively streaming is blocked until the owner stops the egress. Stream keys are stored encrypted in Account 2 and should never appear in logs.
- Arbitrary generic publisher tokens are denied. Use the session-scoped publishing token for an active broadcast; Account 1 does not expose the generic token route.
- Egress state retains the owning live session ID; ending the corresponding broadcast attempts to stop its restream even if dashboard destination toggles have changed. Do not stop an independent 24/7 egress when ending an unrelated live session.
- End broadcast no longer claims OFF AIR if the server stop failed. If social egress shutdown is not confirmed, the dashboard warns the owner.
- Current worker makes a live D1 session record before tracks are published to LiveKit. The 'LIVE' public route can briefly exist before usable media arrives. Full readiness handshake remains a future safety improvement.
- Network-loss 180-second heartbeat and 10-minute grace have automated coverage; actual offline/reconnect performance still needs real network disruption testing.

## Third-party platforms and viewers
- Facebook and YouTube OAuth functions attempt provider authorization, create ingest destinations, and verify statuses. LiveKit egress starting does not prove either provider actually transitioned to a public live status.
- TikTok requires its permitted manual stream key and account eligibility. Instagram, X and LinkedIn official live ingest are not generally available through these connected publishing integrations; no promise of automatic public live for them.
- Each platform may limit duration, format, ingest, permissions, rate limits, or public visibility. Any claims about provider support should be verified with current provider approval.
- Viewers must click Play as browser autoplay policies permit. Audio/video playback, synchronized public listeners and fallback must be checked on real phones and networks.

## Real pre-release acceptance plan
1. Verify Account 1 & Account 2 staging secrets, D1 migrations, LiveKit URL and role scopes without exposing credentials.
2. Administrator previews camera and mic with audio meters and headphones. Owner confirms 9:16, 16:9 and low-data 480p and checks actual upload bitrate.
3. Start a private test on Heavenly Key TV and Radio. On a second phone, click Play and confirm video, speech/music, and audio channel routing.
4. Test scene changes, screen sharing, prerecorded and external sources; verify source switching and live return to playlist.
5. Drop upstream network for 30 seconds and >180 seconds. Verify server reconnecting / standby and recovery within configured 10-minute grace, with real viewer checks.
6. Start verified Facebook/YouTube private/unlisted provider live (where eligible) and record provider receipt, playback and public visibility. Confirm egress really receives the canvas mix.
7. Test End Broadcast, failed-stop recovery and that associated social egress stops without disrupting unrelated 24/7 programmes.
8. Verify saved clips are accessible, R2 storage usage, retention, and audience resource consumption at concurrent loads.
9. Run a long-duration soak test and confirm CPU, mobile battery, network data, LiveKit connection cost and Cloudflare usage.
10. Only release through Account 4 authorization after staging checks and explicit owner approval.

## Known limits
CI tests simulate D1, LiveKit Egress and providers; they do not physically activate a camera, connect a real RTMP destination or validate live provider reachability. Configuration currently points 24/7 egress playback at a workers.dev host; confirm that host works and is the approved production canonical playback URL before an owner release. Only Account 4-controlled deployment may change production.
