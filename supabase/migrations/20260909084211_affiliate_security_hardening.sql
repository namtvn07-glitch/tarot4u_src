-- Vá lỗ hổng đã kiểm chứng: anon/authenticated INSERT được vào affiliate_clicks.
-- anon key nằm công khai trong bundle browser => bất kỳ ai cũng POST thẳng
-- /rest/v1/affiliate_clicks để (a) bơm click rác vào mã bất kỳ, làm méo tỉ lệ
-- chuyển đổi của chính link đang chạy quảng cáo, (b) ghi không giới hạn vào
-- Postgres. Từ đây chỉ còn service_role ghi, qua đúng 1 RPC có rate limit.
drop policy affiliate_clicks_insert_anon on affiliate_clicks;

-- Thu hồi cả table grant mặc định của Supabase (RLS đã chặn, đây là lớp thứ hai).
revoke all on affiliate_clicks from anon, authenticated;
revoke all on affiliate_links from anon, authenticated;
-- admin_users GIỮ select cho authenticated: requireAdmin() dùng client
-- RLS-aware tự kiểm tra chính mình qua policy admin_users_select_own.
revoke insert, update, delete, truncate, references, trigger on admin_users from anon, authenticated;

alter table affiliate_clicks add column is_bot boolean not null default false;
alter table affiliate_clicks add column landing_path text;

comment on column affiliate_clicks.ip_hash is
  'sha256 cắt còn 16 ký tự hex đầu — đủ để dedupe/rate-limit, không cần chống va chạm mật mã. Không bao giờ lưu IP thô.';
comment on column affiliate_clicks.is_bot is
  'Crawler preview link (Facebook/Zalo/TikTok/Telegram...) VẪN được ghi để thấy bao nhiêu traffic là bot, chỉ loại khỏi con số headline — không giấu đi.';
