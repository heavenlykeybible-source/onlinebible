# Account 4 — Individual App Update Control

Account 4 dashboard has an **App Update Control · Six Apps** section. The authenticated owner can set **monthly** or **twice monthly** for each app independently and press **Request update review** at any time.

The preference and request timestamps are stored in the existing Account 4 RECOVERY_STATE KV namespace. The action is audited. It **does not** dispatch a deployment, change a production Worker, or modify databases. An update request is not evidence that a new release is available.

## Release procedure
1. Review the requested app's changes and exact source SHA.
2. Run relevant app tests and verify isolated preview and user data safety.
3. Use existing Account 4 approval/release gates for the corresponding production account. App-specific standalone deployments need verified pipelines before they can be enabled.
4. Record outcome and check installed-PWA update prompts.

Suggested review windows: monthly on the 1st; twice monthly on the 1st and 15th. The cadence is advisory, not an automatic release timer. An owner may request a review on any day. No silent auto-publishing.

**Important:** The UI controls are not live until Account 4's own separately approved dashboard deployment completes. Do not bypass its self-update lock.
