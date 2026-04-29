CREATE TABLE IF NOT EXISTS users (
  uuid TEXT PRIMARY KEY,
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  city TEXT NULL
);

CREATE TABLE IF NOT EXISTS click_counts (
  user_uuid TEXT NOT NULL,
  date DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_uuid, date)
);

CREATE INDEX IF NOT EXISTS idx_click_counts_user_uuid ON click_counts(user_uuid);
