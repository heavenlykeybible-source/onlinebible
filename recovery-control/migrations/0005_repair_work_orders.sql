-- Surgical repair tracking for Accounts 1-3.
-- This stores metadata only. It never stores API keys, provider secrets or source payloads.
CREATE TABLE IF NOT EXISTS account4_repair_work_orders(
 id TEXT PRIMARY KEY,
 account_no TEXT NOT NULL CHECK(account_no IN ('1','2','3')),
 component TEXT NOT NULL,
 problem_statement TEXT NOT NULL,
 requested_by TEXT NOT NULL,
 assigned_provider TEXT CHECK(assigned_provider IS NULL OR assigned_provider IN ('chatgpt','claude','gemini','custom','human')),
 baseline_sha TEXT CHECK(baseline_sha IS NULL OR length(baseline_sha)=40),
 candidate_sha TEXT CHECK(candidate_sha IS NULL OR length(candidate_sha)=40),
 package_id TEXT REFERENCES account4_packages(id),
 status TEXT NOT NULL DEFAULT 'diagnosing' CHECK(status IN ('diagnosing','repairing','quarantined','testing','preview-ready','awaiting-owner','approved','deploying','verified','failed','cancelled')),
 scope_json TEXT NOT NULL,
 tests_json TEXT NOT NULL DEFAULT '[]',
 preview_url TEXT,
 rollback_sha TEXT CHECK(rollback_sha IS NULL OR length(rollback_sha)=40),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_account4_repair_account_status ON account4_repair_work_orders(account_no,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS account4_repair_events(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 work_order_id TEXT NOT NULL REFERENCES account4_repair_work_orders(id),
 event_type TEXT NOT NULL,
 actor TEXT NOT NULL,
 detail TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_account4_repair_events_work_order ON account4_repair_events(work_order_id,id DESC);
