-- ============================================================
-- MoiMoi POS — Fix Missing Columns
-- Chạy file này trong SQL Editor của Supabase Dashboard
-- ============================================================

-- 1. Thêm cột sort_order vào store_tables (nếu chưa có)
ALTER TABLE store_tables ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- 2. Thêm cột description vào products (nếu chưa có)
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- 3. Thêm các cột thiếu vào orders (nếu chưa có)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_name text DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by text DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS time timestamptz DEFAULT now();

-- 4. Tạo index nếu chưa có
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_time ON orders(time DESC);

-- 5. Enable Realtime (nếu chưa bật)
-- Nếu bạn nhận lỗi "already a member", bỏ qua lỗi đó
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE store_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;

-- 6. Đảm bảo RLS tắt cho tất cả tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_infos DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_requests DISABLE ROW LEVEL SECURITY;

-- Done! Refresh app và thử lại
