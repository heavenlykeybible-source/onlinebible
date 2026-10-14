# Heavenly Key — Production readiness record

## What is ready in source

- Cloudflare Worker entry point and route registry.
- D1 migration chain with sequential migrations.
- R2-backed large-media workflow with normal and multipart upload paths.
- Temporary-media retention/cleanup scheduling and explicit KEEP support.
- Live-session heartbeat/reconnect state and fallback-media endpoint.
- Recording registration, keep/delete and download lifecycle.
- Community, authentication, spiritual resources, evangelism, groups and administration modules represented in the API.
- Ministry Management Suite modules represented in the backend roadmap/code.
- Security headers, session authentication, rate limiting and role-based authorization are present in the reviewed paths.
- Deployment preflight rejects real deployment while Cloudflare resource IDs remain placeholders.
- GitHub CI and a manual staging deployment workflow are included.

## Deliberately not claimed as live

- No Cloudflare resource has been provisioned by this repository commit.
- No production secret is present.
- No social platform is considered connected until its real OAuth/account authorization is completed.
- The KJV Bible text is not fabricated or silently imported. The repository's spiritual-resource seed identifies the missing approved KJV source.
- The HTML files under `frontend-prototypes/` are reference/prototype screens, not a claim that the member-facing frontend is complete.

## Acceptance gate

Deployment is accepted only after:

1. staging resources are created and IDs replace the staging placeholders;
2. staging secrets are configured;
3. all migrations apply cleanly to staging;
4. authentication and authorization smoke tests pass;
5. media upload, multipart upload, approval, playback and deletion pass;
6. 48-hour retention and explicit KEEP behavior pass;
7. live reconnect/fallback behavior passes;
8. recording download/delete behavior passes;
9. campaign scheduling and cleanup behavior passes;
10. each intended social provider is separately authorized and tested;
11. no temporary media remains after successful distribution unless explicitly retained;
12. production resources and secrets are configured only after staging acceptance.
