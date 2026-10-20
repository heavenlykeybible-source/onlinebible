-- Unified Heavenly Key website/blog publishing and social distribution.
CREATE TABLE IF NOT EXISTS blog_posts (
  post_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','publishing','published','archived')),
  scheduled_at TEXT,
  published_at TEXT,
  share_to_social INTEGER NOT NULL DEFAULT 1 CHECK (share_to_social IN (0,1)),
  social_share_status TEXT NOT NULL DEFAULT 'not_requested' CHECK (social_share_status IN ('not_requested','pending','queued','partial','failed','complete')),
  social_share_error TEXT,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  FOREIGN KEY (updated_by) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publication ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_schedule ON blog_posts(status, scheduled_at);
