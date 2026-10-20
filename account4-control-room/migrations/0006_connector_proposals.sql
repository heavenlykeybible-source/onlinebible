-- Candidate only. Run during an approved Account 4 maintenance release.
CREATE TABLE IF NOT EXISTS cms_connector_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site TEXT NOT NULL CHECK(site IN ('account1','account2','account3','account5','account6')),
  revision TEXT NOT NULL CHECK(length(revision)=40),
  summary TEXT NOT NULL,
  changed_paths TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cms_connector_proposals_site_id ON cms_connector_proposals(site,id DESC);
