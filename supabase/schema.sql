-- ============================================================
-- MoiMoi POS — Supabase Schema
-- Chạy toàn bộ file này trong SQL Editor của Supabase Dashboard
-- ============================================================

-- 1. USERS
create table if not exists users (
  username        text primary key,
  pass            text not null,
  role            text not null check (role in ('sadmin','admin','staff')),
  fullname        text default '',
  phone           text default '',
  avatar          text default '',
  is_premium      boolean default false,
  expires_at      timestamptz,
  created_by      text,
  show_vip_expired   boolean default false,
  show_vip_congrat   boolean default false,
  created_at      timestamptz default now()
);

-- Insert sadmin mặc định (chỉ chạy lần đầu)
insert into users (username, pass, role, fullname, is_premium)
values ('sadmin', '1', 'sadmin', 'Super Admin', true)
on conflict (username) do nothing;

-- 2. STORE_INFOS
create table if not exists store_infos (
  store_id     text primary key,
  name         text default '',
  phone        text default '',
  address      text default '',
  logo_url     text default '',
  bank_id      text default '',
  bank_account text default '',
  bank_owner   text default '',
  is_premium   boolean default false
);

-- Insert sadmin store
insert into store_infos (store_id, name, is_premium)
values ('sadmin', 'Nhà Hàng Của Tôi', true)
on conflict (store_id) do nothing;

-- 3. STORE_TABLES
create table if not exists store_tables (
  id         uuid primary key default gen_random_uuid(),
  store_id   text not null,
  name       text not null,
  sort_order int default 0
);
create index if not exists idx_store_tables_store_id on store_tables(store_id);

-- 4. CATEGORIES
create table if not exists categories (
  id       text primary key,
  store_id text not null,
  name     text not null
);
create index if not exists idx_categories_store_id on categories(store_id);

-- 5. PRODUCTS
create table if not exists products (
  id          text primary key,
  store_id    text not null,
  name        text not null,
  price       numeric default 0,
  image       text default '',
  category    text default '',
  description text default ''
);
create index if not exists idx_products_store_id on products(store_id);

-- 6. ORDERS
create table if not exists orders (
  id             text primary key,
  store_id       text not null,
  table_name     text default '',
  status         text default 'pending',
  payment_status text default 'unpaid',
  total_amount   numeric default 0,
  created_by     text default '',
  time           timestamptz default now(),
  items          jsonb default '[]'::jsonb
);
create index if not exists idx_orders_store_id on orders(store_id);
create index if not exists idx_orders_time on orders(time desc);

-- 7. NOTIFICATIONS
create table if not exists notifications (
  id      text primary key,
  user_id text not null,
  title   text default '',
  message text default '',
  time    timestamptz default now(),
  read    boolean default false
);
create index if not exists idx_notifications_user_id on notifications(user_id);

-- 8. UPGRADE_REQUESTS
create table if not exists upgrade_requests (
  id          text primary key,
  username    text not null,
  plan_index  int default 0,
  plan_name   text default '',
  months      int default 1,
  time        timestamptz default now()
);

-- ============================================================
-- Enable Realtime cho các bảng cần sync live
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table store_tables;
alter publication supabase_realtime add table categories;

-- ============================================================
-- Row Level Security: TẮT (app tự quản lý quyền bằng logic)
-- ============================================================
alter table users disable row level security;
alter table store_infos disable row level security;
alter table store_tables disable row level security;
alter table categories disable row level security;
alter table products disable row level security;
alter table orders disable row level security;
alter table notifications disable row level security;
alter table upgrade_requests disable row level security;
