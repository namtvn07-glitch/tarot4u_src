# Walkthrough: Giai đoạn 5 — Tài khoản

> Completed: 2026-08-18 · Task: `phase-5-tai-khoan`

## What Was Built
Đăng nhập thật (magic link + Google OAuth + email/mật khẩu — bổ sung sau khi
magic link dính rate limit email lúc user tự test, xem Deviations), dùng hạ
tầng Supabase Auth đã có từ Giai đoạn 3), middleware chặn thật route
`/tai-khoan`, topbar dùng chung đầu tiên của app, và trang cá nhân (credits +
lịch sử trải bài phân trang + lịch sử giao dịch phân trang + xoá từng lượt
trải bài, xác nhận 2 bước). **Verify end-to-end bằng session thật** (đăng
ký/đăng xuất/đăng nhập lại/sai mật khẩu) — không còn là gap.

## Changes
| File | Action | What |
|------|--------|------|
| `supabase/migrations/20260818000001_readings_delete_policy.sql` | NEW | RLS `readings_delete_own`, áp lên Supabase thật |
| `src/components/ui/Button.tsx` | MODIFY | +variant `danger` |
| `src/lib/supabase/middleware.ts` | MODIFY | Redirect route bảo vệ khi chưa đăng nhập |
| `src/components/layout/Header.tsx` | NEW | Topbar chung |
| `src/components/auth/SignOutButton.tsx`, `LoginForm.tsx` | NEW | Đăng xuất, đăng nhập (magic link + Google) |
| `src/app/layout.tsx` | MODIFY | Gắn `<Header />` |
| `src/app/dang-nhap/page.tsx` | NEW | Trang đăng nhập |
| `src/app/tai-khoan/page.tsx` + `loading.tsx` + `error.tsx` | NEW | Credits + 2 danh sách phân trang |
| `src/components/account/ReadingHistoryList.tsx`, `DeleteReadingButton.tsx`, `LedgerTable.tsx` | NEW | Danh sách + xoá + bảng giao dịch |
| `src/app/api/readings/[id]/route.ts` | NEW | `DELETE`, RLS chặn không phải chủ |
| `src/lib/env.ts` | MODIFY | Bugfix — xem Deviations |
| `docs/learned/nextjs-env-bundling.md` | NEW | Root-cause bug env |
| `.claude/rules/project.md` | MODIFY | 2 dòng Learned Patterns mới |
| `src/components/auth/PasswordAuthForm.tsx` | NEW | Đăng nhập/đăng ký bằng email+password (amendment) |
| `Research/plan/01-san-pham-pham-vi.md` | MODIFY | Ghi nhận phương thức đăng nhập mới |

## Deviations From the Plan
| Planned | Actual | Why |
|---------|--------|-----|
| Không có trong plan | Sửa `src/lib/env.ts`: `process.env[key]` → `RAW_ENV` (literal access) | Bug thật chặn hoàn toàn magic link + Google OAuth — `NEXT_PUBLIC_*` không được Next.js inline cho bundle browser khi đọc qua biến động. Phát hiện qua Gate 5 (bấm nút thật) |
| Skeleton `loading.tsx` dùng Tailwind class số tuỳ ý | Đổi sang arbitrary value có chú thích | Vài số (`w-40`, `h-9`...) ngoài ramp spacing 0–8 đã định nghĩa — đúng ý đồ guard chặn, tự bắt trước khi chạy gate |
| Verify `/tai-khoan` bằng trình duyệt có session thật | Ban đầu: chỉ verify được unauthenticated states + code review. **Sau đó**: user tự test, dính rate limit email → yêu cầu thêm email+password → verify được **đầy đủ với session thật** | Không tạo được session test an toàn lúc đầu (`guard-paths.sh` chặn `.env.local`); email+password (tắt Confirm email) giải quyết cả 2 vấn đề: unblock user lẫn cho phép agent tự tạo tài khoản test hợp lệ để verify |
| Chỉ magic link + Google (theo `01-san-pham-pham-vi.md` gốc) | Thêm email+password | User tự test dính `over_email_send_rate_limit` (mailer test mặc định Supabase) — cần đường dự phòng không phụ thuộc gửi email thật. Email ở đây chỉ là định danh tự đặt, không phải email thật |

## Verification
| Gate | Result |
|------|--------|
| lint | ✅ |
| typecheck | ✅ |
| test | n/a |
| build | ✅ (dev + `next build && next start` production) |
| visual (375/768/1280/1920) | ✅ trên `/`, `/dang-nhap`, `/tai-khoan` (kể cả trạng thái có dữ liệu + phân trang, không chỉ code review) |
| a11y (keyboard + contrast) | ✅ |

**Manually checked**: magic link + Google OAuth chạm Supabase Auth thật (429 rate-limit, "provider not enabled" — cả 2 đều lỗi thật từ backend, không phải bug); email+password đăng ký/đăng xuất/đăng nhập lại/sai mật khẩu — toàn bộ chu trình auth thật; redirect `/tai-khoan`→`/dang-nhap?next=`; **`/tai-khoan` với dữ liệu thật**: seed 12 `readings` cho user test thật → phân trang 10/trang đúng, giữ nguyên param khi đổi trang, xoá 2-bước đúng, dọn sạch dữ liệu test sau khi xong (xác nhận 0 dòng còn sót); regression `/`, `/trai-bai`, `/doc-sau` vẫn hoạt động; cả 2 theme; bàn phím; `DELETE /api/readings/[id]` trả 401 khi không có session (curl).
**Not checked**: nothing còn lại trong phạm vi task này.

## Known Gaps
- Nút "Nạp thêm" cố ý không dựng — chờ Giai đoạn 6.
- Sửa hồ sơ (display_name/avatar) — ngoài phạm vi, để roadmap.
- `/doc-sau` vẫn dùng in-page soft-gate riêng của Giai đoạn 4c, chưa chuyển sang middleware chung — cố ý không đụng việc của task khác.

## Learnings Recorded
- `.claude/rules/project.md`: 2 dòng — pointer bug `env.ts` dynamic access, và nguyên tắc không lách `guard-paths.sh` để tạo session/user test giả
- `docs/learned/nextjs-env-bundling.md`: root-cause + fix + cách phát hiện nhanh cho bug `NEXT_PUBLIC_*` không inline được qua truy cập động
