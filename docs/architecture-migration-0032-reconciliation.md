# Root migration 0032 collision — owner review required

## Verified source conflict
- `migrations/0032_social_provider_apps.sql`: creates `social_provider_apps` for encrypted OAuth client configuration.
- `migrations/0032_website_ai_inbox.sql`: creates `website_ai_conversations`, `website_ai_messages`, and two indexes.
- There are 40 numbered root migration files, while the approved architecture contract expects 39, with tip `0039`.
- Both SQL files must be preserved until production migration history and actual schema are checked. Neither has been proven safe to delete, rename, or reapply.

## Read-only production verification
1. Obtain a current, restorable D1 backup and the database binding/account mapping.
2. Inspect the production migration journal (`d1_migrations` where present) and list applied names and timestamps; do not modify the journal.
3. Query `sqlite_master` for `social_provider_apps`, `website_ai_conversations`, `website_ai_messages`, `idx_website_ai_messages_date`, and `idx_website_ai_messages_conv`. Compare column definitions and constraints with the two SQL files.
4. Inspect staging and production independently; never infer one from the other.
5. Check all code paths referring to the affected tables and the order in which the deployment workflow applies migrations.
6. Have the owner approve a forward-only reconciliation that preserves existing tables and data, followed by isolated tests, staging verification, and manual production promotion.

## Release gates
Do not disable the architecture or protected-state gate, edit baseline hashes to silence failures, or automatically delete/renumber applied migrations. Unrelated protected auth, CMS, Wrangler, and workflow drift requires separate owner review. A green diagnostic check is not proof of a safe production schema.
