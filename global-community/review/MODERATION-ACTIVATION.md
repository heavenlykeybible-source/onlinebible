# Moderation-only activation and rollback

This is a source draft, not a deployed or connected screening service. The owner authorized background AI only for moderation. No AI assistant, generated posts, rewriting, calling or ordinary media uploads are added.

## Required preparation

1. Review and apply `0017_contextual_moderation.sql` to the intended draft/staging database after checking the real migration journal. Existing duplicate 0011 numbering and earlier ACTIVE migrations must be reconciled through the normal release process. This change does not rename old migrations or reset existing data.
2. Configure the following server-side values through the approved account/Control preview process. Never put the key in HTML, public JS, Git, logs or a URL:

| Setting | Meaning |
| --- | --- |
| `MODERATION_PIPELINE=enabled` | Confirms the new ledger/queue schema exists; enables timed enforcement and review APIs |
| `MODERATION_MODE=enforce` | Gates supported content mutations before saving or delivering |
| `MODERATION_API_KEY` | A dedicated Google Gemini API secret, with approved billing/data handling |
| `MODERATION_MODEL` | An explicitly selected, tested Gemini model supporting text, inline image input and structured JSON; no model is silently selected |
| `MODERATION_AUTO_STRIKES=enabled` | Optional opt-in after calibration; default is disabled. Only block verdicts at score >=0.99 in eligible categories can automatically confirm a strike |
| `MODERATION_CONCURRENCY` | Optional provider concurrency cap, default 4 and bounded 1–8 |

Setting enforce mode without a migrated/enabled pipeline fails closed. A missing key/model, provider refusal/outage or malformed response holds content rather than publishing. Do not activate enforcement without staffing the hold/appeal queue and verifying provider readiness. `queue.configured` checks presence/format only, not account validity, billing, quota or model capabilities.

3. Review the Google service's retention, processing terms, region/account configuration and operating cost. The adapter sends relevant submitted text, including private messages when enabled, and eligible advert images; it does not send account passwords, provider keys or full account records as content. Members receive notices in Safety and the chat view. Public legal/privacy documents need operator review before activation; these unrelated shared pages were not modified.
4. Test a real provider connection using approved safe examples, sensitive testimonies, negated phrases, Scripture, Pidgin/other expected languages, mixed intent, disguised spam and prompt-injection attempts. Verify image-capable model behavior with approved benign and policy-test fixtures. Self-reported confidence is not a calibrated accuracy guarantee. Do not enable automatic strikes on mock-test results alone.
5. Run a real multi-user staging workflow: submit, hold, approve, resubmit, reject, appeal, timed expiry, manual lock, image rejection, provider failure and recovery. Verify no account/content is published through an unscreened supported route. Run integrated CI and protected-state checks without changing their baselines.
6. Only then enable automatic strikes if the measured false-positive rate is acceptable and the owner accepts the policy. Permanent-ban decisions and disputed doctrine remain administrator decisions. Staff accounts are excluded from automatic member strikes.

## Queue operation

Content requests first receive a private screening job; they do not create a published post/comment or deliver a message. Worker `waitUntil` processes a new job in the background. The client polls briefly and retries the original action only after allow. The original route rechecks authentication, permissions, membership/privacy, validation and its existing local moderation. A later approval requires the author to resubmit; the job does not replay stored actions or impersonate the author.

Jobs are leased with a token; simultaneous claims are bounded atomically. Provider calls time out after 12 seconds. Transient provider failures back off one minute and attempt at most three times. Expired leases can be reclaimed; exhausted crashed jobs move to human review. Existing hourly scheduled maintenance drains up to three jobs, and the administrator Run control can drain a batch. The production cron/resource configuration is unchanged. A faster dedicated drain schedule or managed queue may be needed after load measurement; this has not been provisioned or claimed as complete. Member polling/background submissions are the normal immediate processing path.

The queue limits members to 20 queued/processing/held submissions. Resolved blocks do not monopolize the review queue, except unconfirmed cases and final escalation candidates. Profile/name creation during initial registration/social sign-in, previously stored images, public guest ministry forms, private growth notes, and remote video pixels/audio are not retrospectively scanned by this change. Profile updates and the supported publication routes are gated. Normal member image uploads remain disabled. The existing staff advert-image upload is screened before its original validation/storage step; there is no public upload or image quarantine gallery. A blocked/uncertain image must be corrected/reviewed before upload; it is not stored as an accepted advert image.

## Enforcement and appeals

Confirmed distinct incidents in the last 180 days produce: first warning; second 24-hour participation restriction; third 7 days; fourth 30 days; fifth indefinite participation hold awaiting administrator review. This is not an automatic permanent deletion/login ban. Account deletion/status and permanent decisions stay under existing administrator control.

Restrictions are calculated at request time and expire without a cron/unban operation. They do not alter users.status, roles or manual account restrictions, and cannot release an administrator lock. Read access, sign-in/out, safety requests, screening appeals, reports, member blocking and notification acknowledgement remain available during a timed participation restriction. A manual administrator lock retains its existing stricter rules.

Duplicate normalized content does not earn multiple strikes, including across retries. Queue uncertainty alone never earns a strike. Staff can confirm a specific policy category with an explained decision; doctrinal decisions and strike confirmation require an administrator. Successful appeals overturn the strike and immediately recalculate the applicable restriction. Self-review and review of one's own appeal decision are denied. The audit records human decisions and category changes. Evidence retention and deletion/export policy for the new screening ledger must be approved before production activation; no automatic historical content purge is introduced here.

## Rollback

Set `MODERATION_MODE=off` to stop external screening/gating while leaving the migrated ledger and existing administrator/local safety system intact. Existing confirmed timed restrictions continue while MODERATION_PIPELINE stays enabled; disabling the provider must not silently release them. Do not drop the tables or reset users. Lift incorrect strikes through the review/appeal controls. No production secrets, bindings, resource IDs, cron or security baselines were changed in this draft.

## Sources used for adapter contract

- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/generate-content/structured-output

No provider credential, paid account, deployment or production migration was configured by this work.
