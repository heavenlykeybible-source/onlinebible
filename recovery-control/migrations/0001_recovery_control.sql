CREATE TABLE IF NOT EXISTS recovery_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_no TEXT NOT NULL,
  action TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  actor TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recovery_events_account_created ON recovery_events(account_no, created_at DESC);
