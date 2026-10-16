-- Account 4: isolated multi-tenant client account registry. No production migration applied.
CREATE TABLE IF NOT EXISTS control_clients (
 id TEXT PRIMARY KEY,
 display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 160),
 slug TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','archived')),
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS control_client_sites (
 id TEXT PRIMARY KEY,
 client_id TEXT NOT NULL REFERENCES control_clients(id) ON DELETE RESTRICT,
 name TEXT NOT NULL,
 hostname TEXT NOT NULL,
 cloudflare_connection_id TEXT,
 worker_name TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','suspended')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(client_id,hostname)
);
CREATE INDEX IF NOT EXISTS idx_control_client_sites_client ON control_client_sites(client_id);
CREATE TABLE IF NOT EXISTS control_client_members (
 client_id TEXT NOT NULL REFERENCES control_clients(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('client_admin','editor','viewer')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(client_id,user_id)
);
CREATE TABLE IF NOT EXISTS control_client_releases (
 id TEXT PRIMARY KEY,
 site_id TEXT NOT NULL REFERENCES control_client_sites(id) ON DELETE RESTRICT,
 artifact_sha256 TEXT NOT NULL,
 preview_url TEXT,
 status TEXT NOT NULL CHECK(status IN ('draft','building','preview','rejected','approved','deploying','deployed','failed')),
 submitted_by TEXT NOT NULL,
 approved_by TEXT,
 approved_at TEXT,
 deployed_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(status NOT IN ('approved','deploying','deployed') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_control_client_releases_site ON control_client_releases(site_id,created_at);
