import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Shared callback for both Google OAuth and magic-link sign-in — Supabase
// Auth puts both through the same PKCE code-exchange flow, so one handler
// covers both.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  // Only ever follow a same-origin relative path. `${origin}${next}` string
  // concat (rather than `new URL(next, origin)`) already stops the classic
  // absolute-URL open-redirect bypass, but a leading "//" is parsed by
  // browsers as protocol-relative — reject that too instead of relying on
  // the concat shape alone.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Missing code or a failed exchange. Trả người dùng về đúng nơi họ định tới kèm
  // `error=link_expired` khi có `next` — người bấm link đặt lại mật khẩu đã hết hạn
  // mà bị đá thẳng ra trang chủ thì không có cách nào biết chuyện gì vừa xảy ra.
  // Không có `next` thì giữ nguyên hành vi cũ: về trang chủ.
  if (next !== "/") {
    // `new URL(next, origin)` an toàn ở đây vì `next` đã được lọc ở trên (bắt buộc
    // bắt đầu bằng "/" và không phải "//"), và nó xử lý đúng cả trường hợp `next`
    // vốn đã có sẵn query string.
    const target = new URL(next, origin);
    target.searchParams.set("error", "link_expired");
    return NextResponse.redirect(target);
  }
  return NextResponse.redirect(`${origin}/`);
}
