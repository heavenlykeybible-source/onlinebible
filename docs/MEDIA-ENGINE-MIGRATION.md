# Media Engine Migration — Current Implementation

## Account 1: Core
Authentication/session/RBAC, community, groups, discipleship, evangelism/counselling, Bible/hymn catalogue and user playback state, public ministry/homepage and lightweight APIs remain in Core.

## Account 2: Media/Broadcast Engine
The separate Worker now has its own operational schema and control plane for:
- administrator-only live broadcast sessions
- camera / picture+audio / Bible / hymn / prerecorded-video source selection
- 180-second heartbeat timeout and 10-minute reconnect state
- prerecorded playout scheduling
- social account registry
- distribution-job queue metadata and idempotency constraints
- campaign scheduling
- temporary R2 media metadata and automatic expiry
- recording metadata and retention fields

## Retention
Temporary media defaults to a 48-hour retention window. Cleanup runs from the Media Engine scheduler and deletes expired R2 objects before marking their metadata deleted. `keep_media=1` is an explicit exception for approved permanent ministry resources.

## Security boundary
Core creates a 60-second HMAC capability after its normal Administrator/Super Administrator/Deputy Super Administrator RBAC check. The Media Engine validates the capability and rejects all other callers. Provider secrets stay in Account 2.

## Important limitation
This is a control-plane implementation. Actual video encoding/RTMP/WebRTC transport and third-party social posting still require a real provider/transport implementation and credentials. No fake integration is claimed.

## Deployment order
1. Provision Account 2 D1/R2 and secret.
2. Apply `media-engine/migrations/0001_media_engine.sql`.
3. Deploy Media Engine to staging.
4. Verify capability authentication, lifecycle cleanup, live reconnect and playout.
5. Add real provider adapters/credentials.
6. Switch Core admin handlers to the Media Engine proxy boundary.
7. Run end-to-end staging tests.
8. Remove obsolete broadcast/media bindings from Core only after successful staging verification.
