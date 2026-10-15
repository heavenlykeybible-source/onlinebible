# Heavenly Key deployment repair — 15 October 2026

## Verified repairs

- Account 4: deployment workflow now resolves the existing D1/R2 configuration and verifies Access issuer/audience against the existing protected application's redirect. Both GitHub Actions and Cloudflare Builds succeeded. The live Worker configuration contains the expected issuer and audience, and D1 contains cms_entries, cms_revisions and cms_audit. Added the approved footer and prevented editor overflow on mobile. Authenticated administrator editing, AI inference and cross-account publication have NOT been verified.
- Account 3: actual build logs showed npm ci failing because global-community/package-lock.json was missing. Added a generator workflow, produced the lockfile, passed npm ci and the application's buildcheck suite, and verified a successful subsequent Cloudflare Build. Existing community public HTML and app.js match main exactly. Public /api/health returns 200.
- Account 6: actual logs showed Wrangler 3.114.17 rejecting the Wrangler 4 assets.run_worker_first array. Changed ONLY the Cloudflare Build deployment command to npx --yes wrangler@4.151.0 deploy --config bible/wrangler.toml --name onlinebible. Build 397c676d-5373-4e19-baed-07a53888fb93 succeeded. Independently verified the live frontend matches heavenly-key-website/bible/index.html, /health returns ok:true, and /api/bible/Genesis/1 serves 31 KJV verses including the expected first verse.
- Account 1: heavenlykey.org returns 200 and its homepage HTML matches main exactly. This is frontend verification, not a full authentication/forms audit.
- Account 2: Worker root redirects to the Account 1 Studio; its Cloudflare Build succeeds. Media/radio/studio end-to-end tests remain outstanding.

## Verified URLs

| Account | URL | Verified behavior |
| --- | --- | --- |
| 1 | https://heavenlykey.org | HTTP 200; source-matching homepage |
| 2 | https://heavenlykey-media.faithofourfatherstv.workers.dev/ | Redirect to Account 1 Studio |
| 3 | https://heavenly-key-global-community.heavenlykeyglobal-cd095c09.workers.dev/ | HTTP 200; source-matching frontend and working health endpoint |
| 4 | https://heavenlykey-control-room.emmanuel2026miracle.workers.dev/ | Cloudflare Access 302 sign-in gate; configured bindings and CMS tables verified separately |
| 5 | Not yet located | Deployment/account access still required |
| 6 | https://onlinebible.heavenlykeybible.workers.dev/ | HTTP 200; source-matching Bible, health and Genesis 1 API verified |

## Custom-domain blocker and prepared repair

global.heavenlykey.org and bible.heavenlykey.org still return 522. Account 1's zone 23f3be9052bf609e8ccd85ac1b375019 has only the heavenlykey.org/* Worker route. No Global/Bible routes were present when inspected.

Prepared portal-router/ as a separate fixed-origin gateway that preserves the existing applications. Eight routing tests pass, covering fixed upstreams, request bodies, cookies, same-origin writes, cross-site rejection, redirect rewriting and network errors. The routing Worker heavenlykey-portals was uploaded to Account 1. Binding its domain routes was denied by Cloudflare: HTTP 403 / No access to the specified resource. Neither requested route was added. Existing routes and DNS records were not deleted or changed.

The workflow .github/workflows/deploy-portal-router.yml can deploy the gateway and add only:
- global.heavenlykey.org/* → heavenlykey-portals
- bible.heavenlykey.org/* → heavenlykey-portals

Do not report these domains as repaired until both actual URLs pass their health and content checks.

An Account 1 browser sign-in handoff was prepared for alldaywow247@gmail.com. Profile ID: prof_6520036d3b444b16. Wait for the owner to save the profile before using it.

## Content and CMS gaps

- The production ministry_editorial_posts table was empty at inspection, while the 12 editorial profile definitions were available.
- The existing Heavenly_Key_Publish_2880_Deployment_Package.zip was inspected. Its README explicitly describes its 2,880 records as formulaic, unreviewed draft text and its design cards as text rather than completed images. No records were imported or published during this repair. Do not describe this package as finished approved graphics.
- Account 4's current CMS stores drafts/revisions. The source explicitly reports deployment execution disabled and does not wire saved drafts into Accounts 1–6 rendering. Completing that functionality remains work to do.
- The repository also contains an older recovery-control implementation with a different D1 database and GitHub repository setting. It was inspected but not substituted for the current Account 4 Worker.
- Account 5 remains unlocated. Full mobile visual testing, member authentication, forms, media, AI inference and editorial acceptance are outstanding.

## Evidence

- Account 4 successful repair run: https://github.com/heavenlykeybible-source/onlinebible/actions/runs/38701291990
- Account 3 lockfile generation and validation: https://github.com/heavenlykeybible-source/onlinebible/actions/runs/38703053929
- CMS/schema/content audit: https://github.com/heavenlykeybible-source/onlinebible/actions/runs/38701758867
- Zone-route permission inspection: https://github.com/heavenlykeybible-source/onlinebible/actions/runs/38702565819
- Independent live Bible/community verification: https://github.com/heavenlykeybible-source/onlinebible/actions/runs/38703567590
- Routing authorization failure: https://github.com/heavenlykeybible-source/onlinebible/actions/runs/38703294553

No existing member posts, credentials, D1 databases or R2 buckets were deleted or reset.
