-- One-time Studio launch tickets. Never store the plaintext ticket.
CREATE TABLE IF NOT EXISTS control_studio_tickets (
 ticket_hash TEXT PRIMARY KEY CHECK(length(ticket_hash)=64),
 owner_user_id TEXT NOT NULL,
 audience TEXT NOT NULL DEFAULT 'studio' CHECK(audience='studio'),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expires_at INTEGER NOT NULL,
 consumed_at INTEGER,
 CHECK(consumed_at IS NULL OR consumed_at>0)
);
CREATE INDEX IF NOT EXISTS idx_control_studio_tickets_expiry ON control_studio_tickets(expires_at);
