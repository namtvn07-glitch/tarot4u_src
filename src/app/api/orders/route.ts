import { randomInt } from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/auth";
import { CreateOrderRequestSchema, PACKS } from "@/lib/orders";
import { getPayOS } from "@/lib/payos";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EXPIRES_IN_MS = 15 * 60 * 1000;

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

  // 10 đơn/giờ — chống spam tạo đơn rác
  let allowed: boolean;
  try {
    allowed = await checkRateLimit(`orders-create:user:${user.id}`, 3600, 10);
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
  const pack = PACKS[parsed.data.packId];

  // PayOS orderCode unique integer
  const orderCode = Date.now() * 1000 + randomInt(1000);
  const expiresAt = new Date(Date.now() + EXPIRES_IN_MS);

  const supabaseAdmin = getSupabaseAdmin();
  const { data: order, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: user.id,
      amount_vnd: pack.amountVnd,
      credits_purchased: pack.credits,
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
      description: `Nap ${pack.credits} credits`,
      returnUrl: `${env.NEXT_PUBLIC_SITE_URL}/nap-credits/ket-qua?orderId=${order.id}`,
      cancelUrl: `${env.NEXT_PUBLIC_SITE_URL}/nap-credits`,
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
      credits: pack.credits,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (e) {
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    Sentry.captureException(e, { extra: { userId: user.id, orderCode } });
    return NextResponse.json({ error: "payos_create_failed" }, { status: 500 });
  }
}
