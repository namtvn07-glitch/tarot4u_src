-- Tắt một link CHỈ nên có nghĩa "ngừng nhận traffic mới", không được xoá công
-- của những người đã bấm link lúc nó còn chạy.
--
-- Trước migration này, hàm dưới đây join thêm điều kiện `and l.is_active`, nên
-- tắt link xong là mọi người đã bấm từ trước mà chưa kịp đăng ký đều mất nguồn.
-- Hậu quả: kết thúc chiến dịch rồi tắt link → những người đăng ký muộn không
-- được tính → bảng số liệu báo chiến dịch kém hơn thực tế. Mà đo cho đúng
-- chính là toàn bộ lý do tồn tại của tính năng này.
--
-- Bỏ điều kiện đó đi KHÔNG mở ra lỗ nào: link đã tắt thì record_affiliate_click()
-- đã chặn ngay từ lúc bấm, không có dòng click nào được ghi để mà lần ngược.
-- Kiểm tra is_active chỉ cần đúng một chỗ — lúc ghi click.
--
-- Đã kiểm chứng bằng 2 kịch bản chạy qua API signup thật:
--   A. bấm lúc link BẬT → tắt link → đăng ký  => vẫn gán đúng nguồn (trước đây mất)
--   B. bấm lúc link ĐÃ TẮT → đăng ký          => không nguồn (chốt chặn vẫn giữ)
--
-- Vẫn giữ join với affiliate_links: mã bị XOÁ hẳn thì không còn nguồn để gán
-- (khớp với ràng buộc on delete set null của profiles.referred_by_code).
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
      join affiliate_links l on l.code = c.code
      where c.id = v_click_id
        and c.created_at >= now() - interval '30 days';  -- khớp tuổi thọ cookie
    end if;
  exception when others then
    -- Signup là đường sống: mọi lỗi ở phần affiliate phải degrade thành
    -- "không có nguồn", tuyệt đối không được chặn đăng ký.
    v_click_id := null;
    v_code := null;
  end;

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

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role, postgres;
