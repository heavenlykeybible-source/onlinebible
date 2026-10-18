# Community member and site-owner audit — 18 October 2026

## Verdict

The core community actions work in isolated tests against the real Worker routes. The service is not yet ready to claim Facebook-level account recovery, account security or onboarding. The most urgent gaps are missing member password recovery/change, weak password policy, unverified email addresses, and missing member MFA/session-management controls. Passing CI and a clean dependency audit do not establish complete application security.

## Scope and evidence

- Live public browser inspection: home, group discovery, visitor creation/sign-in boundary, registration screen, social sign-in availability and Space creation form. No live accounts, groups, posts or messages were created.
- Disposable SQLite database with all community migrations, KV adapter and actual transpiled Worker source: four member/owner accounts and complete API journeys. This is an application integration test; it does not substitute for a signed-in browser journey or production D1/KV behavior.
- New reproducible tests: `global-community/test/user-owner-journeys.checks.mjs` and `test/helpers/worker-fixture.mjs`. Existing privacy, group, registration, stewardship and security suites also run.
- Source reviewed initially at PR #19 commit `27988070c5065535101bdb9c99342b40dbf4ae64`. Earlier fixes remain in the unmerged review branch, so the live site can still show older links and behavior.
- No production credentials, email inboxes, provider secrets or Cloudflare administration settings were inspected. No penetration test, load test or backup restore was conducted.

## Member journey results

| Journey | Observed result | Limitation |
| --- | --- | --- |
| Registration and sign-in | Isolated account creation, duplicate handling, valid/invalid password checks and secure cookie flags passed. Live form is simple and labelled. | No email-ownership verification; six-character mixed-case passwords accepted. |
| Public page | A Space creates a public ministry/church/business page, loads by its slug and publishes under that Space. Non-managers cannot impersonate it. | No separate Facebook-style Page model; terminology should explain that Spaces are public pages. |
| Space creation | Successful creation and owner-only publishing passed. | Creation ownership failure fixed below; real signed-in browser submission remains unverified. |
| Group creation | Private group creation, pending membership, owner approval and approved-member posting passed. | No populated groups appeared in the live visitor directory during this audit; do not interpret this as proof that no groups exist. |
| Posts and comments | Publish, retrieve, comment, edit own post and reject another member's edit passed. Private-group comment access was enforced. | Ordinary members have no self-service post/comment deletion route or visible Delete control in reviewed code. |
| Text messaging | Recipient-controlled requests, acceptance, delivery, multilingual text, retry deduplication, outsider denial and blocking passed. | Requests default to connections only; members need a clear explanation. Messages are not end-to-end encrypted. |
| Password reset | No member recovery endpoint or Forgot password control found. | A forgotten password currently has no normal self-service recovery journey. Owner Control Plane password recovery is a separate system and does not solve this. |
| Change password | No member change-password endpoint/form found. | A member cannot rotate a compromised password through the community UI. |
| Google/Facebook | Live buttons show “awaiting setup.” | Code paths and mocked provider tests are not proof of real provider configuration or delivery. |

## Security and owner findings

### High priority — account lifecycle

1. **Missing recovery and password change.** Add verified email delivery; random, hashed, expiring, single-use recovery tokens; neutral responses; rate limits; password confirmation; security notifications; and session invalidation after recovery. Do not implement an email-only reset without proving inbox ownership.
2. **Weak password policy and storage work factor.** Current policy is 6–128 characters with uppercase/lowercase requirements; there is no member MFA or breached-password screening. Storage uses salted, peppered PBKDF2-SHA256 with 100,000 iterations. Review a supported stronger hashing strategy against Worker runtime/CPU limits and current OWASP guidance; migrate existing hashes without silently breaking existing passwords. Prefer passphrases and international characters over Latin-style composition rules.
3. **Email ownership is unverified.** Registration accepts a syntactically valid address and immediately signs in. This permits registrations under another person's address and creates future recovery/account-linking risk. Complete verification before treating an email as an account-recovery identity.
4. **Missing account-wide session controls and member MFA.** Users can sign out the current session, but there is no device/session list or “sign out everywhere” UI. Sessions can last 30 days. Require stronger protection for community administrators/owners and verify the separately hosted deployment accounts as well.

