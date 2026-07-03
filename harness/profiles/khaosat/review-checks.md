# Senior-gate / review checks — khaosat (Node/Express + Prisma + React)

Ưu tiên VNPT-Review-Bot: `get_review_guidelines` + `get_atbm_remediation_guidelines`.

- Prisma: đổi schema ⇒ có migration (`prisma migrate`); không dùng `db push` cho prod.
- Async/await đúng; không nuốt lỗi (`catch` rỗng); có xử lý lỗi tập trung.
- Validation cho input; không tin dữ liệu client.
- Config qua env; không hardcode secret; không log token/PII.
- Không chặn event-loop bằng tác vụ nặng; dùng queue nếu cần.

## Kiểm tra đặc thù khaosat

- **Validate phiếu server-side** (`server/lib/kiemTraPhieu.js`): mọi ràng buộc client (bắt buộc,
  min/max chọn nhiều, maxLength, loại giá trị số/năm/ngày/tỉnh) phải được kiểm lại ở server khi
  `POST /api/v1/ketquakhaosats/public`; kiểm cả khung thời gian mở/đóng + `isActive` lúc nộp.
- **Escape CSV** khi export phiếu: bọc quote + escape `"`, xử lý xuống dòng trong ô;
  chống CSV injection (giá trị bắt đầu `=`, `+`, `-`, `@` phải được vô hiệu khi mở bằng Excel).
- **XSS ở header/footer/logo HTML** của khảo sát: chỉ admin (giữ `x-admin-key`) được nhập —
  xác nhận mọi route ghi các trường này nằm sau kiểm tra admin; các nội dung khác
  (câu hỏi/đáp án/câu trả lời) phải render dạng text, không `dangerouslySetInnerHTML`.
- **Admin key**: mọi route `/api/v1/admin/*` bắt buộc qua middleware `x-admin-key`;
  so sánh khóa không lộ qua log; `ADMIN_KEY` mặc định chỉ dành cho dev.
- **Thống kê công khai**: `GET /khaosats/:id/thongke` phải từ chối khi `isViewKQ=false`;
  không trả về PII người trả lời (`nguoiKhaoSat`) ở bất kỳ endpoint public nào.
- **Seed giữ UUID gốc** `08ded814-7fb7-49cb-8158-e6aafccb16a5` (phiếu NQ57) — seed phải idempotent.
