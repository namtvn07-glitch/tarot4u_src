-- credit_order: không để trạng thái nội bộ làm khách mất tiền.
--
-- VẤN ĐỀ
-- Bản cũ chỉ cộng credits khi đơn đang `pending`. Mọi trạng thái khác trả
-- 'not_pending' và webhook coi đó là "no-op an toàn". Nhưng tới được nhánh đó
-- nghĩa là PayOS đã xác nhận `code = "00"` — giao dịch THÀNH CÔNG. Khách đã
-- chuyển tiền và không nhận được gì, im lặng.
--
-- Đường đi có thật: khách trả tiền lúc 23:50 UTC (đơn hết hạn 23:58), webhook
-- gặp lúc site đang deploy nên nhận 500, PayOS retry theo backoff, cron
-- expire-orders chạy 00:00 đánh đơn thành 'expired', webhook về lúc 00:05 thì
-- đơn không còn 'pending'.
--
-- NGUYÊN TẮC
-- Xác nhận của PayOS là sự thật về tiền; `status` là sổ sách của mình. Chỉ có
-- hai lý do chính đáng để từ chối một webhook đã verify chữ ký:
--   * đã cộng rồi  -> 'already_paid' (bảo đảm idempotent, PayOS gọi lại nhiều lần)
--   * số tiền lệch -> 'amount_mismatch' (chống sửa số tiền)
-- 'expired' / 'failed' / 'cancelled' là trạng thái nội bộ, không phải lý do
-- giữ tiền của khách.
--
-- VÌ SAO AN TOÀN
--   * Không mở đường replay: webhook phải qua PayOS webhooks.verify(), không
--     giả chữ ký được, và 'already_paid' chặn cộng đôi.
--   * Không mở đường đổi giá: amount_vnd nằm trên chính dòng đơn, so khớp
--     trước khi cộng.
--   * `for update` giữ nguyên nên hai webhook song song vẫn tuần tự hoá.
--
-- TRẢ VỀ
-- Thêm 'credited_late' để phân biệt với 'credited': tiền vẫn vào đúng, nhưng
-- đơn đã lệch khỏi luồng bình thường và đáng được nhìn thấy trên Sentry. Nếu
-- con số này tăng, nguyên nhân gốc (webhook trễ, PayOS lỗi tạo link) mới là
-- thứ cần sửa — migration này chỉ chặn hậu quả rơi lên đầu khách.

create or replace function public.credit_order(p_order_code bigint, p_amount integer)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order   orders%rowtype;
  v_balance int;
  v_late    boolean;
begin
  select * into v_order from orders where payos_order_code = p_order_code for update;
  if not found then return 'not_found'; end if;

  -- Idempotent: PayOS gọi lại cùng một giao dịch cho tới khi nhận 200.
  if v_order.status = 'paid' then return 'already_paid'; end if;

  -- Chống sửa số tiền — kiểm TRƯỚC khi đụng tới bất cứ thứ gì.
  if v_order.amount_vnd <> p_amount then return 'amount_mismatch'; end if;

  v_late := v_order.status <> 'pending';

  update orders set status = 'paid', paid_at = now() where id = v_order.id;
  update profiles set credits = credits + v_order.credits_purchased, updated_at = now()
    where id = v_order.user_id returning credits into v_balance;
  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
    values (v_order.user_id, v_order.credits_purchased, v_balance, 'purchase', v_order.id);

  if v_late then return 'credited_late'; end if;
  return 'credited';
end;
$function$;

-- `create or replace` giữ nguyên grant, nhưng nêu lại tường minh: đây là hàm
-- cộng tiền, và repo này đã có một lần mất grant vì `drop function` (xem
-- 20260920000000_regrant_debit_refund_to_service_role.sql).
revoke all on function public.credit_order(bigint, integer) from public, anon, authenticated;
grant execute on function public.credit_order(bigint, integer) to service_role;
