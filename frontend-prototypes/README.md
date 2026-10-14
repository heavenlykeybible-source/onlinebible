# Frontend Prototypes — Community Platform

These are **design prototypes, not production code.** They demonstrate interaction
patterns, layout, and the design system agreed during architecture — every "API call"
inside them is a hardcoded demo, not a real fetch.

**Architectural decision made explicitly here (was previously undecided):** the Global
Christian Platform's member-facing frontend lives inside this repository
(`heavenlykey-platform`), not a third repository. Project A = backend API + this
platform's own frontend; Project B (`heavenlykey-website`) = the public marketing site only.
This wasn't stated plainly anywhere before — it is now.

**When Module 2+ implementation begins:** treat each file here as the source-of-truth
interaction design to port into a real frontend build (e.g., a `frontend/` folder using
whatever build tooling is chosen), not something to link to directly in production.

| File | Corresponds To |
|---|---|
| `module1-authentication.html` | Module 1 — Register/Login/Profile |
| `module2-community.html` | Module 2 — Prayer/Testimonies/Q&A/Discussions |
| `module3-spiritual-resources.html` | Module 3 — Bible/Audio/Hymns/Devotional |
| `module4-evangelism.html` | Module 4 — Decisions/Nations/Follow-up |
| `module5-groups.html` | Module 5 — Groups & Fellowship |
| `module6-administration.html` | Module 6 — Moderator Dashboard |
| `discipleship-centre-prototype.html` | ACR-007/008/009 — Discipleship Centre |
