# Task: Trải bài 4 loại — Giai đoạn 1 (Daily 1 lá + nền tảng + 3 lá đầu ra JSON)

> Created: 2026-10-04 · Updated: 2026-10-04 (v3 — đã triển khai) · Slug: `trai-bai-4-loai-giai-doan-1`
> Trạng thái: **Code xong trên nhánh `feat/trai-bai-4-loai`, CHƯA commit, CHƯA áp migration lên production.**

## Goal
Hệ thống hỗ trợ nhiều loại trải bài qua registry + schema; Daily 1 lá ("Thông điệp vũ trụ ngày hôm nay")
thay hoàn toàn "Rút nhanh 1 lá" + "Thông điệp của ngày" (free 1 lần/ngày/user, lần sau trừ 1 credit,
nội dung sinh sẵn); trải 3 lá trả về JSON có cấu trúc (không stream, hiện dần bằng animation).

## Scope
**In**: registry, schema zod, PromptBuilder + safety preamble, ReadingContext (server đếm major/minor),
renderer theo schema, DB (daily), pipeline sinh Daily, API Daily, UI Daily, 3 lá JSON, gỡ QuickRead.
**Out**: 5 lá, Yes/No, hỏi nối tiếp, chủ đề mới, cá nhân hoá Daily, tinh chỉnh chất lượng prompt.

## Checklist
- [x] Xác nhận giả định (3 biến thể, rút ngược, trần 5 lượt/ngày) — chốt theo đề xuất
- [x] P0 Script đo độ trễ: `scripts/measureThreeCardLatency.mts` (**user chạy**, cần `.env.local`)
- [x] P1 Nền tảng: `spreads.ts`, `ai/schemas/*`, `ai/prompts/*` (+ safety), `reading-context.ts`,
      `ThreeCardResultView`/`DailyResultView`, nhãn vị trí về registry, bỏ `dangerouslySetInnerHTML`
- [x] P2 Database: `supabase/migrations/20261004000000_daily_reading.sql` — **đã kiểm 22 ca bằng PGlite**,
      **CHƯA áp lên production**
- [x] P3 Sinh nội dung Daily: 468/468 bản, lint 0 lỗi 0 cảnh báo, điểm đã chuẩn hoá trung vị
- [x] P4 API Daily `GET/POST /api/reading/daily`
- [x] P5 UI Daily `/hom-nay`, gỡ QuickRead/DailyTarotMessage, 308 từ `/trai-bai`, rà lời văn
- [x] P6 3 lá JSON: route không stream, `after()`, `replayOnly`, màn chờ, hiện dần, khôi phục sau tải lại
- [x] Lịch sử: `rowToHistoryItem` + `ReadingResultSection` (bản mới + bản cũ chỉ có chữ)
- [x] Dọn code chết liên quan (10 file) — còn 4 file chết không liên quan, để nguyên
- [x] Gates: tsc ✅ · lint ✅ (0 lỗi) · build ✅ · UI Playwright/Edge ✅ (xem implementation-plan.md)
- [ ] **Việc thủ công còn lại (user)**: áp migration → nạp nội dung → duyệt → chạy script đo độ trễ
- [ ] Duyệt nội dung Daily bằng người (xem "Open Questions")
- [ ] Chạy thử end-to-end trên môi trường có Supabase thật (chưa làm được: không có Docker)
- [ ] Commit + deploy (user quyết định)
- [ ] Learnings extracted → đã thêm vào `.claude/rules/project.md` và `docs/learned/daily-reading.md`
- [ ] P8 (sau) tinh chỉnh prompt + đo chi phí thật · P9 (chờ quyết định) hỏi nối tiếp

## Progress Log
- 2026-10-04 plan v1 → v2 (đọc prompt phần 2; chốt Daily sinh sẵn + bộ bài riêng; 3 lá A+C)
- 2026-10-04 triển khai P1–P6 + lịch sử + dọn dẹp; 26 agent sinh nội dung Daily song song
- 2026-10-04 phát hiện & sửa 2 lỗi nghiêm trọng NHỜ test giao diện: (1) vòng lặp tải vô hạn do
  `onCreditsSync` không ổn định trong deps; (2) race: phản hồi trạng thái cũ ghi đè lá vừa rút
- 2026-10-04 phát hiện & sửa lỗi bộ bài: khi xáo lại, lá vừa rút hôm qua có thể ra lại ngay
- 2026-10-05 tối ưu: danh sách lịch sử nhẹ + tải chi tiết khi mở; khách không gọi GET; cache chỉ mục lá; truy vấn
  lịch sử Daily dùng index; ngừng ghi `personal_body` cho lượt mới (xem docs/learned/daily-reading.md)

## Open Questions
- **Duyệt nội dung Daily**: 357/468 đoạn `insight` mở đầu bằng "Có thể bạn…" (do ví dụ trong prompt);
  cân nhắc một đợt viết lại phần mở đầu để đa dạng. Cũng đọc kỹ 132 bản Major (xem ghi chú ở
  `docs/learned/daily-reading.md`).
- Độ trễ thật của 3 lá chưa đo (cần key) → quyết định giữ "chờ rồi hiện dần" hay stream từng khối.
- Hành vi hàm Vercel khi client ngắt giữa chừng: code dùng `after()` để chạy tiếp, **chưa kiểm chứng
  trên Vercel thật**.
