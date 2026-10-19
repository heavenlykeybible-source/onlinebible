-- Moderation-only screening and reversible member enforcement. No existing data/status reset.
CREATE TABLE IF NOT EXISTS screening_jobs (
 job_id TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(user_id),request_hash TEXT NOT NULL,
 surface TEXT NOT NULL,content_text TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','allow','hold','block')),
 category TEXT NOT NULL DEFAULT 'pending',explanation TEXT NOT NULL DEFAULT '',confidence REAL NOT NULL DEFAULT 0,
 attempts INTEGER NOT NULL DEFAULT 0,lease_token TEXT,lease_until TEXT,next_attempt_at TEXT NOT NULL DEFAULT (datetime('now')),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),reviewed_at TEXT,reviewer_user_id INTEGER REFERENCES users(user_id),
 UNIQUE(user_id,request_hash)
);
CREATE INDEX IF NOT EXISTS screening_pending ON screening_jobs(status,next_attempt_at,lease_until);
CREATE TABLE IF NOT EXISTS community_strikes (
 strike_id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(user_id),job_id TEXT NOT NULL UNIQUE REFERENCES screening_jobs(job_id),
 evidence_hash TEXT NOT NULL,category TEXT NOT NULL,reason TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','overturned')),
 actor_user_id INTEGER REFERENCES users(user_id),created_at TEXT NOT NULL DEFAULT (datetime('now')),overturned_at TEXT,
 UNIQUE(user_id,evidence_hash)
);
CREATE INDEX IF NOT EXISTS community_strikes_member ON community_strikes(user_id,status,created_at);
CREATE TABLE IF NOT EXISTS screening_appeals (
 appeal_id INTEGER PRIMARY KEY AUTOINCREMENT,job_id TEXT NOT NULL UNIQUE REFERENCES screening_jobs(job_id),user_id INTEGER NOT NULL REFERENCES users(user_id),
 details TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','upheld','overturned')),
 response TEXT,reviewer_user_id INTEGER REFERENCES users(user_id),created_at TEXT NOT NULL DEFAULT (datetime('now')),reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS screening_audit (
 audit_id INTEGER PRIMARY KEY AUTOINCREMENT,actor_user_id INTEGER REFERENCES users(user_id),job_id TEXT REFERENCES screening_jobs(job_id),action TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Transactional insert notifications: a retry cannot send a second warning for the same strike.
CREATE TRIGGER IF NOT EXISTS screening_strike_notice AFTER INSERT ON community_strikes
BEGIN
 INSERT INTO notifications(user_id,kind,title,body,href) VALUES(NEW.user_id,'community_warning','Community rule violation confirmed',NEW.reason||' Open Safety & privacy for your current restriction and appeal options.','/safety.html');
END;
