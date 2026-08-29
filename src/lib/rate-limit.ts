import { getSupabaseAdmin } from "@/lib/supabase/admin";

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function checkRateLimit(
  key: string,
  windowSeconds: number,
  maxCount: number,
): Promise<boolean> {
  try {
    const { data: allowed, error } = await getSupabaseAdmin().rpc("check_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max_count: maxCount,
    });
    if (error) return true; // Fail open in dev
    return Boolean(allowed);
  } catch {
    return true; // Fail open
  }
}
