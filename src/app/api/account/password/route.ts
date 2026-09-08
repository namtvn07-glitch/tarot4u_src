import * as Sentry from "@sentry/nextjs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { createPasswordSchema, isPasswordBreached } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

// "Tài khoản này đổi mật khẩu được không?" — RPC phải chạy bằng client SSR của chính
// user (hàm dựa vào auth.uid()), không dùng được admin client.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("current_user_has_password");
  if (error) {
    Sentry.captureException(error, { extra: { userId: user.id } });
    return NextResponse.json({ error: "check_failed" }, { status: 500 });
  }

  return NextResponse.json({ canChangePassword: Boolean(data) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 5 lần/giờ — đây cũng là đường đoán mật khẩu hiện tại, không chỉ là form tiện ích.
  // Key phải mang tiền tố tên route, nếu không sẽ dùng chung bucket với route khác.
  let allowed: boolean;
  try {
    allowed = await checkRateLimit(`account-password:user:${user.id}`, 3600, 5);
  } catch (rateLimitError) {
    Sentry.captureException(rateLimitError, { extra: { userId: user.id } });
    return NextResponse.json({ error: "rate_limit_check_failed" }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = BodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsedBody.data;

  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "same_password" }, { status: 400 });
  }

  const parsedPassword = createPasswordSchema({ email: user.email }).safeParse(newPassword);
  if (!parsedPassword.success) {
    return NextResponse.json(
      {
        error: "invalid_password",
        messages: parsedPassword.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  // NIST SP 800-63B-4 §3.1.1.2 — bắt buộc đối chiếu với danh sách mật khẩu đã lộ.
  // null = không kiểm tra được (HIBP lỗi/timeout): cho qua nhưng phải để lại dấu vết,
  // im lặng bỏ qua thì không ai biết lớp bảo vệ này đã tắt bao lâu.
  const breached = await isPasswordBreached(newPassword);
  if (breached === true) {
    return NextResponse.json({ error: "breached_password" }, { status: 400 });
  }
  if (breached === null) {
    Sentry.captureException(new Error("HIBP breach check unavailable"), {
      level: "warning",
      extra: { userId: user.id, route: "POST /api/account/password" },
    });
  }

  const { data: hasPassword, error: hasPasswordError } = await supabase.rpc(
    "current_user_has_password",
  );
  if (hasPasswordError) {
    Sentry.captureException(hasPasswordError, { extra: { userId: user.id } });
    return NextResponse.json({ error: "check_failed" }, { status: 500 });
  }
  if (!hasPassword || !user.email) {
    return NextResponse.json({ error: "no_password_set" }, { status: 400 });
  }

  // Đăng nhập lại bằng mật khẩu cũ trên một client RIÊNG (không đụng cookie session
  // hiện tại) — vừa là cách xác minh "đúng là chủ tài khoản", vừa cho phép gọi
  // updateUser trong ngữ cảnh của chính user đó.
  //
  // Cố ý KHÔNG dùng admin.updateUserById: đường admin đi vòng qua chính sách mật khẩu
  // của GoTrue (độ dài tối thiểu, leaked-password protection), tức là tự tạo một cửa
  // hậu yếu hơn cửa đăng ký.
  const verifier = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error: signInError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) {
    return NextResponse.json({ error: "invalid_current_password" }, { status: 400 });
  }

  const { error: updateError } = await verifier.auth.updateUser({ password: newPassword });

  // Phiên tạm này đã xong việc — thu hồi ngay, kể cả khi update lỗi, để không để lại
  // refresh token treo. Lỗi ở bước dọn dẹp không phải lỗi của người dùng.
  await verifier.auth.signOut().catch(() => undefined);

  if (updateError) {
    if (updateError.code === "same_password") {
      return NextResponse.json({ error: "same_password" }, { status: 400 });
    }
    if (updateError.code === "weak_password") {
      return NextResponse.json({ error: "weak_password" }, { status: 400 });
    }
    Sentry.captureException(updateError, { extra: { userId: user.id } });
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
