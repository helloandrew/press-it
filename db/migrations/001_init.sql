CREATE TABLE IF NOT EXISTS users (
  uuid TEXT PRIMARY KEY,
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  city TEXT NULL
);

CREATE TABLE IF NOT EXISTS clicks (
  id TEXT PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users(uuid)
);

CREATE INDEX IF NOT EXISTS idx_clicks_user_uuid ON clicks(user_uuid);
CREATE INDEX IF NOT EXISTS idx_clicks_user_uuid_clicked_at ON clicks(user_uuid, clicked_at);
