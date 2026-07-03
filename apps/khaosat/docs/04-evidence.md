# P1 — Evidence & Gates — Hệ thống Khảo sát Trực tuyến

> BMAD flow: Brief → PRD → Architecture → Stories → Dev → Test → Evidence. Mỗi bước qua **gate**.

## Gate checklist
| Gate | Chủ trì | Artifact | Trạng thái |
|---|---|---|---|
| Brief | BA/PM | `docs/01-problem.md` | ☑ |
| PRD | PM/PO | `docs/02-prd.md` | ☑ |
| Architecture | Architect/Tech Lead | `docs/03-architecture.md` | ☑ |
| Story ready | Tech Lead + Dev | issues/stories GitLab | ☐ (chờ ORIGIN_URL GitLab) |
| Done | Dev + QA + Owner | MR + CI xanh + `evidence/` | ☐ |

## Evidence cần thu (khung — bổ sung khi có)
| Hạng mục | Bằng chứng | Nơi lưu | Trạng thái |
|---|---|---|---|
| Test API | log `npm test` (vitest + supertest) xanh | `docs/evidence/test-results/` | ☐ |
| Điền phiếu mẫu | screenshot `/khao-sat/08ded814-7fb7-49cb-8158-e6aafccb16a5` + trang hoàn thành | `docs/evidence/test-results/` | ☐ |
| Kết quả công khai | screenshot biểu đồ thanh (`isViewKQ=true`) + từ chối khi tắt | `docs/evidence/test-results/` | ☐ |
| Quản trị | screenshot builder câu hỏi, import JSON, export CSV mở bằng Excel | `docs/evidence/test-results/` | ☐ |
| Validate server-side | test case phiếu thiếu câu bắt buộc / vượt max bị từ chối | `docs/evidence/test-results/` | ☐ |
| Review | ghi chú review bot + senior-gate | `docs/evidence/review-notes/` | ☐ |
| Prompt log | prompt quan trọng theo vai trò (BA/Dev/QA) | `docs/evidence/prompt-log/` | ☐ |

## Evidence tự động (từ harness)
- Pipeline map + proof gallery (dashboard :8090) · CI gate log (`ci-gate`: lint + test trên DB cách ly) ·
  code review (VNPT-Review-Bot) · MR GitLab (khi có ORIGIN_URL).
