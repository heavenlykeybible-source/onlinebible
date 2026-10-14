# Heavenly Key Global social network audit — 5 October 2026

## Scope and conclusion

This is a source review and regression audit of `global-community`, covering member privacy, publishing, Groups, Spaces, messaging, moderation, calls and investigation readiness. It is not an independent penetration test, a forensic investigation of past access, or certification of compliance in every country. Other Heavenly Key applications and Cloudflare/GitHub account administration were outside this review. The network needs the operating controls below before an unrestricted international launch.

## Corrections

| Finding | Severity | Correction |
| --- | --- | --- |
| Following a member unlocked their connections-only profile, posts and prayer items | High | Visibility requires the author to connect to the viewer; self-following cannot grant access. Authors can read their own connections posts. |
| Profile saves reset privacy and erased omitted fields | High | PATCH preserves omitted fields, validates settings and dates, and initializes form selections from saved values. |
| Public responses and discovery exposed or searched legal names | High | Full name is returned only to its owner; discovery searches public display names and public profile text. |
| Blocked members could reconnect or retrieve profiles | High | Bidirectional blocks prevent reconnection and authenticated profile retrieval; blocked comments and prayer items are filtered. Public information remains accessible while signed out. |
| Reports accepted guessed private content IDs | High | Posts/comments reuse feed visibility; message reports require participation; profile/Space/Group reports validate accessible targets. |
| Non-post reports were not actionable in the moderation interface | High | Queue shows reported replies/messages/Groups/Spaces/profiles; supported content can be restricted, accounts are escalated for separate safety review. Message-report review exposes the reported message, not unrelated conversations. |
| Moderation lacked reasons, appeals and protected action history | High | Reasons required; subjects receive decisions; appeals use a private request queue and a different administrator. Successful appeals can restore supported content. Duplicate pending appeals and repeat request resolutions are blocked. Application audit records reject UPDATE/DELETE. |
| Space website could use an executable URL; public Space responses included contact email | High | Website requires HTTP(S) without credentials; public Space response uses explicit fields and excludes contact email. |
| Suspended Spaces could still publish/display posts | Medium | Posting and feed require active Space/Group status. |
| New accounts defaulted sensitive profile fields to public | High | Location, church, work and connection count start private. Existing members' chosen settings are preserved. |
| No registration acknowledgement or adult access policy | High | New registrations require an 18+ self-declaration and acknowledgement of rules/privacy; version and timestamp are stored. This is not verified age assurance and does not attest existing accounts. |
| Unbounded request bodies, weak new-password length, malformed session cookies and internal error exposure | Medium | 128 KiB streaming JSON limit, content-type checks, 12–128 character new passwords, source/account rate limits, safe cookie decoding, active-account sessions, fail-closed missing password pepper, generic internal errors and cross-site request checks. Existing passwords remain compatible. |
| Static pages lacked security headers; legacy approved media endpoint bypassed the no-upload design | Medium | Static CSP/frame protection/referrer/type headers added, camera/microphone limited to same origin, and legacy media delivery disabled. |
| Members lacked a private data-rights request workflow | High | Safety & privacy page accepts access/deletion/correction/privacy/safety requests and shows administrator responses. Requests do not themselves delete or export data. |

## Validation

TypeScript and frontend syntax checks; eight Design Card checks; thirteen contract/approval unit tests. `npm run test:audit` creates a disposable local database, applies all migrations, and exercises real Worker API boundaries, private report rejection, reported-message removal, independent appeal restoration, request isolation, adult registration and append-only audit behavior. It never accesses production data. Desktop/mobile browser checks verify privacy selectors, saved settings, Safety page, headers and feed overflow. Existing publishing, group approval, messaging, saving, feed filters and call-gating regression workflows were also exercised locally.

Calls remain disabled in production pending a configured TURN relay. Relay connectivity, capacity and billing were not validated. No production member records were read or modified for these tests.

## Outstanding launch requirements

