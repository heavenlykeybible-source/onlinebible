# Cross-site audit — build-only hardening

Date: 2026-10-07
Branch: `cross-site-audit-hardening`
Deployment: **not performed**

## Scope
Reviewed the public ministry site, administrator/command centre, authentication/RBAC, editable content, Global Christian Community, privacy/safety/moderation, social integrations, media/live architecture and release documentation from ordinary-user, administrator, security/privacy and lawful-authority perspectives.

## Confirmed strengths
- Server-side RBAC with role hierarchy and lower-role-only administrative actions.
- Revocable KV-backed sessions and active-account checks.
- Rate limits on sensitive authentication operations.
- Human review and appeal paths for moderation; automated flags are review aids rather than automatic guilt decisions.
- Restricted community accounts retain a path to request review.
- Social-provider secrets are kept behind privileged configuration paths and are not displayed after storage.
- Media Engine uses short-lived signed capability tokens from Core and records administrative audit events.
- Large media can use the separate Media Engine resumable path up to 2 GB; Core remains resource-light with a 100 MiB direct-upload ceiling.
- Temporary media and recordings have retention controls and cleanup paths.

## Findings corrected in this branch
1. Corrected the administrator UI that incorrectly labelled the Media Engine as Account 3.
2. Corrected stale documentation that implied all multipart uploads were disabled; clarified Core vs Account 2 Media Engine boundaries.
3. Added site-wide Privacy, Terms and Legal Requests navigation.
4. Added a public Privacy Notice.
5. Added public Terms & Community Standards.
6. Added a lawful-authority request intake policy with verification, proportionality, emergency and no-backdoor principles.
7. Connected the Global Community Safety page to the public legal-request channel.

## Important open build items
- The easy-edit system currently covers homepage fields only; the user's requirement is editing across the public site. Expand the structured content model page-by-page rather than allowing arbitrary HTML editing.
- Staging still needs a real Media Engine staging host before staging deployment should be considered green.
- Full provider-by-provider social publishing and live broadcasting remain dependent on real provider permissions, transport availability and account authorization.
- Privacy/terms/legal text should receive jurisdiction-specific professional legal review before a major public launch, especially if operations expand materially outside Nigeria or begin serving minors.
- Continue functional acceptance testing for account deletion/access execution, moderation restoration, 48-hour retention, broadcast fallback and provider revocation before production release.

## Deployment discipline
Do not deploy this branch. Continue build/test work. Deploy only after the owner explicitly authorizes a release.
