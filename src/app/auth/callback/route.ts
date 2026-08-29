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

  // Missing code or a failed exchange — back to home rather than stranding
  // the user on a bare /auth/callback URL. A dedicated error page is part of
  // the Giai đoạn 5 login UI, not this route.
  return NextResponse.redirect(`${origin}/`);
}
