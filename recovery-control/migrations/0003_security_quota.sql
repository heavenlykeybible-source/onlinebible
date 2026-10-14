-- Strongly consistent owner security state and upload rate limits.
CREATE TABLE IF NOT EXISTS account4_security_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS account4_intake_quota(
  actor TEXT NOT NULL,
  day TEXT NOT NULL,
  uploads INTEGER NOT NULL DEFAULT 0,
  used_bytes INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(actor,day),
  CHECK(uploads>=0 AND used_bytes>=0)
);
