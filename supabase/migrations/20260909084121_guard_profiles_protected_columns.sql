-- Vá lỗ hổng đã kiểm chứng bằng probe RLS (giả lập role authenticated):
-- `update profiles set referred_by_code = ...` GHI ĐƯỢC. Nguyên nhân: policy
-- profiles_update_own cho update dòng của mình, authenticated có column grant
-- UPDATE trên MỌI cột, còn trigger guard_credits_column() chỉ canh đúng cột
-- credits. Hệ quả: bất kỳ user nào cũng tự gán mã affiliate cho mình, bất cứ
-- lúc nào, không cần đăng ký lại.
--
-- Cùng probe đó xác nhận credits ĐANG bị chặn đúng — migration này phải giữ
-- nguyên 100% hành vi đó, không được nới lỏng đường tiền.

alter table profiles
  add column referred_click_id uuid references affiliate_clicks(id) on delete set null;

-- Giữ nguyên SECURITY INVOKER + search_path=public y như guard_credits_column()
-- (đã xác nhận qua pg_proc.prosecdef trước khi thay).
create or replace function guard_profiles_protected_columns() returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- service role bỏ qua kiểm tra này
  if current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' then
    return new;
  end if;
  if new.credits is distinct from old.credits then
    raise exception 'credits chỉ được thay đổi server-side';
  end if;
  -- Attribution affiliate: set một lần lúc INSERT (trigger handle_new_user),
  -- sau đó bất biến với user. Sửa về sau chỉ còn đường service_role.
  if new.referred_by_code is distinct from old.referred_by_code
     or new.referred_click_id is distinct from old.referred_click_id then
    raise exception 'attribution affiliate chỉ được thay đổi server-side';
  end if;
  -- created_at cũng đang user-sửa được: tự lùi ngày tạo tài khoản làm bẩn chỉ
  -- số "user mới" và mọi logic sau này dựa trên tuổi tài khoản.
  if new.created_at is distinct from old.created_at then
    raise exception 'created_at không được thay đổi';
  end if;
  return new;
end $$;

drop trigger profiles_guard_credits on profiles;
create trigger profiles_guard_protected_columns
  before update on profiles
  for each row execute function guard_profiles_protected_columns();
drop function guard_credits_column();
