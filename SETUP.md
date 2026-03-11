# Hướng dẫn kết nối Supabase cho MoiMoi POS

## 1. Clone code về máy

```bash
git clone https://github.com/nma2k5rinrin-dev/moimoi-pos.git
cd moimoi-pos
npm install
```

## 2. Tạo project Supabase

1. Truy cập [supabase.com](https://supabase.com) → **New Project**
2. Chọn region gần nhất (Singapore hoặc Tokyo)
3. Đặt tên project và password → tạo xong đợi ~1-2 phút

## 3. Chạy Database Schema

1. Vào **Supabase Dashboard → SQL Editor**
2. Mở file `supabase/schema.sql` → copy toàn bộ nội dung → paste vào SQL Editor → **Run**
3. Kiểm tra **Table Editor** — phải thấy đủ 8 bảng:
   - `users`, `store_infos`, `store_tables`, `categories`
   - `products`, `orders`, `notifications`, `upgrade_requests`

## 4. Lấy API Keys

1. Vào **Settings → API** trong Supabase Dashboard
2. Copy:
   - **Project URL** → vd: `https://abcxyz.supabase.co`
   - **anon public key** → chuỗi dài bắt đầu bằng `eyJ...`

## 5. Cấu hình `.env`

Tạo file `.env` tại thư mục gốc (copy từ `.env.example`):

```bash
cp .env.example .env
```

Điền vào:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
```

## 6. Bật Realtime

1. Vào **Supabase Dashboard → Database → Replication**
2. Bật Realtime cho tất cả các bảng (hoặc schema.sql đã tự làm điều này)

## 7. Chạy development server

```bash
npm run dev
```

Truy cập [http://localhost:5173](http://localhost:5173)

---

## Tài khoản mặc định

| Username | Password | Quyền |
|----------|----------|-------|
| `sadmin` | `1` | Super Admin |

---

## Lưu ý quan trọng

- File `.env` **không được commit** lên Git (đã có trong `.gitignore`)
- Mỗi máy mới cần tạo file `.env` riêng với cùng API keys
- Tất cả data được lưu trên Supabase cloud → đồng bộ tự động giữa các máy
- Nếu muốn test offline (không có Supabase): để `.env` với URL placeholder, app sẽ dùng local mode với sadmin/1
