import * as Sentry from "@sentry/nextjs";

// Server + edge init, current @sentry/nextjs convention (register() hook,
// no sentry.server.config.ts / sentry.edge.config.ts split anymore).
// `dsn: undefined` makes the SDK a safe no-op — there is no Sentry project
// yet (see task.md Open Questions), and this must never crash the app.
// Phòng vệ thêm cho 06-bao-mat-kiem-duyet-phap-ly.md §4.4 ("không log nội
// dung câu hỏi") — không route nào hiện truyền `question` vào Sentry
// `extra` (đã audit trực tiếp), và `sendDefaultPii` đang tắt nên request
// body không tự động gửi kèm. Đây là lớp phòng vệ nếu default đó đổi sau
// này mà không ai soát lại.
function beforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.request) delete event.request.data;
  return event;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || undefined,
      tracesSampleRate: 1,
      beforeSend,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || undefined,
      tracesSampleRate: 1,
      beforeSend,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
