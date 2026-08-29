import * as Sentry from "@sentry/nextjs";

// Browser init, auto-loaded by Next.js (replaces the old sentry.client.config.ts).
// NEXT_PUBLIC_ prefix because the DSN has to reach the client bundle — it's
// not a secret (see @sentry/nextjs docs). Empty/undefined dsn = safe no-op.
// Phòng vệ thêm cho 06-bao-mat-kiem-duyet-phap-ly.md §4.4 — xem
// src/instrumentation.ts cho lý do đầy đủ.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  tracesSampleRate: 1,
  beforeSend(event) {
    if (event.request) delete event.request.data;
    return event;
  },
});

// Required by the SDK to instrument App Router client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
