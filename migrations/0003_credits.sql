ALTER TABLE memberships ADD COLUMN credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
