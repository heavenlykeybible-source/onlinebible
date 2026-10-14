-- Permanent immutable direct-upload intake; uploaded bytes are never executed.
CREATE TABLE IF NOT EXISTS account4_packages (
 id TEXT PRIMARY KEY,
 account_no TEXT NOT NULL CHECK(account_no IN ('1','2','3')),
 name TEXT NOT NULL,
 source TEXT NOT NULL DEFAULT 'dashboard' CHECK(source IN ('dashboard','chatgpt','claude','gemini','github')),
 package_kind TEXT NOT NULL DEFAULT 'source-zip' CHECK(package_kind IN ('source-zip','theme-zip','source-proposal')),
 sha256 TEXT NOT NULL,
 object_key TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK(size_bytes>0 AND size_bytes<=8388608),
 file_count INTEGER NOT NULL CHECK(file_count>=1 AND file_count<=200),
 status TEXT NOT NULL DEFAULT 'quarantined' CHECK(status IN ('quarantined','rejected','building','validated','preview-ready','published')),
 validation_summary TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_account4_packages_recent ON account4_packages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account4_packages_target ON account4_packages(account_no,created_at DESC);
CREATE TABLE IF NOT EXISTS account4_package_events(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 package_id TEXT NOT NULL REFERENCES account4_packages(id),
 event_type TEXT NOT NULL,
 actor TEXT NOT NULL,
 message TEXT NOT NULL,
 at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_account4_events_package ON account4_package_events(package_id,id DESC);
