import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { env } from "@/lib/env";
import {
  AFFILIATE_CODE_PATTERN,
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_MAX_AGE_SECONDS,
  BOT_USER_AGENT_PATTERN,
} from "@/lib/affiliate";
import { getClientIp } from "@/lib/rate-limit";

// Giai đoạn 5 — mảng để Giai đoạn 6 (trang nạp credits) thêm entry mới mà
// không phải sửa logic redirect bên dưới. Cố ý KHÔNG gồm /doc-sau — route
// đó đã có in-page soft-gate riêng từ Giai đoạn 4c (`.claude/brain/phase-4c-doc-sau/`),
// không đụng vào việc của task khác.
// /nap-credits (Giai đoạn 6): mua credits bắt buộc phải có tài khoản để gắn
// đúng user, không có luồng khách vãng lai.
// /admin: chỉ để đá người CHƯA ĐĂNG NHẬP về trang login sớm. Việc kiểm tra có
// phải admin hay không cố ý KHÔNG làm ở đây — middleware này fail-open khi lỗi
// mạng (đúng cho "có session không"), mà quyền admin thì phải fail-closed.
// Quyết định đó nằm ở src/app/admin/layout.tsx.
const PROTECTED_PREFIXES = ["/tai-khoan", "/nap-credits", "/admin"];

// sha256 rút gọn: 16 ký tự hex đủ để dedupe/rate-limit theo IP, không cần chống
// va chạm mật mã. Không bao giờ lưu IP thô.
async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

// Ghi bằng SERVICE ROLE, không phải anon key. Trước đây bảng affiliate_clicks
// có policy cho anon insert — mà anon key nằm công khai trong bundle browser,
// nên bất kỳ ai cũng bơm được click rác vào mã bất kỳ hoặc ghi vô hạn vào
// Postgres. Service role key chỉ tồn tại phía server, không đi vào bundle.
// RPC tự validate mã + rate limit trước khi ghi.
async function recordAffiliateClick(
  clickId: string,
  code: string,
  ip: string,
  isBot: boolean,
  landingPath: string,
): Promise<void> {
  try {
    await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/record_affiliate_click`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        p_click_id: clickId,
        p_code: code,
        p_ip_hash: await hashIp(ip),
        p_is_bot: isBot,
        p_landing_path: landingPath,
      }),
    });
  } catch {
    // Fail open: theo dõi marketing không bao giờ được làm hỏng một lượt truy
    // cập thật. Mất một dòng click = mất attribution của lượt đó, chấp nhận.
  }
}

// Refreshes the Supabase auth cookie on every request so Server Components
// always see a valid session, and — from Giai đoạn 5 — redirects unauthenticated
// requests away from protected routes before any Server Component runs.
export async function updateSession(
  request: NextRequest,
  event?: NextFetchEvent,
) {
  let supabaseResponse = NextResponse.next({ request });

  // ---- Bắt link affiliate (first-touch) -------------------------------
  // Chỉ set khi CHƯA có cookie => lần `?ref=` sau trên cùng trình duyệt là
  // no-op. Đó chính là cơ chế first-touch: affiliate đưa người dùng đến đầu
  // tiên được ghi công, không bị affiliate sau "cướp" ở bước cuối.
  const refParam = request.nextUrl.searchParams.get("ref");
  let affiliateClickId: string | null = null;

  if (
    refParam &&
    AFFILIATE_CODE_PATTERN.test(refParam) &&
    !request.cookies.get(AFFILIATE_COOKIE)
  ) {
    const isBot = BOT_USER_AGENT_PATTERN.test(
      request.headers.get("user-agent") ?? "",
    );
    const clickId = crypto.randomUUID();
    // Bot không bao giờ đăng ký nên không cần cookie; vẫn ghi dòng click với
    // is_bot=true để thấy được bao nhiêu traffic là crawler xem trước link.
    if (!isBot) affiliateClickId = clickId;

    const work = recordAffiliateClick(
      clickId,
      refParam,
      getClientIp(request),
      isBot,
      request.nextUrl.pathname,
    );
    // waitUntil: không chặn phản hồi vì một lượt ghi thống kê.
    if (event) event.waitUntil(work);
  }

  // Supabase có thể TẠO LẠI supabaseResponse trong setAll bên dưới (khi refresh
  // token), nên cookie affiliate phải được gắn ở từng điểm return, không thể
  // gắn một lần từ đầu — nếu không nó sẽ bị nuốt mất im lặng.
  const attachAffiliateCookie = (response: NextResponse) => {
    if (!affiliateClickId) return response;
    response.cookies.set(AFFILIATE_COOKIE, affiliateClickId, {
      maxAge: AFFILIATE_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // KHÔNG httpOnly: đăng ký chạy hoàn toàn client-side
      // (supabase.auth.signUp), chỉ JS trình duyệt mới đọc và gửi kèm được.
      httpOnly: false,
    });
    return response;
  };

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Best-effort refresh: a transient network failure here must not 500
  // every request. Falling through with no session is always a safe
  // default — worst case, a protected page's own auth check catches it.
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/dang-nhap";
      url.searchParams.delete("ref");
      url.searchParams.set("next", request.nextUrl.pathname);
      return attachAffiliateCookie(NextResponse.redirect(url));
    }
  } catch {
    return attachAffiliateCookie(NextResponse.next({ request }));
  }

  return attachAffiliateCookie(supabaseResponse);
}
