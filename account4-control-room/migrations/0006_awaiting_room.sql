CREATE TABLE IF NOT EXISTS cms_update_previews (
 site TEXT NOT NULL, kind TEXT NOT NULL, entry_key TEXT NOT NULL,
 version INTEGER NOT NULL CHECK(version > 0), actor TEXT NOT NULL,
 previewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(site,kind,entry_key,actor)
);
CREATE INDEX IF NOT EXISTS cms_revisions_location_version ON cms_revisions(site,kind,entry_key,version);
