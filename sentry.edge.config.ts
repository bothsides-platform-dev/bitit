import * as Sentry from "@sentry/nextjs";

if (process.env.NODE_ENV !== "development") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    tracesSampleRate: 0.1,
    enableLogs: true,
  });
}
