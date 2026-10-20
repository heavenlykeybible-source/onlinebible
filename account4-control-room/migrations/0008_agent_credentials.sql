-- Strictly owner-provisioned individual agent identities. Store token digests only.
CREATE TABLE IF NOT EXISTS cms_agent_credentials (
 token_hash TEXT PRIMARY KEY CHECK(length(token_hash)=64),
 agent_id TEXT NOT NULL UNIQUE,
 allowed_sites TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS cms_agent_request_limits (
 agent_id TEXT NOT NULL,
 window_start INTEGER NOT NULL,
 request_count INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(agent_id,window_start)
);
-- No initial active credentials: owner must provision through a protected channel.
