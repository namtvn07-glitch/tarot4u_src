import { randomInt } from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/auth";
import {
  CreateOrderRequestSchema,
  DEEP_READING_CREDIT_COST,
  PACKS,
  type PackId,
} from "@/lib/orders";
import { getPayOS } from "@/lib/payos";
import { checkRateLimit, relaxInDev, resolveRateLimitIdentity } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EXPIRES_IN_MS = 15 * 60 * 1000;

/**
 * Số credits một gói cộng vào. SERVER-ONLY — cố ý sống ở đây chứ không ở
 * `src/lib/orders.ts`, vì file kia được import vào bundle browser và
 * `DEEP_READING_COST` không phải biến `NEXT_PUBLIC_*`: đọc nó phía client thì
 * luôn ra default, lệch với server trong im lặng.
 *
 * Gói lẻ bán "một lượt Đọc sâu", nên số credits của nó phải bằng đúng chi phí
 * một lượt — nếu hai số này rời nhau thì khách trả tiền xong vẫn không đủ mở
 * khoá chính lượt vừa mua.
 */
function resolvePackCredits(packId: PackId): number {
  // Cảnh báo cấu hình cũ còn sót: DEEP_READING_COST đã được thay bằng
  // NEXT_PUBLIC_DEEP_READING_COST. Nếu deployment vẫn set biến cũ với giá trị
  // khác, người vận hành đang tin vào một con số mà hệ thống không còn dùng.
  const legacy = env.DEEP_READING_COST;
  if (legacy !== undefined && legacy !== DEEP_READING_CREDIT_COST) {
    Sentry.captureMessage(
      "DEEP_READING_COST (đã bỏ) còn được set và lệch với NEXT_PUBLIC_DEEP_READING_COST",
      { level: "error", extra: { legacy, inUse: DEEP_READING_CREDIT_COST } },
    );
  }
  return PACKS[packId].credits ?? DEEP_READING_CREDIT_COST;
}

// Nội dung chuyển khoản in trên VietQR. Không dấu — đây là thứ hiện trong app
// ngân hàng và trên sao kê, nơi tiếng Việt có dấu hay bị bóp méo.
function payosDescription(packId: PackId, credits: number): string {
  return packId === "single" ? "1 luot Doc sau" : `Nap ${credits} credits`;
}

