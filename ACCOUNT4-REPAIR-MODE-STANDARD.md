# Account 4 — Surgical Repair Mode Standard

## Purpose

Account 4 is the permanent maintenance and recovery control plane for Heavenly Key Accounts 1–3. After the systems are fully deployed, normal maintenance must repair the smallest affected feature instead of replacing or reinstalling an entire website or application.

Examples:

- 24/7 Radio fault → repair the radio/playout/broadcast component only.
- Go Live fault → repair live transport/studio code only.
- Auto Post fault → repair social publishing/scheduler code only.
- Community Messenger fault → repair messaging code only.
- Feed fault → repair feed code only.

A repair is not permission to recreate databases, buckets, KV namespaces, API credentials, CMS content, users, media, or unrelated features.

## Non-destructive state rule

Routine repairs are CODE-ONLY releases. Persistent state is outside the repair payload:

1. Cloudflare Secrets remain Cloudflare Secrets and are never written into source packages.
2. D1/KV/R2 resource identities remain pinned to the existing production resources.
3. Saved OAuth/API credentials remain in their existing secret/encrypted storage and are never cleared merely because code changes.
4. CMS content, users, posts, media, schedules, social connections, LiveKit connection data and restream destinations survive code deployment.
5. Routine repair workflows MUST NOT run migrations, `secret put`, resource creation, destructive SQL, credential rotation, or first-install/bootstrap logic.
6. A repair that genuinely requires schema or credential changes becomes a separate owner-approved protected-system maintenance operation with backup/recovery checks.

## AI repair access

An owner may authorize ChatGPT, Claude, Gemini or another approved AI client to diagnose and prepare repairs for Accounts 1–3. Authorization must be revocable and scoped.

The AI may inspect the relevant source and submit a repair candidate. It must not receive plaintext production secrets. It must not obtain Account 4 owner authority. Production publication remains behind Account 4 validation, isolated preview and owner approval.

## Repair work order

Every future AI repair should be represented as a work order with:

- target account;
- component/feature;
- problem statement;
- allowed source paths;
- explicitly protected paths;
- baseline production SHA;
- candidate SHA/package hash;
- tests required for that component;
- preview result;
- owner approval state;
- deployment result and rollback reference.

A work order is single-purpose. If an AI is asked to repair 24/7 Radio, unrelated community, CMS, authentication and website files are outside scope.

## Component boundaries

### Account 1 — Main Website / Ministry Command Centre

Typical repair domains include website UI, broadcast control API, campaign manager, communications, social account management and social publishing. Authentication, owner roles, CMS permanence controls, Cloudflare bindings and existing migrations remain protected unless a separate protected-system maintenance approval is issued.

### Account 2 — Media Engine / Studio / 24/7 / Go Live

Repair domains include media-engine broadcast logic, 24/7 playout, public broadcast playback, studio audio/video processing, uploads, LiveKit transport and social restream logic. Existing D1/KV/R2 identities, stored LiveKit credentials, stream destinations, shared secrets and media objects remain persistent and are not replaced by a code repair.

### Account 3 — Global Community

Repair domains include feed, profiles, spaces/groups, messaging, calls, adverts, community AI UX and ordinary community services. Existing member database, sessions, media bucket, authentication and protected moderation/security foundations remain persistent.

## Repair pipeline

`Problem → Diagnose → Create scoped work order → Change only required files → Component tests → Full account regression gate → Account 4 isolated preview → Owner review → Approve exact SHA → Code-only production deploy → Feature smoke test → Close work order`

If any protected-state identity changes unexpectedly, the repair is rejected.

## Configuration survival guarantee

A normal update must never behave like a fresh installation. Existing API keys and saved connections are data/configuration, not release payload. The deployment process verifies their presence and original resource bindings but does not rotate, delete or recreate them.

## Account 4 itself

Account 4 remains manual-maintenance-only. AI repair authority for Accounts 1–3 does not imply permission to edit Account 4 security, credentials, approval signing, recovery history, deployment authority or core locks.
