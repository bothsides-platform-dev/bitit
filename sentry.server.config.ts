import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV !== "development",
  sendDefaultPii: true,
  tracesSampleRate: 0.1,
  includeLocalVariables: true,
  enableLogs: true,
});
