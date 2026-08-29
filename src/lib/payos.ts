import { PayOS } from "@payos/node";
import { env } from "@/lib/env";

let cached: PayOS | undefined;

// Lazy — cùng lý do đã ghi ở getSupabaseAdmin() (src/lib/supabase/admin.ts):
// module-scope `new PayOS(...)` đọc `env` ngay lúc import, mà `next build`
// đánh giá tĩnh toàn bộ module graph lúc thu thập page data.
export function getPayOS(): PayOS {
  return (cached ??= new PayOS({
    clientId: env.PAYOS_CLIENT_ID,
    apiKey: env.PAYOS_API_KEY,
    checksumKey: env.PAYOS_CHECKSUM_KEY,
  }));
}
