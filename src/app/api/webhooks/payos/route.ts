import * as Sentry from "@sentry/nextjs";
import { getPayOS } from "@/lib/payos";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// PayOS gọi lại webhook nhiều lần cho cùng 1 giao dịch cho tới khi nhận 200
// (05-thanh-toan-credits.md §3.2) — route này luôn trả 200 trừ lỗi hạ tầng
// thật (DB không tới được), để tránh PayOS retry vô hạn cho các case đã xử
// lý xong (chữ ký sai, code khác "00", đơn không hợp lệ...).
export async function POST(request: Request) {
  // Đọc RAW body rồi mới JSON.parse — verify() cần đúng object PayOS gửi,
  // parse lại sau khi đã có object không đổi được nội dung ký, khác với đọc
  // qua req.json() rồi tự sinh lại object (thứ tự key có thể lệch).
  const raw = await request.text();

  let verified;
  try {
    verified = await getPayOS().webhooks.verify(JSON.parse(raw));
  } catch (e) {
    Sentry.captureMessage("payos webhook: chữ ký không hợp lệ", { extra: { error: String(e) } });
    return new Response("invalid signature", { status: 401 });
  }

  if (verified.code !== "00") {
    // Giao dịch không thành công phía PayOS (hủy, lỗi...) — không phải lỗi
    // của route này, không cộng credits, không cần Sentry.
    return new Response("ok", { status: 200 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("credit_order", {
      p_order_code: verified.orderCode,
      p_amount: verified.amount,
    });
    if (error) throw error;

    if (data === "amount_mismatch") {
      // Số tiền chuyển khoản khác amount_vnd đã lưu khi tạo đơn — không cộng
      // credits, cần biết ngay (05-thanh-toan-credits.md §3.4: "chống sửa số
      // tiền").
      Sentry.captureMessage("payos webhook: số tiền không khớp", {
        extra: { orderCode: verified.orderCode, amount: verified.amount },
      });
    }
    // 'not_found' / 'already_paid' / 'not_pending': no-op an toàn, PayOS gọi
    // lại nhiều lần cho cùng giao dịch là bình thường — không phải lỗi.
  } catch (e) {
    Sentry.captureException(e, { extra: { orderCode: verified.orderCode } });
    // Lỗi hạ tầng thật (DB không tới được) — cho PayOS retry, khác các case
    // "đã xử lý xong" ở trên.
    return new Response("retry", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
