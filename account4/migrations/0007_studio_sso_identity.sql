-- Atomic redemption returns the verified identity via UPDATE RETURNING.
-- Ticket remains single-use, expires after 60 seconds, and is never persisted in plaintext.
-- Run after 0005_studio_sso.sql.
CREATE INDEX IF NOT EXISTS idx_control_studio_tickets_owner ON control_studio_tickets(owner_user_id);
