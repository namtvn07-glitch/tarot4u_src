import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { triageQuestion } from "@/lib/moderation";
import { checkRateLimit, getClientIp, refundRateLimit } from "@/lib/rate-limit";
import { DeepReadingRequestSchema, drawCards } from "@/lib/reading";
import { signDrawToken } from "@/lib/reading-token";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// Kiểm duyệt AI có thể phải thử lại vài nhịp khi provider quá tải (ngân sách
// ở src/lib/moderation.ts) — mặc định 10s của Vercel không đủ chỗ cho nó.
export const maxDuration = 30;

// Bước 1 của Đọc sâu — rút bài KÍN, không lộ nội dung cho client (xem
// 03-kien-truc-ai.md §7.2). Không đụng credits ở bước này.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = DeepReadingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { topic, question } = parsed.data;

  // Xác thực + hạn mức chạy TRƯỚC khi gọi AI. Trước đây triage chạy song song
  // để giảm độ trễ, nhưng như vậy request bị chặn 429 vẫn tốn một call Gemini
  // thật — kẻ spam vẫn đốt được quota (và sau khi bật billing là hoá đơn) của
  // mình dù đã bị từ chối. Endpoint này lại không bắt buộc đăng nhập.
  //
  // Đọc sâu tới hết Lớp Nền miễn phí không cần đăng nhập nữa — chỉ bước mở
  // khóa luận giải chuyên sâu (trừ credits, personal/route.ts) mới bắt buộc.
  // Ẩn danh giới hạn theo IP (06-bao-mat-kiem-duyet-phap-ly.md §2.2), vẫn
  // chặt hơn Rút Nhanh vì bước này gọi AI kiểm duyệt thật trên mọi lần thử.
  const user = await requireUser();
  const rateLimitKey = user
    ? `reading-deep-shuffle:user:${user.id}`
    : `reading-deep-shuffle:ip:${getClientIp(request)}`;
  // 10 chứ không phải 3: mạng di động VN (Viettel/VNPT) NAT rất nhiều thuê
  // bao sau cùng một IP công cộng, nên hạn mức "3 lượt/ngày/IP" trên thực tế
  // là 3 lượt chia cho cả một nhóm người lạ. Một lượt xáo bài chỉ tốn một
  // call flash rẻ, nên 10 vẫn an toàn về chi phí.
  const [rateLimitWindow, rateLimitMax] = user
    ? [3600, process.env.NODE_ENV === "development" ? 100 : 30]
    : [86400, 10];

  let allowed: boolean;
  try {
    allowed = await checkRateLimit(rateLimitKey, rateLimitWindow, rateLimitMax);
  } catch (rateLimitError) {
    Sentry.captureException(rateLimitError, { extra: { userId: user?.id, topic } });
    return NextResponse.json({ error: "rate_limit_check_failed" }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const triage = await triageQuestion(question).catch((err) => {
    Sentry.captureException(err, { extra: { userId: user?.id, topic } });
    return null;
  });
  if (!triage) {
    // Lỗi của hệ thống, không phải của người dùng — trả lại nhịp đếm vừa trừ,
    // nếu không thì vài lần AI chập chờn là khoá sạch hạn mức của họ.
    await refundRateLimit(rateLimitKey, rateLimitWindow);
    return NextResponse.json({ error: "moderation_failed" }, { status: 500 });
  }

  // Chặn trước khi rút bài — không tạo token, không trừ credits. Client
  // render thông báo tương ứng category (xem CrisisResourceNotice).
  if (triage.category !== "ok") {
    return NextResponse.json({ blocked: true, category: triage.category });
  }

  const cards = drawCards(3, triage.orientation_mode);
  const token = signDrawToken({
    userId: user?.id ?? null,
    topic,
    question,
    orientationMode: triage.orientation_mode,
    cards,
  });

  return NextResponse.json({ token, slots: env.DEEP_SPREAD_SLOTS });
}
