# P1 — Problem Brief — Hệ thống Khảo sát Trực tuyến

> BMAD `bmad-product-brief`: Problem · User · Value · Metric. Gate: BA/PM.

## Problem
Công tác điều tra dư luận xã hội hiện phụ thuộc phiếu giấy hoặc hệ thống tập trung
(dieutradlxh.tuyengiaodanvan.vn) mà đơn vị không tự chủ được: khó tự tạo phiếu, khó tùy biến,
tổng hợp thủ công chậm và dễ sai. Cần một hệ thống khảo sát trực tuyến tự vận hành,
tương thích cấu trúc phiếu của hệ thống tham chiếu (import JSON dùng lại phiếu sẵn có),
phát phiếu qua link công khai và tổng hợp kết quả tức thời.

## Users
- **Người dân / người được khảo sát**: mở link `/khao-sat/<uuid>` trên điện thoại/máy tính,
  điền phiếu nhanh, không cần tài khoản.
- **Cán bộ quản trị khảo sát**: tạo/sửa phiếu (11 loại câu hỏi), đặt khung thời gian,
  import phiếu JSON từ hệ thống tham chiếu, theo dõi phiếu trả lời, export CSV.
- **Lãnh đạo / bộ phận tổng hợp**: xem kết quả tổng hợp dạng biểu đồ (khi được bật công khai).

## Value
- Bỏ khâu nhập liệu tay: phiếu trả lời vào thẳng CSDL, thống kê tức thời.
- Tái sử dụng phiếu của hệ thống tham chiếu qua import JSON — không soạn lại từ đầu.
- Tự chủ hạ tầng: SQLite chạy ngay khi dev, PostgreSQL khi triển khai; deploy container/Helm.

## Metric
- Thời gian phát hành một phiếu khảo sát mới: từ hàng giờ (giấy) → **< 15 phút** (import/builder).
- Thời gian có số liệu tổng hợp sau khi đóng khảo sát: từ hàng ngày → **tức thời** (trang thống kê).
- 100% phiếu nộp được validate server-side (bắt buộc, min/max) — loại phiếu không hợp lệ ngay từ đầu.
