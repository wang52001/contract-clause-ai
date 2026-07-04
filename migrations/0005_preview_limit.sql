CREATE TABLE IF NOT EXISTS user_previews (
  user_id INTEGER PRIMARY KEY,
  result TEXT NOT NULL,
  risk TEXT NOT NULL,
  meta TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_previews_user_id ON user_previews(user_id);
