# Approved Account 4 premium release

The owner explicitly requested production deployment of Account 4 with the approved premium template on 17 October 2026. This release combines the prepared template with the tested owner/admin access repair. Account 2 and all other accounts are excluded from deployment. Studio SSO is prepared but requires Account 2 activation. External AI provider connections are not claimed verified.

Release order: verify Account 4 bindings; typecheck and run backend, permission, template and migration tests; save existing Worker versions/source/settings and full D1 export plus recovery bookmark to a private backup artifact; apply additive migrations; deploy and probe an isolated preview; configure a six-hour single-use owner password setup; promote the three matching Account 4 Workers; verify live template, login screens, private API denial and public CMS health. Roll back Worker versions if production promotion/checks fail, preserving additive database records.

The preview Worker is heavenlykey-control-premium-preview. Production resources remain heavenlykey-control-room, heavenlykey-owner-dashboard, heavenlykey-cms-public, heavenlykey-control-room-db and heavenlykey-control-room-media. No existing Worker, database, media object or user is deleted.

The owner privately chooses different owner/admin passwords using the private setup artifact. Production login with those passwords and real Control Room-to-Studio sign-on remain unverified until that handoff and Account 2 deployment are completed.
