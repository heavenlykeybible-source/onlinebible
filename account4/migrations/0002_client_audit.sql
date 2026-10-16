-- Account 4 client registry audit records, separate from public-site audit.
CREATE TABLE IF NOT EXISTS control_client_audit (
 id TEXT PRIMARY KEY,
 actor_user_id TEXT NOT NULL,
 client_id TEXT,
 site_id TEXT,
 action TEXT NOT NULL,
 detail_json TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(client_id) REFERENCES control_clients(id) ON DELETE RESTRICT,
 FOREIGN KEY(site_id) REFERENCES control_client_sites(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_control_client_audit_client_time ON control_client_audit(client_id,created_at);
CREATE INDEX IF NOT EXISTS idx_control_client_audit_site_time ON control_client_audit(site_id,created_at);
