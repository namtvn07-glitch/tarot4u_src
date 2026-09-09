-- Gắn attribution affiliate vào lúc tạo profile.
--
-- HAI ĐIỂM SỐNG CÒN:
-- 1. Toàn bộ khối affiliate được bọc exception. Hàm này chạy trên trigger
--    insert của auth.users — tức là đường sống của TOÀN BỘ signup. Bất kỳ lỗi
--    nào ở phần affiliate (mã sai kiểu, bảng đổi tên, cast UUID hỏng...) phải
--    degrade thành "không có attribution", tuyệt đối không được chặn đăng ký.
-- 2. GIỮ NGUYÊN 'full_name' — đúng hàm đang chạy production (đã đọc lại bằng
--    information_schema.routines trước khi sửa). Bản nháp kế hoạch ban đầu viết
--    nhầm thành 'display_name', áp vào là đổi im lặng cách đặt tên hiển thị của
--    mọi user mới.
--
-- Nhận vào ref_click là UUID của một dòng click CÓ THẬT, không phải mã trần:
-- client không bịa được mã cho mình vì UUID phải tồn tại trong affiliate_clicks.
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_click_id uuid;
  v_code     text;
begin
  begin
    v_click_id := (new.raw_user_meta_data->>'ref_click')::uuid;
    if v_click_id is not null then
      select c.code into v_code
      from affiliate_clicks c
      join affiliate_links l on l.code = c.code and l.is_active
      where c.id = v_click_id
        and c.created_at >= now() - interval '30 days';  -- khớp tuổi thọ cookie
    end if;
  exception when others then
    v_click_id := null;
    v_code := null;
  end;

  -- Click có thật nhưng mã đã bị tắt/xoá => không ghi nửa vời.
  if v_code is null then
    v_click_id := null;
  end if;

  insert into public.profiles (id, display_name, avatar_url, referred_by_code, referred_click_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    v_code,
    v_click_id
  );
  return new;
end;
$function$;

-- create or replace không tự khôi phục grant; lặp lại y hệt 20260829000001 để
-- không tái phát lỗ PUBLIC:EXECUTE đã từng phải vá.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role, postgres;
