# Walkthrough: Giai đoạn 7 — Kiểm duyệt, bảo mật & pháp lý

> Completed: 2026-08-27 · Task: `phase-7-kiem-duyet-bao-mat-phap-ly`

## What Was Built
Rate limit thật (không chỉ tồn tại trong Postgres mà không ai gọi) trên cả
3 endpoint tốn tài nguyên (`/api/reading`, `/api/orders`, `shuffle`); 4
trang pháp lý bắt buộc trước launch (điều khoản, quyền riêng tư, hoàn
tiền, tài nguyên khủng hoảng) nối vào 1 footer site-wide; disclaimer pháp
lý giờ xuất hiện dưới **cả 2** luồng trải bài thay vì chỉ Đọc nhanh; và một
lớp phòng vệ Sentry thêm cho nội dung câu hỏi nhạy cảm. Audit trước khi
viết plan phát hiện việc "tích hợp kiểm duyệt" trong checklist gốc thực ra
đã xong từ Giai đoạn 4c — giảm phạm vi thật từ 8 xuống 7 việc.

## Changes
| File | Action | What |
|------|--------|------|
| `src/lib/rate-limit.ts` | NEW | `checkRateLimit`/`getClientIp` dùng chung, wrap `check_rate_limit` RPC |
| `src/lib/legal-contact.ts` | NEW | `SUPPORT_EMAIL` placeholder, 1 nguồn duy nhất |
| `src/app/api/reading/route.ts` | MODIFY | Rate limit: 20/giờ (đăng nhập) hoặc 3/ngày/IP (ẩn danh) |
| `src/app/api/orders/route.ts` | MODIFY | Rate limit: 10/giờ theo user |
| `src/app/api/reading/deep/shuffle/route.ts` | MODIFY | Refactor dùng helper chung; đổi key `user:<id>` → `reading-deep-shuffle:user:<id>`; xoá debug log |
| `src/app/api/reading/deep/personal/route.ts` | MODIFY | Xoá debug log |
| `src/components/reading/ReadingDisclaimer.tsx` | NEW | Trích từ `ResultPanel`, dùng chung |
| `src/components/reading/ResultPanel.tsx` | MODIFY | Dùng `ReadingDisclaimer` |
| `src/components/reading/DeepResultStream.tsx` | MODIFY | Thêm disclaimer (trước đó không có) |
| `src/components/safety/CrisisResourceNotice.tsx` | MODIFY | Copy hotline có giờ + 115; thêm `"use client"` còn thiếu |
| `src/components/legal/LegalPageLayout.tsx` | NEW | Wrapper title+ngày cho 3 trang pháp lý |
| `src/components/layout/Footer.tsx` | NEW | Footer site-wide, 4 link + email |
| `src/app/layout.tsx` | MODIFY | Wired `Footer` |
| `src/app/dieu-khoan/page.tsx` | NEW | Điều khoản sử dụng |
| `src/app/chinh-sach-quyen-rieng-tu/page.tsx` | NEW | Chính sách quyền riêng tư |
| `src/app/chinh-sach-hoan-tien/page.tsx` | NEW | Chính sách hoàn tiền |
| `src/app/tai-nguyen-khung-hoang/page.tsx` | NEW | Trang tài nguyên khủng hoảng độc lập |
| `src/components/payment/NapCreditsFlow.tsx` | MODIFY | Checkbox link tới điều khoản/hoàn tiền thật |
| `src/instrumentation.ts` / `-client.ts` | MODIFY | `beforeSend` scrub `request.data` |
| `docs/learned/nextjs-client-boundary.md` | NEW | Learning: hook không "use client" ẩn cho tới khi đổi consumer |
| `.claude/rules/project.md` | MODIFY | Learning: namespace key `check_rate_limit` theo route |

## Deviations From the Plan
| Planned | Actual | Why |
|---------|--------|-----|
| Không đổi gì ở `CrisisResourceNotice.tsx` ngoài copy | Thêm `"use client"` | Component dùng hook nhưng thiếu directive — chỉ vỡ khi có consumer là Server Component (trang crisis mới); phát hiện lúc `pnpm build` |
| Verify rate limit `/api/orders` bằng cách gọi thật nhiều lần (plan để ngỏ, quyết định lúc execute) | Verify bằng code review, không gọi thật | Route yêu cầu session đăng nhập thật + tạo đơn PayOS thật — tốn phí, và cùng helper đã chứng minh hoạt động đúng qua test `/api/reading` |
| Visual/responsive/theme/a11y bằng mắt (Bước 4 verification.md) | Không thực hiện được | Session này không có browser/Playwright tool — chỉ verify được nội dung/route qua HTTP fetch + static code review |

## Verification
| Gate | Result |
|------|--------|
| lint | ✅ |
| typecheck | ✅ |
| test | n/a |
| build | ✅ (21 route, đủ 4 route mới) |
| visual (375/768/1280) | ⏭️ skipped: không có browser automation tool trong session |
| a11y (keyboard + contrast) | ⏭️ skipped: cùng lý do — chỉ review semantic tĩnh (heading order, `<nav aria-label>`, `next/link`) |

**Manually checked**: cả 5 trang mới trả 200 qua fetch trực tiếp vào dev
server thật (của phiên khác đang chạy, không tự khởi server mới để tránh
đụng độ); nội dung Footer + copy khủng hoảng đúng như đã viết; rate limit
`/api/reading` xác nhận thật — 3 request đầu 200, request thứ 4 trả 429
đúng thiết kế (IP giả, không ảnh hưởng user thật); `pnpm lint`/`tsc --noEmit`/
`pnpm build` chạy trực tiếp, xanh cả 3.

**Not checked**: render thật trên trình duyệt ở 375/768/1280px, cả 2 theme,
zoom 200%, contrast đo bằng công cụ, Tab qua bằng bàn phím thật — không có
browser tool trong session này. Rate limit `/api/orders` và `shuffle` end-
to-end (cần session đăng nhập thật + phí PayOS/AI thật).

## Known Gaps
- Email liên hệ vẫn là placeholder `ho-tro@ventus-tarot.vn` — phải thay
  trước Giai đoạn 10 (đã có TODO comment tại `src/lib/legal-contact.ts`,
  chưa thêm dòng nhắc vào `08-timeline.md` Giai đoạn 10 — nên làm ở lượt
  sau hoặc trước khi `/commit` nếu muốn chắc chắn không quên).
  4 file pháp lý ghi ngày "27/08/2026" cố định — cần cập nhật thủ công nếu
  nội dung đổi sau này (không tự động).
- Visual/a11y thật chưa được xác nhận bằng mắt — khuyến nghị user tự mở
  `pnpm dev` và lướt qua Footer + 4 trang mới ở 375/768/1280px, cả 2 theme,
  trước khi coi Giai đoạn 7 là "xong" theo đúng nghĩa `verification.md`.

## Learnings Recorded
- `docs/learned/nextjs-client-boundary.md`: component dùng hook nhưng
  thiếu `"use client"` chạy đúng nếu mọi consumer hiện tại đã ở trong
  client boundary — chỉ lộ ra khi có consumer mới là Server Component.
- `.claude/rules/project.md`: key truyền vào `check_rate_limit` RPC phải
  luôn có tiền tố tên route, tránh 2 route vô tình chia sẻ chung 1 bucket
  đếm khi dùng key trần kiểu `user:<id>`.
