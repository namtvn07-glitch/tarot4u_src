import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Phiên ẩn danh KHÔNG BAO GIỜ hết hạn: `[auth.sessions] timebox` đang comment
// trong config.toml và `enable_refresh_token_rotation = true`. Nên mỗi lượt
// khách bấm "Mở khoá" rồi bỏ ngang để lại vĩnh viễn một hàng `auth.users` +
// một hàng `profiles`. Không có cron này thì hai bảng đó tăng đơn điệu theo
// lưu lượng, không theo số người dùng thật.
const MAX_AGE_DAYS = 30;

// Xoá theo lô: `auth.admin.deleteUser` chỉ nhận một id mỗi lần, và một lần
// chạy cron không nên kéo dài vô hạn. Phần còn lại được lượt chạy hôm sau dọn
// tiếp — hàng bỏ hoang không gấp.
const MAX_DELETIONS_PER_RUN = 200;

/**
 * Dọn phiên khách bỏ hoang (chạy hằng ngày qua vercel.json).
 *
 * Chỉ xoá hàng thoả CẢ BA:
 *   1. `is_anonymous = true` — tài khoản thật không bao giờ bị đụng tới.
 *   2. Tạo đã quá 30 ngày.
 *   3. Không có `orders` nào.
 *
 * Điều kiện 3 là ranh giới giữa "dọn rác" và "xoá khách hàng". FK
 * `on delete restrict` trên `orders`/`credit_ledger` sẽ chặn việc xoá một
 * người đã trả tiền ngay ở tầng Postgres — đó là hàng rào ĐÚNG hướng, dựng
 * lên có chủ đích để không ai xoá được lịch sử tài chính cần đối soát. Lọc
 * sẵn ở đây chỉ để không đâm vào nó 200 lần mỗi đêm rồi log ra 200 lỗi FK;
 * tuyệt đối không tìm cách lách nó.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60_000).toISOString();

  const { data, error: selectError } = await admin.rpc("list_abandoned_anonymous_users", {
    p_cutoff: cutoff,
    p_limit: MAX_DELETIONS_PER_RUN,
  });

  if (selectError) {
    Sentry.captureException(selectError);
    return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
  }

  const candidates = (data ?? []) as { id: string }[];
  let deleted = 0;
  const failures: string[] = [];

  for (const row of candidates) {
    const { error } = await admin.auth.admin.deleteUser(row.id);
    if (error) {
      // Một hàng không xoá được không được làm hỏng cả lượt chạy — phần lớn
      // là đơn hàng vừa được tạo giữa lúc select và lúc delete, đúng trường
      // hợp mà `on delete restrict` phải chặn.
      failures.push(row.id);
      continue;
    }
    deleted += 1;
  }

  if (failures.length > 0) {
    Sentry.captureMessage("cleanup-anonymous: một số phiên không xoá được", {
      level: "warning",
      extra: { failedCount: failures.length, sample: failures.slice(0, 5) },
    });
  }

  return NextResponse.json({ ok: true, deleted, failed: failures.length });
}
