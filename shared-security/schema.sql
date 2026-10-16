-- Additive security metadata. Existing users, hashes, sessions and website databases are preserved.
CREATE TABLE IF NOT EXISTS security_users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('owner','administrator','editor','member')),status TEXT NOT NULL DEFAULT 'active',password_hash TEXT,salt TEXT,epoch INTEGER NOT NULL DEFAULT 0,created_by TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS security_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,epoch INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS security_tokens(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,purpose TEXT NOT NULL,verifier_hash TEXT NOT NULL DEFAULT '',expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS security_limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS security_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
