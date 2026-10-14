# Account 4 streamlined owner administration

A successful Account 4 owner login establishes the existing signed, HttpOnly administrator session. Ordinary dashboard navigation, app update frequency changes and requests for review should not ask for redundant approval prompts. The app control renderer previously referenced an undefined `node()` helper; this was fixed. A redundant confirmation for a non-deploying update-review request was removed.

**Security retained:** password authentication, rate limits, session expiry, same-origin POST checks, owner-approved live promotion, protected secrets, database preservation, AI quarantine and environment approval remain. Account 2 and other accounts keep their own account boundaries; Account 4 login is not a universal bypass of separate account authentication.

**Deployment:** Changes are committed to GitHub, not live until an authorised Account 4 release. Do not disable production release approval gates or open AI production write access.
