# P1 — Architecture — Hệ thống Khảo sát Trực tuyến

> BMAD `bmad-create-architecture`: API · Data · Security · Deployment. Gate: Architect/Tech Lead.

## Thành phần

```
Trình duyệt ──► React (Vite) client ──► Express API (server/, ESM, :3000) ──► Prisma ──► SQLite (dev)
                 /khao-sat/:id            /api/v1/*  +  /health                          └► PostgreSQL (deploy)
                 /quan-tri                serve client/dist ở prod
```

- **Dev**: 2 tiến trình — Vite :5173 (proxy `/api`, `/health` → :3000) + Express :3000.
- **Prod**: 1 tiến trình — Express :3000 serve luôn `client/dist` (SPA fallback).
- Nghiệp vụ tách trong `server/lib/`: `khaoSat.js`, `loaiCauHoi.js`, `kiemTraPhieu.js` (validate phiếu).

## API
- `GET /health` — health check (probe K8s, harness).
- `GET /api/v1/khaosats` — danh sách khảo sát đang mở.
- `GET /api/v1/khaosats/:id/public` — chi tiết khảo sát để điền (câu hỏi cây + đáp án).
- `POST /api/v1/ketquakhaosats/public` — nộp phiếu (validate server-side).
- `GET /api/v1/khaosats/:id/thongke` — thống kê (chỉ khi `isViewKQ`).
- `/api/v1/admin/*` — CRUD khảo sát/câu hỏi, import JSON, danh sách phiếu, export CSV (header `x-admin-key`).

## Data (Prisma)

| Model | Vai trò | Điểm đáng chú ý |
|---|---|---|
| `KhaoSat` | Khảo sát | khung thời gian, `isActive`, `isViewKQ`, các cờ thu thập thông tin người trả lời |
| `CauHoi` | Câu hỏi | `maLoaiCauHoi` (2–12 = 11 loại), **cây** qua `cauHoiChaId` (nhóm câu hỏi + hàng của ma trận), `isBatBuoc`, `isLyDoKhac`, `soLuongTraLoiMin/Max`, `maxLength` |
| `CauTraLoi` | Đáp án | phương án cho chọn một/nhiều, cột của ma trận |
| `KetQua` | Một phiếu nộp | `nguoiKhaoSat` = JSON thông tin người trả lời (tùy chọn) |
| `ChiTietKetQua` | Một câu trả lời trong phiếu | trỏ `cauHoiId` + (`cauTraLoiId` hoặc `noiDung` text/số/năm/tỉnh/ngày), `isKhac` cho "ý kiến khác" |

- Quan hệ cascade delete từ `KhaoSat` xuống toàn bộ cây; migration bằng `prisma migrate`.
- **SQLite dev ↔ PostgreSQL prod**: cùng schema, chỉ đổi `provider` trong `prisma/schema.prisma`
  + `DATABASE_URL`; migration tạo lại theo từng provider. Không dùng kiểu dữ liệu đặc thù provider.
- Seed: `prisma/seed.js` nạp `data/khao-sat-nq57.json`, **giữ nguyên UUID gốc**
  `08ded814-7fb7-49cb-8158-e6aafccb16a5` để link mẫu ổn định.

## Security
- Admin bằng `ADMIN_KEY` (header `x-admin-key`); mặc định `khaosat-admin` — **bắt buộc đổi khi triển khai**; prod đặt qua K8s Secret.
- Validate phiếu **server-side** (`kiemTraPhieu`): bắt buộc, min/max, loại giá trị — không tin dữ liệu client.
- Header/footer/logo HTML của khảo sát chỉ admin được nhập (rủi ro XSS giới hạn ở người giữ khóa); export CSV escape đúng chuẩn.
- Không log PII người trả lời; secret chỉ qua env/K8s Secret, không hardcode.

## Deployment (VNPT SmartCloud)
- `Dockerfile` multi-stage (node:22-alpine): build client + prisma generate → runtime chạy `node server/index.js`, `EXPOSE 3000`.
- `deploy/helm/`: chart chung của starter-kit — `values.yaml` đặt `nameOverride=khaosat`,
  `targetPort=3000`, `healthPath=/health`, `DATABASE_URL`/`ADMIN_KEY` qua Secret;
  Job pre-install/upgrade chạy `npx prisma migrate deploy && npm run seed`.
- Đường đi: Dockerfile → Container Registry → Helm → VKS → Ingress `khaosat.<team>.smartcloud.vn`.
- Managed: PostgreSQL (bắt buộc), Redis (dùng cho harness/tương lai). CI/CD: GitLab.
- Dev phụ trợ: `docker-compose.yml` (postgres:16, redis:7, adminer).
