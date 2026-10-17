-- Additive. Existing users and credential hashes remain intact.
ALTER TABLE security_users ADD COLUMN username TEXT;
CREATE UNIQUE INDEX security_users_username ON security_users(username) WHERE username IS NOT NULL;
UPDATE security_users SET username='owner' WHERE role='owner' AND username IS NULL AND (SELECT count(*) FROM security_users WHERE role='owner')=1;
CREATE TABLE IF NOT EXISTS security_installations(token_hash TEXT PRIMARY KEY,completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
