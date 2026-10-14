-- Durable security audit for Account 4 connector administration.
-- Tokens themselves are never stored here; only provider/action metadata.
CREATE TABLE IF NOT EXISTS account4_connector_audit(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 provider TEXT NOT NULL CHECK(provider IN ('chatgpt','claude','gemini','custom')),
 action TEXT NOT NULL CHECK(action IN ('rotate','revoke')),
 actor TEXT NOT NULL DEFAULT 'dashboard-admin',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_account4_connector_audit_recent
 ON account4_connector_audit(created_at DESC,id DESC);
