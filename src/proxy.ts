import { type NextRequest, type NextFetchEvent } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the `middleware` file convention to `proxy` (the
// exported function must be named/default-exported as `proxy` now — see
// next.js proxy.md "Migration to Proxy"). Convention files (this one,
// instrumentation.ts) live under src/ alongside src/app — Next looks for them
// at the project root OR inside src/, not both. `src/lib/supabase/middleware.ts`
// keeps its name; that's just an internal helper module, not the special file.
// `event` để updateSession dùng waitUntil() cho lượt ghi click affiliate —
// ghi thống kê không được làm chậm phản hồi của người dùng thật.
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  return await updateSession(request, event);
}

export const config = {
  matcher: [
    // Skip Next internals and static files with an extension (images,
    // fonts, etc.) — everything else (pages, API routes) gets the session
    // cookie refreshed.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
