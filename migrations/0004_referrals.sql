ALTER TABLE users ADD COLUMN invite_code TEXT;
ALTER TABLE users ADD COLUMN invited_by INTEGER;
ALTER TABLE users ADD COLUMN invite_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
