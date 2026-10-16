# Platform repair status — 16 October 2026

## Verified public observations

- The live homepage footer already promotes Global Christian Community. Picture Gallery was not present in the current rendered homepage.
- The homepage recent-blog section showed its failure fallback. The original scripts requested external JSONP, while the production CSP only permits self and jsdelivr scripts.
- The assistant successfully answered a public question with the official KJV Bible and Community URLs. Its portrait was an embedded data URL excluded by the production img-src policy.
- The radio page reported `No programme is available right now.` after Play. Playback cannot be certified until an approved programme is configured and played.
- A secure owner sign-in attempt returned `Sign-in failed. Check your owner password.` Owner administrative access remains unverified. No credentials were exposed or changed.
- The app destination loaded but labelled itself APP PREVIEW and reported live updates unavailable. Member sign-in and live playback were described as still being connected and tested.
- Control Room opened the Website Control Room editor with `Administrator sign-in required`; Studio presented its administrator login form. A visible login form does not prove owner access or SSO.
- Terms and Privacy source pages exist and describe privacy requests, community standards and third-party processing. Publication of these pages does not establish legal or operational compliance.

## Repairs in this branch

- Bounded, fixed-upstream, same-origin blog feed endpoint; no arbitrary upstream URLs or external script execution.
- Both blog widgets use the endpoint and preserve a useful failure fallback.
- Existing assistant portrait uses the hosted image asset permitted by CSP.
- The approved homepage sharing script is external; CMS startup avoids adding a duplicate share button.
- Connection lists omit suspended accounts/Spaces and respect both block directions for the actual viewer.
- Feed/SQL regression tests and production-CSP Chromium/WebKit layout checks added.

## Remaining verification and release blockers

1. Authenticate the authorized owner through the normal deployed login. Verify Control Room → Studio SSO, role permissions, user management, password change and recovery without exposing credentials.
2. Use isolated test accounts to exercise registration, reports, moderation, blocking, privacy and deletion fulfillment. The source supports deletion requests; processing a request must be verified separately from marking it resolved.
3. Review the protected-state CI failure. It identifies existing baseline drift in authentication, runtime bindings, migrations and deployment workflows, plus the new read-only test workflow. Do not disable or bypass this gate. This branch does not change credentials, bindings, migrations or Account 4 core.
4. Stage and inspect the exact tested release, then publish through authenticated Account 4 owner approval. No production deploy was performed in this repair session.
5. Verify the actual upstream Blogger feed, a configured approved radio programme, app destinations, and physical-device behavior after release. Emulated browser widths do not equal physical-device testing.

No statement here certifies full platform security, operational completeness or legal compliance.
