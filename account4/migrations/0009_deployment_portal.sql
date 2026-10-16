-- Explicit deployment destinations. Never infer an account or worker from user-supplied code.
CREATE TABLE IF NOT EXISTS control_deployment_targets (
 id TEXT PRIMARY KEY,
 label TEXT NOT NULL,
 target_kind TEXT NOT NULL CHECK(target_kind IN ('worker','pages')),
 cloudflare_account_id TEXT NOT NULL,
 cloudflare_project_name TEXT NOT NULL,
 production_url TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(cloudflare_account_id,target_kind,cloudflare_project_name)
);
CREATE TABLE IF NOT EXISTS control_deployment_jobs (
 id TEXT PRIMARY KEY,
 target_id TEXT NOT NULL REFERENCES control_deployment_targets(id),
 source_ref TEXT NOT NULL,
 source_sha256 TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','deploying','succeeded','failed')),
 requested_by TEXT NOT NULL,
 approved_by TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 approved_at TEXT,
 completed_at TEXT,
 error_code TEXT
);
CREATE INDEX IF NOT EXISTS idx_deployment_jobs_target ON control_deployment_jobs(target_id,created_at);
