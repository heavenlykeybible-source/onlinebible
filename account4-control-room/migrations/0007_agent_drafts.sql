-- Pending AI-to-Control-Room CMS draft handoffs. No automatic publishing.
CREATE TABLE IF NOT EXISTS cms_agent_drafts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 site TEXT NOT NULL CHECK(site IN ('account1','account2','account3','account5','account6')),
 kind TEXT NOT NULL CHECK(kind IN ('page','menu','footer')),
 entry_key TEXT NOT NULL,
 document_json TEXT NOT NULL,
 description TEXT NOT NULL,
 submitted_by TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','rejected')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewed_at TEXT,
 reviewed_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_cms_agent_drafts_site ON cms_agent_drafts(site,status,id DESC);
