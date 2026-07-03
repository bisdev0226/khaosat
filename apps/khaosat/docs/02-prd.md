# P1 — PRD mini — Hệ thống Khảo sát Trực tuyến

> BMAD `bmad-create-prd`: Scope · Use cases · Acceptance Criteria · NFR. Gate: PM/PO.

## Scope
1. Trang điền phiếu công khai `/khao-sat/:id` — 11 loại câu hỏi: chọn một, chọn nhiều
   (± "ý kiến khác", ± min/max), nhập text, nhập số, ma trận chọn một, ma trận chọn nhiều,
   nhóm câu hỏi, chọn năm, chọn tỉnh/thành (34 tỉnh sau sáp nhập 2025), chọn ngày, có/không.
2. Ràng buộc phiếu: câu bắt buộc, khung thời gian mở/đóng, cờ `isActive`;
   thu thập thông tin người trả lời tùy chọn (tên/email/điện thoại/năm sinh/địa chỉ/giới tính).
3. Trang hoàn thành sau khi nộp; trang kết quả công khai (biểu đồ thanh, bật/tắt bằng `isViewKQ`).
4. Quản trị `/quan-tri` (khóa `ADMIN_KEY`): CRUD khảo sát, builder câu hỏi,
   import JSON từ hệ thống tham chiếu, danh sách phiếu, export CSV, sao chép link.
5. API công khai + admin (`x-admin-key`), health check `/health`.

## Use cases + Acceptance Criteria
- **UC1 — Người dân điền phiếu**: mở `/khao-sat/:id`, trả lời, nộp.
  - *AC*: câu bắt buộc bỏ trống ⇒ chặn nộp kèm thông báo; chọn nhiều vi phạm min/max ⇒ chặn;
    nộp hợp lệ ⇒ chuyển trang hoàn thành; khảo sát ngoài khung thời gian hoặc `isActive=false` ⇒ không cho điền.
- **UC2 — Xem kết quả công khai**: mở trang kết quả của khảo sát.
  - *AC*: `isViewKQ=true` ⇒ biểu đồ thanh theo từng câu hỏi với số lượng/phần trăm;
    `isViewKQ=false` ⇒ trả về từ chối, không lộ số liệu.
- **UC3 — Quản trị tạo khảo sát**: đăng nhập bằng `ADMIN_KEY`, tạo khảo sát + câu hỏi bằng builder.
  - *AC*: đủ 11 loại câu hỏi; lưu xong xuất hiện ở danh sách; sao chép được link công khai.
- **UC4 — Import phiếu tham chiếu**: dán JSON export từ dieutradlxh.tuyengiaodanvan.vn.
  - *AC*: import phiếu mẫu `data/khao-sat-nq57.json` giữ nguyên UUID gốc
    `08ded814-7fb7-49cb-8158-e6aafccb16a5`; đủ câu hỏi/đáp án/cấu trúc cây và ma trận.
- **UC5 — Xem & export phiếu trả lời**: admin xem danh sách phiếu, export CSV.
  - *AC*: CSV đủ các câu trả lời (kể cả "ý kiến khác"), escape đúng chuẩn CSV, mở được bằng Excel.
- **UC6 — Gọi API sai khóa admin**: request `/api/v1/admin/*` thiếu/sai `x-admin-key`.
  - *AC*: trả 401/403, không lộ dữ liệu.

## NFR (phi chức năng)
- **Bảo mật**: validate phiếu server-side (không tin client); admin qua `x-admin-key`
  (`ADMIN_KEY` phải đổi khi triển khai); header/footer HTML chỉ admin nhập; không log PII người trả lời.
- **Hiệu năng**: trang điền phiếu và nộp phiếu đáp ứng < 1s ở tải thường; thống kê tính bằng truy vấn tổng hợp.
- **Khả kiểm**: test API (vitest + supertest); evidence theo `docs/04-evidence.md`; CI gate qua harness.
- **Tuân thủ / vận hành**: SQLite dev ↔ PostgreSQL prod chỉ bằng đổi provider + `DATABASE_URL`;
  container hóa (Dockerfile + Helm); health check `/health`.

