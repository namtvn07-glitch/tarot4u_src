# Task: Tối ưu hệ thống xử lý (đợt 2)

> Created: 2026-10-05 · Slug: `toi-uu-he-thong-xu-ly`
> Trạng thái: **PLAN — chờ trả lời D2–D6, chưa code.** Kế hoạch đầy đủ: `implementation-plan.md`.

## Goal
Khách rút Daily không tốn tài khoản/DB; lượt đứt giữa chừng tự hoàn; số lượt gọi mạng mỗi thao tác giảm rõ rệt;
trang và ảnh nhẹ hơn; hạ tầng AI/giới hạn tốc độ có hành vi rõ ràng — kèm test tự động để giữ kết quả.

## Scope
**In**: pha A–E và G (xem implementation-plan.md). **Out**: pha F (làm khi vượt ngưỡng), 5 lá, Yes/No, hỏi nối tiếp.

## Checklist
- [ ] Commit/merge `feat/trai-bai-4-loai`, mở nhánh `perf/he-thong-xu-ly`
- [ ] Trả lời D2 (mức xác thực), D3 (gói Vercel), D4 (devDependency), D5 (ảnh lưng bài), D6 (Sentry)
- [ ] G: khung test (`npm run test`, `tests/sql`, `tests/e2e`)
- [ ] A: khách Daily bằng cookie ký
- [ ] B: đối soát lượt mồ côi (dry-run trên production trước khi bật cron)
- [ ] C: `getClaims` + gọn lượt gọi Daily
- [ ] D: header cache, bỏ `remotePatterns` mở, ảnh thu nhỏ + lazy, tự lưu ảnh lưng bài, JS, Sentry, gỡ `framer-motion`
- [ ] E: huỷ request AI khi timeout, chính sách `failOpen`, cron ẩn danh, `useLatestRef`, Header 768 px
- [ ] Đo lại toàn bộ chỉ tiêu, ghi số vào `docs/learned/`

## Progress Log
- 2026-10-05 rà soát khách quan; lập plan

## Open Questions
- D2–D6 (xem implementation-plan.md).
- Cấu hình thật trên dashboard Supabase: giới hạn đăng nhập ẩn danh có đúng 10/giờ/IP như `config.toml` không?
  (Authentication → Rate Limits) — quyết định mức độ gấp của pha A.
