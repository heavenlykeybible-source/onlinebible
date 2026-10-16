-- Owner-managed Account 4 identities. Passwords are never stored as plaintext.
CREATE TABLE IF NOT EXISTS control_users (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 display_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('owner','admin','editor','viewer')),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
 password_hash TEXT,
 password_salt TEXT,
 password_iterations INTEGER,
 must_change_password INTEGER NOT NULL DEFAULT 1,
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK((password_hash IS NULL AND password_salt IS NULL AND password_iterations IS NULL)
 OR (password_hash IS NOT NULL AND password_salt IS NOT NULL AND password_iterations >= 210000))
);
CREATE INDEX IF NOT EXISTS idx_control_users_role ON control_users(role,status);
CREATE TABLE IF NOT EXISTS control_user_audit (
 id TEXT PRIMARY KEY,
 actor_id TEXT NOT NULL,
 target_user_id TEXT NOT NULL,
 action TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
