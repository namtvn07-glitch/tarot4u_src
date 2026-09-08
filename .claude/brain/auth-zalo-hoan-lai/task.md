# Task: Đăng nhập bằng Zalo — HOÃN

> Created: 2026-09-08 · Slug: `auth-zalo-hoan-lai` · **Trạng thái: hoãn lại theo
> yêu cầu 2026-09-08.** Phần đổi mật khẩu đã tách sang
> [`../mat-khau-nang-cap/`](../mat-khau-nang-cap/task.md) và làm trước.

## Goal
Người dùng đăng nhập được bằng tài khoản Zalo (một nút trong `AuthModal`, không cần
email).

## Scope
**In**: luồng OAuth Zalo v4 (PKCE) tự viết, bảng ánh xạ `zalo_identities`, nút Zalo
trong `AuthModal`, dọn ánh xạ khi xoá tài khoản.
**Out**: Zalo Mini App / OA, liên kết Zalo vào tài khoản email đã có, đặt mật khẩu
cho tài khoản OAuth.

## Chặn bởi
- Chưa xác nhận có **Zalo Developer app** đã duyệt (`app_id` + `app_secret`, domain đã
  xác minh, Callback URL `https://<domain>/auth/zalo/callback` đã khai). Không có thì
  không verify end-to-end được.
- Mắt xích kỹ thuật rủi ro nhất chưa spike: cấp session Supabase cho user Zalo bằng
  `admin.generateLink({type:'magiclink'})` → `verifyOtp({token_hash})`.

## Ghi chú giữ lại
Chi tiết thiết kế đầy đủ vẫn nằm trong [implementation-plan.md](implementation-plan.md)
— khi nào mở lại task này thì đọc từ đó, **nhưng bỏ qua mọi phần nói về đổi mật khẩu**
(đã chuyển sang task khác), và kiểm tra lại xem `mat-khau-nang-cap` có đổi gì ở
`AuthModal` / `api/account` không trước khi áp dụng.
