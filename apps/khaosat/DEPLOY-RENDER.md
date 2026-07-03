# Deploy demo lên Render (miễn phí)

App này đã sẵn sàng deploy bằng **Render Blueprint** — cấu hình nằm ở [`render.yaml`](../../render.yaml)
tại gốc monorepo. Bạn chỉ cần đưa code lên GitHub và bấm connect; Render tự build + chạy.

> Render free tier: đủ cho demo. Dịch vụ **ngủ sau 15 phút** không có truy cập, lần vào lại
> mất ~50 giây khởi động. CSDL là **SQLite trên ổ tạm** — phiếu khảo sát mẫu tự nạp lại mỗi lần
> khởi động, nhưng **phiếu trả lời nhập trong lúc demo sẽ mất khi service deploy lại/khởi động lại**.
> Muốn giữ dữ liệu thật lâu dài → xem mục "Nâng cấp Postgres" cuối trang.

## Bước 1 — Đưa code lên GitHub

Tạo một repo mới trên GitHub (**nên để Private** vì monorepo chứa cả engine harness).
Rồi từ thư mục gốc `f:\starter-kit`:

```bash
git remote add origin https://github.com/<tài-khoản>/<tên-repo>.git
git push -u origin main
```

(Repo đã có sẵn các commit; không cần init lại.)

## Bước 2 — Tạo Blueprint trên Render

1. Đăng ký/đăng nhập **https://render.com** (chọn "Sign in with GitHub" cho nhanh).
2. Dashboard → **New +** → **Blueprint**.
3. Chọn repo vừa push. Render tự tìm thấy `render.yaml` → hiện service **khaosat**.
4. Bấm **Apply**. Render bắt đầu build (khoảng 2–4 phút).

## Bước 3 — Lấy link demo

Khi build xong, service có URL dạng **`https://khaosat-xxxx.onrender.com`**. Các đường dẫn demo:

| Trang | Đường dẫn |
|---|---|
| Trang chủ (danh sách khảo sát) | `/` |
| Phiếu khảo sát mẫu (NQ57) | `/khao-sat/08ded814-7fb7-49cb-8158-e6aafccb16a5` |
| Kết quả công khai | `/khao-sat/08ded814-7fb7-49cb-8158-e6aafccb16a5/ket-qua` |
| Quản trị | `/quan-tri` |

**Khóa quản trị**: `khaosat-demo-2026` (đặt trong `render.yaml`). Đổi ở Render Dashboard →
service → **Environment** → sửa `ADMIN_KEY` nếu cần.

## Cập nhật sau này

`autoDeploy: true` → mỗi lần `git push` lên nhánh `main`, Render tự build lại và deploy.

## (Tùy chọn) Nâng cấp Postgres để giữ dữ liệu thật

SQLite ổ tạm chỉ hợp demo. Muốn phiếu trả lời không mất:

1. Render Dashboard → **New +** → **PostgreSQL** (free) → tạo, copy **Internal Database URL**.
2. Đổi `prisma/schema.prisma`: `provider = "postgresql"`; xoá thư mục `prisma/migrations` cũ (của SQLite)
   rồi tạo lại migration Postgres (`npx prisma migrate dev --name init` với `DATABASE_URL` trỏ Postgres).
3. Trong `render.yaml`, thay `DATABASE_URL` bằng URL Postgres (hoặc set ở Dashboard).
4. `git push` → Render deploy lại. (Free Postgres của Render có giới hạn thời hạn — đọc trang giá của họ.)

## Phương án khác — chỉ deploy riêng thư mục app

Nếu không muốn đưa cả monorepo lên GitHub: tạo repo mới chỉ chứa nội dung `apps/khaosat`,
chuyển `render.yaml` vào gốc repo đó và **bỏ dòng `rootDir: apps/khaosat`**. Các phần còn lại giữ nguyên.
