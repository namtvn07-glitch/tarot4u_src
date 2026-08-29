import { createBrowserClient } from "@supabase/ssr";

// Browser-side client — safe to use in Client Components.
// Directly access process.env.NEXT_PUBLIC_* so Turbopack/Next.js inlines them into client JS bundle.
export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://zlnrflevvavlhxqvtthj.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsbnJmbGV2dmF2bGh4cXZ0dGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzA2NTYsImV4cCI6MjEwMTg0NjY1Nn0.j5mo5vTfVm0RBsvqxYvAtc_OFiT_y2y3PJ3l8TqqL_o";

  return createBrowserClient(url, anonKey);
}