### Medium priority — privacy, usability and resilience

- Duplicate registration explicitly reports that an email is registered. This creates a membership-enumeration privacy concern; adopt a privacy-preserving duplicate-account assistance flow.
- A declined conversation cannot be requested again: the backend returns the existing declined conversation. Define a safe recipient-controlled reopen/unblock policy, rather than leaving members at an unexplained dead end.
- Account links can include `next=messages.html`, but successful sign-in always navigates to Home. Creation forms may send guests to sign-in after they have entered content. Preserve a bounded local return destination and relevant draft, without allowing external redirect URLs.
- No member post/comment deletion flow is present. Provide recoverable removal with an explicit retention policy; editing and reporting do not replace author removal.
- Moderation is primarily English regular-expression matching. It is a useful flagging aid, not a worldwide safety guarantee. Add multilingual human review, documented escalation and appeal response times.
- Production monitoring, backup restoration, sustained load, globally consistent throttling and administrator MFA remain unverified. Source approval gates do not prove GitHub/Cloudflare account settings are enforced.

### Fixed during this audit — incomplete Group/Space creation

Fault injection reproduced a failed owner-membership insert leaving an orphan Group or Space. The API returned an error even though the entity row remained. Creation now uses a D1 batch transaction for the entity and owner membership. Regression tests assert rollback leaves zero orphan entities and a retry creates exactly one owner membership. No SQL migration or production data change was required. This fix is in PR #19 and is not deployed by this audit.

### Controls that passed the isolated checks

- Secure/HttpOnly/SameSite cookies, random server-side sessions and current role/status checks.
- Cross-origin write rejection, bounded JSON bodies and parameterized database operations.
- Private group/feed boundaries, post ownership and Space publishing authority.
- Message participant authorization, recipient-only acceptance, retry deduplication and blocking.
- Ordinary members denied access to administrator advert tools and moderation queues; owner role accepted.
- Restricted accounts cannot post, retain access to safety review, and calls remain unavailable.
- Current-session logout revokes that session. Existing suites also cover private reports, independent appeals, draft advert authorization and audit rollback.

## Ease of use and reasons to return

The distinctive proposition is useful: Christian fellowship, prayer support, Bible study, discipleship, ministry pages and text conversations in one place. A member should be able to join a relevant group, receive a thoughtful reply and build a daily faith habit. That is a credible reason to choose this community.

The live visitor experience currently weakens this proposition: the main social feed and member discovery showed empty states, the group directory offered the first-group prompt, and a separate official-publications section loaded many long articles with internal editorial/template metadata. This makes the page feel more like a publication archive than an active conversation. These are observations of the audited visitor view, not verified total membership statistics.

Recommended product sequence:

1. Finish account recovery, password change, email verification and owner protection before broad promotion.
2. Explain “Create a Space (public ministry page)” and distinguish it from a Group.
3. Onboard each new member into one relevant group, one introduction and one useful first action. Preserve the action they chose before sign-in.
4. Recruit real community hosts to answer introductions and prayer requests; show honest activity and availability rather than fabricated member counts.
5. Present official publications as concise cards with an explicit Read more action; keep editorial IDs and template metadata out of normal reading views.
6. Measure successful sign-up, first useful reply, week-one return and unresolved reports. Feature count alone cannot establish Facebook-level ease or retention.

## Validation and release boundary

Local `npm run buildcheck` passed after updating SQLite test adapters to model D1 batch transactions. The new journey and rollback tests are part of `test:security` and therefore the existing CI and release checks. GitHub must verify the final audit commit. Signed-in live browser execution, real recovery email delivery, social provider login and operational readiness remain outstanding; none is reported as passed.

## Primary security references

- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
