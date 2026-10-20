-- Owner-controlled connection registry. Metadata only; never put API keys here.
CREATE TABLE IF NOT EXISTS cms_provider_connections (
 id TEXT PRIMARY KEY,
 site TEXT NOT NULL CHECK (site IN ('account1','account2','account3','account5','account6')),
 provider TEXT NOT NULL CHECK (provider IN ('cloudflare','github','site-api')),
 label TEXT NOT NULL,
 account_ref TEXT NOT NULL,
 resource_ref TEXT NOT NULL,
 allowed_roles TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0,1)),
 verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cms_provider_connections_site ON cms_provider_connections(site,provider);
-- Do not seed automatic connections. Owner provisions verified rows out-of-band.
