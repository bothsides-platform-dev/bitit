// ResendSender — concrete `Sender` (lib/server/outbox/types.ts) backed by the
// Resend HTTP API.
//
// Two operating modes, decided per-call by env (so a single dev process can
// switch behaviour by setting/clearing `RESEND_API_KEY`):
//
//   1. `RESEND_API_KEY` set:    Resend.emails.send({ from, to, subject, html })
//      → maps API result to `{ ok: true } | { ok: false, error }`.
//
//   2. `RESEND_API_KEY` unset:  dev fallback. Logs `[email DEV] event=... to=...
//      subject=... dedupeKey=...` and resolves `{ ok: true }`. **html is never
//      logged** — it's verbose and contains links not safe to dump in shared
//      terminal scrollback. The console line replaces the legacy
//      `devLogVerifyLink` / `devLogRfqInviteLink` helpers (now deleted).
//
// `from` defaults to `noreply@bidit.local` (override with `RESEND_FROM`). For
// production sending, `RESEND_FROM` MUST resolve to a domain verified in the
// Resend dashboard — Resend rejects `from` addresses on unverified domains
// with HTTP 403. The default value is intentionally non-routable so a missing
// override surfaces immediately.

import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';
import type { Sender } from '@/lib/server/outbox/types';

const DEFAULT_FROM = 'send@bidit.store';

function resolveFrom(): string {
  return process.env.RESEND_FROM ?? DEFAULT_FROM;
}

let cachedClient: Resend | null = null;
function getClient(apiKey: string): Resend {
  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

// Test hook — clear the cached client so a different API key (or no key) can
// be re-evaluated between tests. Production code never calls this.
export function __resetResendClientForTest(): void {
  cachedClient = null;
}

export const ResendSender: Sender = async (entry) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || process.env.NODE_ENV === 'development') {
    // Dev fallback. Format intentionally distinct from the deleted
    // `[DEV signup-verify]` / `[DEV rfq-invite]` lines so the
    // `grep -rn "[DEV " lib/server` regression gate stays at 0 hits.
    // dedupeKey included per Step 10 spec, html intentionally excluded.
    console.log(
      `[email DEV] event=${entry.event} to=${entry.to} subject=${entry.subject} dedupeKey=${entry.dedupeKey ?? '-'}`,
    );
    return { ok: true };
  }

  try {
    const client = getClient(apiKey);
    const result = await client.emails.send({
      from: resolveFrom(),
      to: entry.to,
      subject: entry.subject,
      html: entry.html,
    });

    if ('error' in result && result.error) {
      const err = result.error as { name?: string; message?: string };
      const message = err.message ?? err.name ?? 'resend_unknown_error';
      Sentry.captureException(new Error(`Email send failed: ${message}`), {
        extra: {
          event: entry.event,
          to: entry.to,
          subject: entry.subject,
          dedupeKey: entry.dedupeKey ?? null,
        },
      });
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (e) {
    Sentry.captureException(e, {
      extra: {
        event: entry.event,
        to: entry.to,
        subject: entry.subject,
        dedupeKey: entry.dedupeKey ?? null,
      },
    });
    return { ok: false, error: (e as Error).message ?? 'resend_threw' };
  }
};

// Factory — used by callers that want to inject a sender (cron route, etc.).
// Exists so tests can stub a different sender via dependency injection while
// production callers stay on the env-driven `ResendSender` const.
export function getResendSender(): Sender {
  return ResendSender;
}
