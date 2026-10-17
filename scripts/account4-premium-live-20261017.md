# Account 4 premium Control Room — verified deployment

Production deployment succeeded in GitHub Actions run 39001790750 on 17 October 2026 at 04:15 UTC (05:15 Africa/Lagos). Deployed source commit: ffeacb877d8e586c42d9e4729a85524b8c6beb3a, branch release/account4-premium-20261017.

## Installed and verified

- Approved green/gold/white/wine premium Control Room template, retaining editor, upload, CMS assistant and version-history handlers.
- Awaiting Room presentation with actual arrival/approval records and Nigerian times. No synthetic update rows were added.
- Central username/password login and owner/admin user-management backend; one-time private owner/admin password setup.
- Exact Account 4 D1/R2 bindings preserved. Additive migrations 0006–0009 applied successfully.
- Combined typecheck, backend/permission/setup tests, template DOM tests, migration validation and dry-run bundle passed.
- Isolated preview passed an actual synthetic administrator login, authenticated homepage, queue/user API and anonymous-denial check.
- Production checks passed the same actual login/API checks on both control.heavenlykey.org and the owner-dashboard workers.dev address. Synthetic users and their sessions/proofs were cleaned up by exact generated IDs.
- Public CMS health passed. No production radio playback or third-party AI integration claim is made by this release.

## Production versions

| Worker | Version |
| --- | --- |
| heavenlykey-control-room | 32e3632b-9095-4345-abf1-4fcf357ee375 |
| heavenlykey-owner-dashboard | e1882ac7-e50a-47db-9820-59c521385829 |
| heavenlykey-cms-public | 0b7768b4-0829-4bc4-a2df-ef958c6e448c |

Database: heavenlykey-control-room-db, 25536a81-63ed-41e3-85f1-4f17bb977628. Media bucket: heavenlykey-control-room-media. No existing Worker, database, media object or legitimate account was deleted. Only temporary synthetic test accounts were removed.

## Backups and rollback

Worker versions, downloaded source/settings and a full D1 SQL export plus recovery bookmark were saved in private workflow artifacts before production replacement. Run 39001671979 contains the backup before additive migration; run 39001790750 contains the immediate pre-promotion backup (artifact 12089940220). Automated Worker rollback was prepared but was not needed. Existing records and additive tables are retained during a code rollback.

## Pending and limits

The owner must complete the private setup form to choose different owner/admin passwords. The setup link expires six hours after creation (10:14 UTC / 11:14 Africa/Lagos on 17 October); it is single-use. Do not store or copy its token into source, issues or reports. No real owner/admin password has been entered or tested by the agent.

Account 2 Studio SSO is prepared in source but not activated; its deployment credential and actual route/database mappings must be verified first. The custom Studio domain currently routes to the older ministry administrator page. Other accounts were not deployed in this release. Email recovery delivery and external ChatGPT/Gemini/Claude integrations remain unverified. The production source is this release branch; default-branch reconciliation must preserve this deployed design and avoid triggering unrelated account deployments.
