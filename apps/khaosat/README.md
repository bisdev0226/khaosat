# Hệ thống Khảo sát Trực tuyến (khaosat)

Hệ thống khảo sát trực tuyến phục vụ **điều tra dư luận xã hội**, mô phỏng theo hệ thống tham chiếu
`https://dieutradlxh.tuyengiaodanvan.vn/khao-sat/<uuid>`: người dân mở link công khai, điền phiếu,
kết quả tổng hợp hiển thị bằng biểu đồ; quản trị viên tạo/sửa khảo sát, import phiếu JSON, xem và export phiếu trả lời.

## Tính năng

- **Trang điền phiếu công khai** `/khao-sat/:id` với **11 loại câu hỏi**:
  chọn một, chọn nhiều (± "ý kiến khác", ± ràng buộc min/max số lựa chọn), nhập text, nhập số,
  ma trận chọn một, ma trận chọn nhiều, nhóm câu hỏi (câu con), chọn năm,
  chọn tỉnh/thành phố (34 tỉnh thành sau sáp nhập 2025), chọn ngày, có/không.
- Câu hỏi **bắt buộc**; khảo sát có **khung thời gian mở/đóng** (`thoiGianBatDau`/`thoiGianKetThuc`) và cờ `isActive`.
- **Thu thập thông tin người trả lời** tùy chọn (tên, email, điện thoại, năm sinh, địa chỉ, giới tính; bật/tắt từng trường).
- **Trang hoàn thành** sau khi gửi phiếu.
- **Trang kết quả công khai** với biểu đồ thanh — bật/tắt bằng cờ `isViewKQ`.
- **Trang quản trị** `/quan-tri` (khóa bằng `ADMIN_KEY`): CRUD khảo sát, builder câu hỏi,
  import JSON từ hệ thống tham chiếu, danh sách phiếu trả lời, export CSV, sao chép link khảo sát.

## Kiến trúc & cấu trúc thư mục

Node/Express (ESM) + Prisma (SQLite dev / PostgreSQL deploy) + React (Vite).

```
khaosat/
├── server/            # Express API (ESM) + serve client/dist ở chế độ prod
│   └── lib/           # nghiệp vụ: khaoSat, loaiCauHoi, kiemTraPhieu (validate phiếu)
├── client/            # React + Vite (dev :5173, proxy /api + /health → :3000)
├── prisma/            # schema.prisma (SQLite dev), migrations, seed.js
├── data/              # khao-sat-nq57.json — phiếu mẫu thật (giữ nguyên UUID gốc)
├── test/              # vitest + supertest
├── docs/              # tài liệu BMAD: problem / PRD / architecture / evidence
├── deploy/helm/       # Helm chart triển khai K8s (VNPT SmartCloud)
├── Dockerfile         # multi-stage build (node:22-alpine)
└── docker-compose.yml # postgres + redis + adminer (phục vụ Postgres/harness)
```

## Yêu cầu

- Node.js **20+** (khuyến nghị 22)
- (Tùy chọn) Docker — khi dùng Postgres/adminer hoặc chạy AI-SDLC harness

## Cài đặt & chạy

```bash
# 1. Cài dependencies (server + client)
npm install && npm --prefix client install

# 2. Tạo file env
cp .env.example .env

# 3. Tạo CSDL (SQLite dev)
npx prisma migrate deploy

# 4. Nạp dữ liệu mẫu (phiếu NQ57 — giữ nguyên UUID gốc)
npm run seed
```

**Chạy dev** (server :3000 + client :5173, client proxy `/api` về server):

```bash
npm run dev
```

**Chạy prod** (build client rồi server serve tất cả trên :3000):

```bash
npm run build && npm start
```

Sau khi seed, mở phiếu khảo sát mẫu:

- Điền phiếu: <http://localhost:3000/khao-sat/08ded814-7fb7-49cb-8158-e6aafccb16a5>
  (dev qua Vite: đổi cổng thành `5173`)
- Quản trị: <http://localhost:3000/quan-tri> — nhập `ADMIN_KEY` (mặc định `khaosat-admin`, **phải đổi khi triển khai**).

## Biến môi trường

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite dev; đổi sang `postgresql://...` khi deploy |
| `PORT` | `3000` | Cổng HTTP server |
| `ADMIN_KEY` | `khaosat-admin` | Khóa quản trị — **đổi trước khi triển khai thật** |

## API tóm tắt

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/health` | — | Health check |
| GET | `/api/v1/khaosats` | — | Danh sách khảo sát đang mở |
| GET | `/api/v1/khaosats/:id/public` | — | Chi tiết khảo sát để điền phiếu (câu hỏi + đáp án) |
| POST | `/api/v1/ketquakhaosats/public` | — | Nộp phiếu trả lời (validate server-side) |
| GET | `/api/v1/khaosats/:id/thongke` | — | Thống kê kết quả (chỉ khi `isViewKQ=true`) |
| * | `/api/v1/admin/*` | header `x-admin-key` | CRUD khảo sát/câu hỏi, import JSON, danh sách phiếu, export CSV |

## Chuyển sang PostgreSQL (deploy)

1. Sửa `prisma/schema.prisma`: `datasource db { provider = "postgresql" }` (thay `sqlite`).
2. Đặt `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/khaosat"` (Postgres có sẵn trong `docker-compose.yml`: `docker compose up -d postgres`).
3. Tạo lại migration cho Postgres (migration SQLite không tương thích trực tiếp):
   ```bash
   npx prisma migrate dev --name init_postgres   # dev
   npx prisma migrate deploy                     # prod
   npm run seed
   ```
4. Adminer xem CSDL: <http://localhost:8080> (server `postgres`, user/pass `postgres`).

## Test

```bash
npm test        # vitest + supertest (API)
```

## Tích hợp AI-SDLC harness (starter-kit)

Repo này đã có profile `khaosat` trong starter-kit: `starter-kit/harness/profiles/khaosat/`
(hooks bootstrap/migrate/seed/boot/health/ci-gate/e2e theo HOOK-CONTRACT).
`harness/config/lanes.env` trỏ `SOURCE_REPO=/mnt/f/starter-kit/apps/khaosat`, `PROFILE=khaosat`, `DB_PREFIX=khaosat_l`.

Lưu ý khi chạy lane:

- Cần **WSL + Docker** (harness chạy bash, lane dùng Postgres/Redis qua `docker-compose.yml` của repo này).
- Lane chạy trên Postgres ⇒ đổi `provider` trong `prisma/schema.prisma` sang `postgresql` (xem mục trên).
- `ORIGIN_URL` (remote GitLab) trong `lanes.env` đang để trống — điền khi có repo GitLab.
