import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AFFILIATE_COOKIE } from "@/lib/affiliate";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Cookie affiliate sống 30 ngày (AFFILIATE_COOKIE_MAX_AGE_SECONDS) và
// handle_new_user() cũng chỉ nhận click trong đúng cửa sổ đó. Hai con số này
// phải bằng nhau, nếu không sẽ có click "hợp lệ theo cookie nhưng quá hạn theo
// trigger" và người dùng mất nguồn mà không ai hiểu vì sao.
const CLICK_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Gắn nguồn affiliate cho một tài khoản VỪA được nâng cấp từ phiên khách.
 *
 * Vì sao cần route riêng thay vì để trigger `handle_new_user` lo như đăng ký
 * thường: trigger đó chạy lúc INSERT vào `auth.users`. Với luồng khách, lần
 * INSERT ấy xảy ra ở `signInAnonymously()` — lúc đó ta CỐ Ý không truyền
 * `ref_click`, vì nếu truyền thì một người được đếm hai lần (một lần lúc ẩn
 * danh, một lần nữa nếu sau này họ đăng ký lại bằng cookie vẫn còn) và tỉ lệ
 * chuyển đổi của affiliate vượt quá 100% — kéo theo nghĩa vụ chi hoa hồng sai.
 * `updateUser()` lúc nâng cấp thì không kích hoạt trigger nào cả. Nên attribution
 * được gắn đúng MỘT lần, ở đây, khi đã biết chắc đây là tài khoản thật.
 *
 * Phải chạy bằng service role: `guard_profiles_protected_columns` chặn mọi
 * thay đổi `referred_by_code`/`referred_click_id` không đến từ service_role.
 */
export async function POST() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Phiên ẩn danh chưa phải tài khoản — gắn nguồn cho nó chính là cái đếm hai
  // lần mà route này sinh ra để tránh.
  if (user.isAnonymous) {
    return NextResponse.json({ error: "anonymous_not_eligible" }, { status: 403 });
  }

  const clickId = (await cookies()).get(AFFILIATE_COOKIE)?.value;
  if (!clickId || !UUID_PATTERN.test(clickId)) {
    return NextResponse.json({ claimed: false, reason: "no_click" });
  }

  const admin = getSupabaseAdmin();

  try {
    // First-touch và bất biến: chỉ gắn khi hàng profiles chưa có nguồn nào.
    // Không bao giờ ghi đè — người đã có nguồn mà bị đổi sang nguồn khác là
    // cướp công của affiliate trước đó.
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("referred_click_id")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;
    if (profile?.referred_click_id) {
      return NextResponse.json({ claimed: false, reason: "already_attributed" });
    }

    // Cùng điều kiện với handle_new_user(): click phải tồn tại thật, còn trong
    // cửa sổ 30 ngày, và mã của nó phải còn trong affiliate_links. Client sửa
    // cookie không tự gán được mã cho mình vì uuid phải khớp một dòng có thật.
    const { data: click, error: clickError } = await admin
      .from("affiliate_clicks")
      .select("id, code, created_at")
      .eq("id", clickId)
      .maybeSingle();

    if (clickError) throw clickError;
    if (!click) {
      return NextResponse.json({ claimed: false, reason: "click_not_found" });
    }
    if (Date.now() - new Date(click.created_at).getTime() > CLICK_MAX_AGE_MS) {
      return NextResponse.json({ claimed: false, reason: "click_expired" });
    }

    const { data: link, error: linkError } = await admin
      .from("affiliate_links")
      .select("code")
      .eq("code", click.code)
      .maybeSingle();

    if (linkError) throw linkError;
    // Mã bị xoá hẳn thì không còn nguồn để gán — khớp ràng buộc
    // `on delete set null` của profiles.referred_by_code. Cố ý KHÔNG kiểm
    // is_active: tắt link nghĩa là ngừng nhận traffic mới, không xoá công của
    // người đã bấm lúc nó còn chạy (xem 20260909114547_...).
    if (!link) {
      return NextResponse.json({ claimed: false, reason: "link_removed" });
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ referred_by_code: click.code, referred_click_id: click.id })
      .eq("id", user.id)
      // Điều kiện đua: hai request song song thì chỉ một cái ghi được.
      .is("referred_click_id", null);

    if (updateError) throw updateError;

    return NextResponse.json({ claimed: true });
  } catch (error) {
    // Attribution hỏng không bao giờ được làm hỏng việc nâng cấp tài khoản —
    // caller cố ý bỏ qua kết quả của route này. Vẫn báo Sentry để không âm thầm
    // mất doanh thu affiliate.
    Sentry.captureException(error, { extra: { userId: user.id } });
    return NextResponse.json({ claimed: false, reason: "error" }, { status: 500 });
  }
}
