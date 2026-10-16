CREATE TABLE IF NOT EXISTS member_password_resets(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at INTEGER NOT NULL);
