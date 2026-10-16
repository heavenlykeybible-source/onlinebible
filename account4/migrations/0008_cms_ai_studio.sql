CREATE TABLE IF NOT EXISTS control_cms_documents (
 id TEXT PRIMARY KEY,
 site_id TEXT NOT NULL REFERENCES control_client_sites(id) ON DELETE RESTRICT,
 path TEXT NOT NULL,
 title TEXT NOT NULL,
 body TEXT NOT NULL DEFAULT '',
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','approved')),
 updated_by TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(site_id,path)
);
CREATE TABLE IF NOT EXISTS control_ai_suggestions (
 id TEXT PRIMARY KEY,
 document_id TEXT NOT NULL REFERENCES control_cms_documents(id) ON DELETE CASCADE,
 requested_by TEXT NOT NULL,
 instruction TEXT NOT NULL,
 proposed_body TEXT NOT NULL,
 base_version INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
