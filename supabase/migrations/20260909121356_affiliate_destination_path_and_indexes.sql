-- 1. LƯU TRANG ĐÍCH.
-- Trước đây cố ý không lưu, với lý do "nó chỉ ảnh hưởng chuỗi URL đem đi dán".
-- Lý do đó đúng khi link chỉ hiện đúng một lần lúc vừa tạo. Nhưng từ khi bảng
-- có nút "Chép link", chỗ chép không còn biết link này vốn trỏ đi đâu nên phải
-- đoán là "/" — tạo link cho /doc-sau rồi chép lại sẽ ra link trang chủ. Sai
-- âm thầm. Một cột rẻ hơn nhiều so với một cái link hỏng đem đi chạy quảng cáo.
--
-- Ràng buộc check cũng chặn luôn việc đặt trang đích ra ngoài site
-- (vd https://evil.com) — đã test: API trả 400.
alter table affiliate_links
  add column destination_path text not null default '/'
  check (destination_path ~ '^/[A-Za-z0-9/_-]*$');

comment on column affiliate_links.destination_path is
  'Trang mà người bấm link sẽ vào. Middleware bắt ?ref= trên mọi route nên cột này không ảnh hưởng việc đếm — nó tồn tại để chép lại đúng link đã tạo.';

-- 2. INDEX cho khoá ngoại (advisor báo thiếu).
-- profiles.referred_by_code là cái đáng kể nhất: admin_affiliate_stats chạy
-- truy vấn con theo cột này cho TỪNG link, không có index là quét toàn bảng
-- profiles mỗi lần nhân số lượng link.
create index profiles_referred_by_code_idx on profiles (referred_by_code)
  where referred_by_code is not null;
create index profiles_referred_click_id_idx on profiles (referred_click_id)
  where referred_click_id is not null;
create index affiliate_links_created_by_idx on affiliate_links (created_by);

-- 3. Policy gọi auth.uid() lại cho TỪNG dòng (advisor auth_rls_initplan).
-- Bọc trong (select ...) để Postgres tính một lần rồi dùng lại.
-- Chỉ sửa policy do task này tạo ra; 6 policy cũ của các bảng khác cũng dính
-- lỗi tương tự nhưng nằm ngoài phạm vi, không đụng vào.
drop policy admin_users_select_own on admin_users;
create policy admin_users_select_own on admin_users
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Trả thêm trang đích ra bảng thống kê để nút chép dựng đúng link.
drop function if exists public.admin_affiliate_stats();

create function public.admin_affiliate_stats()
returns table (
  code                text,
  label               text,
  destination_path    text,
  is_active           boolean,
  created_at          timestamptz,
  clicks              bigint,
  bot_clicks          bigint,
  unique_visitors     bigint,
  signups             bigint,
  activated_soft      bigint,
  activated_hard      bigint,
  paying              bigint,
  revenue_vnd         bigint,
  avg_hours_to_signup numeric
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    l.code,
    l.label,
    l.destination_path,
    l.is_active,
    l.created_at,
    (select count(*) from affiliate_clicks c where c.code = l.code and not c.is_bot),
    (select count(*) from affiliate_clicks c where c.code = l.code and c.is_bot),
    (select count(distinct c.ip_hash) from affiliate_clicks c
      where c.code = l.code and not c.is_bot and c.ip_hash is not null),
    (select count(*) from profiles p where p.referred_by_code = l.code),
    (select count(*) from profiles p
      where p.referred_by_code = l.code
        and exists (select 1 from readings r where r.user_id = p.id)),
    (select count(*) from profiles p
      where p.referred_by_code = l.code
        and exists (
          select 1 from credit_ledger cl
          where cl.user_id = p.id and cl.reason = 'reading'
            and not exists (
              select 1 from credit_ledger rf
              where rf.reason = 'refund' and rf.ref_id = cl.ref_id
            )
        )),
    (select count(*) from profiles p
      where p.referred_by_code = l.code
        and exists (select 1 from orders o where o.user_id = p.id and o.status = 'paid')),
    (select coalesce(sum(o.amount_vnd), 0) from orders o
      join profiles p on p.id = o.user_id
      where p.referred_by_code = l.code and o.status = 'paid'),
    (select round(avg(extract(epoch from (p.created_at - c.created_at)) / 3600)::numeric, 1)
      from profiles p
      join affiliate_clicks c on c.id = p.referred_click_id
      where p.referred_by_code = l.code)
  from affiliate_links l
  order by l.created_at desc;
$function$;

revoke execute on function public.admin_affiliate_stats() from public, anon, authenticated;
grant execute on function public.admin_affiliate_stats() to service_role;