1. **Identity and privileged access:** implement administrator MFA, verified recovery and email ownership verification; inventory actual privileged accounts and infrastructure access. Password-only administration is a material remaining risk.
2. **Children:** assess existing accounts and intended audience, country-specific age assurance, and child-access duties. An 18+ checkbox alone is insufficient evidence of compliance. Do not market to children while these controls are unresolved.
3. **Privacy operations:** approve the controller's legal identity/address and public contact channels, lawful bases (including religious/health information), retention periods, processor/transfer arrangements, breach-response duties and jurisdictional representatives where applicable. Implement and staff the actual verified export/deletion process; never resolve a request by claiming an action that was not performed. Safety requests currently require an active account, so a public channel and restricted-account appeal route remain necessary.
4. **Moderation:** staff queues, define response targets/escalation, support relevant languages and audit false positives. Regex checks cannot inspect externally hosted videos or reliably understand context. Automatic refusals/held messages still need a fuller decision/appeal workflow. A reported profile is escalated; direct account suspension and reinstatement need a dedicated reviewed workflow. Restore appeals must not override later restrictions.
5. **Security and availability:** independent penetration test, dependency/infrastructure review, backup/restore drill, monitoring and incident exercises. KV rate limits are best effort and eventually consistent, not atomic abuse prevention. Evaluate edge/bot controls and durable rate limiting. Verify migrations and deployment artifacts independently.
6. **Retention and evidence:** soft restriction preserves content; this is not indefinite retention authority. Approve scheduled retention and legal-hold processes. The action log protects against application-level edits, not a database administrator or compromised infrastructure. Read-access logging, sealed exports and independent evidence storage are not implemented.
7. **Calls:** configure and test TURN credentials, limits, usage/cost monitoring and regional performance. Messages are not end-to-end encrypted. The application does not record calls.

## Lawful investigation procedure for the operator

There is no police bypass or public law-enforcement account role. A claim of authority grants no access. A designated legal officer should independently verify agency identity, jurisdiction, legal instrument and service requirements; narrow the request to relevant accounts, dates and data; obtain legal review of cross-border disclosure and notice restrictions; record the decision and lawful preservation period; and deliver only authorized data through a verified secure channel. Emergency disclosures require a documented lawful basis and verified circumstances, not an unchecked label.

Preserve originals under an approved legal hold, record UTC timestamps and custody transfers, and hash any authorized evidence export. Do not ask members to upload copies of child-abuse material. This is a proposed operating procedure, not an implemented automated disclosure service or a guarantee of evidentiary admissibility.

## Official guidance checked

- Nigeria Data Protection Commission: [Nigeria Data Protection Act 2023](https://www.ndpc.gov.ng/ndp-act-2023/). Determine applicable Nigerian controller/processor and sensitive-data obligations with local counsel.
- European Data Protection Board: [Data protection basics](https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en). Religious beliefs are special-category personal data; processing needs additional safeguards and a valid applicable condition.
- European Commission: [DSA statements of reasons](https://digital-strategy.ec.europa.eu/en/faqs/dsa-transparency-database-questions-and-answers). Determine applicability/exemptions, decision content, complaints and transparency obligations. Implemented reasons/appeals do not establish full DSA compliance.
- US Federal Trade Commission: [COPPA](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa). Child-directed services and actual knowledge of collection from under-13s require specific assessment; an adult label alone does not settle applicability.
- UK Ofcom: [Illegal-content duties](https://www.ofcom.org.uk/Online-Safety/check-how-to-comply). Relevant services must assess risk and implement appropriate safety/reporting measures; legal applicability and adequacy need assessment.
- Australian eSafety Commissioner: [Social-media age restrictions](https://www.esafety.gov.au/parents/social-media-age-restrictions). Relevant services must take reasonable steps regarding under-16 accounts; this network's coverage and age assurance need assessment.

These are jurisdictional examples, not a country-by-country legal clearance. Laws and guidance must be rechecked for each intended operating market.
