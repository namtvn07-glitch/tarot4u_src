import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

// Giai đoạn 5 — mảng để Giai đoạn 6 (trang nạp credits) thêm entry mới mà
// không phải sửa logic redirect bên dưới. Cố ý KHÔNG gồm /doc-sau — route
// đó đã có in-page soft-gate riêng từ Giai đoạn 4c (`.claude/brain/phase-4c-doc-sau/`),
// không đụng vào việc của task khác.
// /nap-credits (Giai đoạn 6): mua credits bắt buộc phải có tài khoản để gắn
// đúng user, không có luồng khách vãng lai.
const PROTECTED_PREFIXES = ["/tai-khoan", "/nap-credits"];

// Refreshes the Supabase auth cookie on every request so Server Components
// always see a valid session, and — from Giai đoạn 5 — redirects unauthenticated
// requests away from protected routes before any Server Component runs.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  } catch {
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}