// Nơi PayOS trả người dùng về sau khi thanh toán trên trang của họ (nhánh
// checkoutUrl, không phải nhánh quét QR tại chỗ).
//
// Khách mua gói lẻ đang đứng giữa một lượt Đọc sâu dở dang — đá họ sang trang
// kết quả nạp credits là bỏ rơi đúng thứ họ vừa trả tiền để xem. Trả về
// /doc-sau, nơi phiên trong sessionStorage được khôi phục.
function resolveReturnUrl(packId: PackId, orderId: string): string {
  return packId === "single"
    ? `${env.NEXT_PUBLIC_SITE_URL}/doc-sau?orderId=${orderId}`
    : `${env.NEXT_PUBLIC_SITE_URL}/nap-credits/ket-qua?orderId=${orderId}`;
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, status, credits_purchased, amount_vnd")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    credits: order.credits_purchased,
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 10 đơn/giờ — chống spam tạo đơn rác. Ẩn danh đếm theo IP: id của nó đúc
  // lại được bằng một lời gọi signInAnonymously(), nên "10 đơn/giờ/user" với
  // phiên ẩn danh nghĩa là không có hạn mức nào.
  const identity = resolveRateLimitIdentity(user, request);
  let allowed: boolean;
  try {
    allowed = await checkRateLimit(
      `orders-create:${identity.scope}:${identity.token}`,
      3600,
      relaxInDev(10),
    );
  } catch (rateLimitError) {
    Sentry.captureException(rateLimitError, { extra: { userId: user.id } });
    return NextResponse.json({ error: "rate_limit_check_failed" }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Phiên ẩn danh chỉ mua được gói lẻ. Đó là toàn bộ lý do nó tồn tại: trả
  // tiền cho ĐÚNG lượt đọc đang mở dở. Một phiên sống trong đúng một cookie,
  // không email, không mật khẩu, không đường phục hồi — bán cho nó gói 100
  // credits là bán một thứ nó gần như chắc chắn mất, và đó là vấn đề chính
  // sách hoàn tiền chứ không chỉ là UX.
  if (user.isAnonymous && parsed.data.packId !== "single") {
    return NextResponse.json({ error: "account_required_for_pack" }, { status: 403 });
  }

  const pack = PACKS[parsed.data.packId];
  const packCredits = resolvePackCredits(parsed.data.packId);

  // PayOS orderCode unique integer
  const orderCode = Date.now() * 1000 + randomInt(1000);
  const expiresAt = new Date(Date.now() + EXPIRES_IN_MS);

  const supabaseAdmin = getSupabaseAdmin();
  const { data: order, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: user.id,
      amount_vnd: pack.amountVnd,
      credits_purchased: packCredits,
      payos_order_code: orderCode,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !order) {
    Sentry.captureException(insertError ?? new Error("orders insert returned no row"), {
      extra: { userId: user.id, packId: parsed.data.packId },
    });
    return NextResponse.json({ error: "order_creation_failed" }, { status: 500 });
  }

  try {
    const payment = await getPayOS().paymentRequests.create({
      orderCode,
      amount: pack.amountVnd,
      description: payosDescription(parsed.data.packId, packCredits),
      returnUrl: resolveReturnUrl(parsed.data.packId, order.id),
      cancelUrl: `${env.NEXT_PUBLIC_SITE_URL}${parsed.data.packId === "single" ? "/doc-sau" : "/nap-credits"}`,
      expiredAt: Math.floor(expiresAt.getTime() / 1000),
    });

    // Chuyển đổi mã EMVCo VietQR của PayOS sang DataURL hình ảnh PNG chuẩn nét
    let qrDataUrl = payment.qrCode;
    if (payment.qrCode && !payment.qrCode.startsWith("data:") && !payment.qrCode.startsWith("http")) {
      qrDataUrl = await QRCode.toDataURL(payment.qrCode, {
        width: 320,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    }

    return NextResponse.json({
      orderId: order.id,
      orderCode: payment.orderCode,
      qrCode: qrDataUrl,
      rawQrCode: payment.qrCode,
      checkoutUrl: payment.checkoutUrl,
      amount: pack.amountVnd,
      credits: packCredits,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (e) {
    // KHÔNG xoá dòng đơn. `paymentRequests.create()` ném lỗi không chứng minh
    // PayOS chưa tạo link: timeout lúc đọc response, tiến trình bị kill giữa
    // chừng, hay SDK parse lỗi một phản hồi 200 đều ném ở đây trong khi link
    // đã tồn tại thật với đúng orderCode này. Nếu khách chạm tới link đó và
    // trả tiền, webhook về mà không còn dòng đơn nào mang mã đó thì:
    //   - credit_order trả 'not_found', khách mất tiền;
    //   - và tệ hơn, không còn gì để đối soát thủ công, đúng thứ
    //     /chinh-sach-hoan-tien hứa với khách là sẽ tra theo payos_order_code.
    // Đánh 'failed' thay vì xoá: giữ bằng chứng, và credit_order (bản
    // 20260920000100) vẫn cộng đúng nếu tiền thật sự vào.
    const { error: markFailedError } = await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", order.id)
      .eq("status", "pending");
    if (markFailedError) {
      Sentry.captureException(markFailedError, { extra: { orderId: order.id, orderCode } });
    }
    Sentry.captureException(e, { extra: { userId: user.id, orderCode } });
    return NextResponse.json({ error: "payos_create_failed" }, { status: 500 });
  }
}
