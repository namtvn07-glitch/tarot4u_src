-- Đường ghi DUY NHẤT vào affiliate_clicks sau khi đã đóng policy anon.
-- Gọi từ middleware bằng service_role, một round-trip: validate mã + rate limit
-- + insert.
create or replace function public.record_affiliate_click(
  p_click_id     uuid,
  p_code         text,
  p_ip_hash      text,
  p_is_bot       boolean default false,
  p_landing_path text default null
) returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Mã sai/đã tắt: không ghi gì, không tốn hạn mức rate limit của IP đó.
  if not exists (select 1 from affiliate_links where code = p_code and is_active) then
    return false;
  end if;

  -- Tiền tố tên route bắt buộc theo luật đã học của repo: check_rate_limit chỉ
  -- đếm theo chuỗi key, không tự phân biệt route — key trần sẽ vô tình dùng
  -- chung bucket với route khác và gây rate-limit sai mà không báo lỗi.
  --
  -- Hạn mức CỐ Ý nới rộng (200/giờ/IP thay vì vài chục): ở VN rất nhiều người
  -- dùng chung một IP sau NAT của nhà mạng, mà một click bị chặn nhầm nghĩa là
  -- MẤT ATTRIBUTION âm thầm (cookie trỏ vào UUID không tồn tại). Hạn mức này
  -- để chặn bơm hàng loạt, không phải để soi lưu lượng bình thường.
  if not check_rate_limit('affiliate-click:ip:' || coalesce(p_ip_hash, 'unknown'), 3600, 200) then
    return false;
  end if;

  insert into affiliate_clicks (id, code, ip_hash, is_bot, landing_path)
  values (p_click_id, p_code, p_ip_hash, p_is_bot, p_landing_path)
  on conflict (id) do nothing;

  return true;
end;
$function$;

revoke execute on function public.record_affiliate_click(uuid, text, text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.record_affiliate_click(uuid, text, text, boolean, text)
  to service_role;