## Phụ lục — Đặc tả nghiệp vụ phiếu khảo sát (phân tích từ hệ thống tham chiếu)

### Loại câu hỏi (`maLoaiCauHoi` — giữ mã tương thích hệ thống tham chiếu)
| Mã | Loại | Cách trả lời | Ghi chú |
|---|---|---|---|
| 2 | Chọn nhiều (MultiChoice) | checkbox nhiều phương án | hỗ trợ `soLuongTraLoiMin/Max`, "ý kiến khác" |
| 3 | Chọn một (OneChoice) | radio một phương án | hỗ trợ "ý kiến khác" (`isLyDoKhac`) |
| 4 | Nhập text | textarea tự do | `maxLength` tùy chọn |
| 5 | Ma trận chọn nhiều (MultiChoice Group) | checkbox theo ô | hàng = câu hỏi con, cột = đáp án của câu cha |
| 6 | Ma trận chọn một (OneChoice Group) | radio mỗi hàng một ô | như trên, mỗi hàng chọn đúng 1 cột |
| 7 | Nhóm câu hỏi | không trả lời trực tiếp | chứa các câu con (đánh số N.1, N.2…) |
| 8 | Nhập số | input số | server kiểm tra là số hợp lệ |
| 9 | Có / Không | radio 2 phương án | xử lý như chọn một |
| 10 | Chọn năm | select 1930→hiện tại | server kiểm tra 1900–2100 |
| 11 | Chọn tỉnh/thành phố | select 34 tỉnh/thành (sau sáp nhập 2025) | lưu dạng text |
| 12 | Chọn ngày | date picker | lưu dạng text ISO |

### Cấu trúc phiếu & ngữ nghĩa ma trận
- Câu hỏi là **cây** (`cauHoiChaId`): nhóm (7) chứa câu con; ma trận (5/6) có **hàng = `cauHoiCon`**,
  **cột = `cauTraLoi` của câu cha** — đúng cấu trúc JSON của hệ thống tham chiếu.
- Thứ tự hiển thị theo `thuTu` ở mọi cấp; chỉ câu `isActive` được phát hành.
- Phiếu nộp = `KetQua` + nhiều `ChiTietKetQua {cauHoiId, cauTraLoiId? | noiDung?, isKhac?}`;
  hàng ma trận ghi nhận theo id câu con + id cột.

### Luật validate (áp dụng cả client lẫn server — server là chuẩn)
1. Khảo sát chỉ nhận phiếu khi `isActive` và trong khung `thoiGianBatDau–thoiGianKetThuc` (403 nếu vi phạm).
2. Câu `isBatBuoc` phải có trả lời; ma trận cha bắt buộc ⇒ **mọi hàng** phải có trả lời.
3. Chọn một/Có-Không: tối đa 1 lựa chọn; phương án phải thuộc đúng câu hỏi (chống giả mạo id).
4. Chọn nhiều: trong khoảng `soLuongTraLoiMin/Max` nếu khai báo; không trùng phương án.
5. "Ý kiến khác" chỉ hợp lệ khi câu bật `isLyDoKhac` và phải kèm nội dung text.
6. Nhập số phải là số; năm trong 1900–2100; text tôn trọng `maxLength`; nhóm (7) không nhận trả lời trực tiếp.
7. Thông tin người trả lời: chỉ nhận các trường được bật cờ; bắt buộc khi `isNhapThongTinRequired`.

### Tương thích hệ thống tham chiếu (dieutradlxh.tuyengiaodanvan.vn)
- Import JSON export của hệ thống tham chiếu: map `phieuKhaoSatTieuDe/Header/Footer/Logo/Background`
  → `tieuDe/header/footer/logo/background`; nhãn `loaiCauHoi` tiếng Việt hoặc mã `maLoaiCauHoi` đều nhận.
- Giữ nguyên UUID gốc khi import lần đầu ⇒ link `/khao-sat/<uuid>` giống hệ thống gốc.
- API cùng ngữ nghĩa: `GET /api/v1/khaosats/:id/public`, `POST /api/v1/ketquakhaosats/public`.
