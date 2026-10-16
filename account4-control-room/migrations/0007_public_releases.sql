-- Account 4 review metadata only. No website/member database is attached or modified.
CREATE TABLE IF NOT EXISTS cms_releases (
 id TEXT PRIMARY KEY,target TEXT NOT NULL,title TEXT NOT NULL,source TEXT NOT NULL,
 source_sha TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,arrived_at TEXT NOT NULL,
 ready INTEGER NOT NULL DEFAULT 0,manifest TEXT NOT NULL,edits TEXT NOT NULL DEFAULT '{}',
 theme TEXT NOT NULL DEFAULT '{}',approved_at TEXT,approved_by TEXT,
 UNIQUE(target,source_sha)
);
CREATE TABLE IF NOT EXISTS cms_release_previews (
 release_id TEXT NOT NULL,actor TEXT NOT NULL,revision INTEGER NOT NULL,
 PRIMARY KEY(release_id,actor)
);
CREATE TABLE IF NOT EXISTS cms_active_releases (
 target TEXT PRIMARY KEY,release_id TEXT NOT NULL,revision INTEGER NOT NULL,activated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_release_checks (
 release_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,working INTEGER NOT NULL,checked_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_release_uploads (
 release_id TEXT NOT NULL,sha256 TEXT NOT NULL,size INTEGER NOT NULL,
 PRIMARY KEY(release_id,sha256)
);
CREATE TABLE IF NOT EXISTS cms_release_baselines (
 release_id TEXT NOT NULL,site TEXT NOT NULL,kind TEXT NOT NULL,entry_key TEXT NOT NULL,
 revision_version INTEGER NOT NULL,
 PRIMARY KEY(release_id,site,kind,entry_key)
);
