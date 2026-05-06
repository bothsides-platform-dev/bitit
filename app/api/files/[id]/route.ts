/**
 * GET /api/files/{id} — authenticated download.
 *
 * Auth: `auth()` required. 401 if no session.
 *
 * ACL: delegated to `canAccessAttachment` (storage/permissions.ts) so
 * the same matrix applies to every read site (preview iframe, download
 * link, future inbox export). Result codes:
 *   - 401 unauthenticated
 *   - 403 authenticated but not allowed
 *   - 404 row not found
 *
 * Headers (advisor pin 7):
 *   - Content-Type: from `attachment.mime_type` (sniffed at upload).
 *   - Content-Length: from `fs.stat`.
 *   - Content-Disposition: `inline; filename="..."`. Never `attachment`
 *     for v0 — preview iframes need inline.
 *   - Cache-Control: `private, no-store, max-age=0` + `Pragma: no-cache`
 *     so an attachment that becomes invisible (revoked invitation,
 *     workspace removal) isn't served by a stale cache. The session
 *     cookie binds rendering to the user — sharing a link doesn't
 *     bypass auth.
 *
 * v0 limits (advisor pins 8/10):
 *   - No ETag / no Range — returns the full body each time.
 *   - No orphan cleanup — rows whose disk file is missing return 410
 *     so the UI can render a "missing" state (rare; v1 cron sweeper).
 */
import { auth } from '@/auth';
import { getAttachmentRepo } from '@/lib/server/repositories/factory';
import {
  canAccessAttachment,
  type RepoBundleForAttachment,
} from '@/lib/server/storage/permissions';
import { getStorage } from '@/lib/server/storage';
import { db as prodDb } from '@/lib/db/client';
import { getInvitationRepo } from '@/lib/server/repositories/factory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

declare global {
  // eslint-disable-next-line no-var
  var __bidit_files_db_override__: unknown | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function routeDb(): any {
  return globalThis.__bidit_files_db_override__ ?? prodDb;
}

function fail(status: number, msg: string): Response {
  return new Response(msg, { status });
}

// RFC 5987 / 6266 — escape filename for Content-Disposition. We strip
// double-quotes/backslashes/control bytes and emit the cleaned name as
// the standard `filename="..."` form. Browsers handle the rest.
function safeDispositionFilename(name: string): string {
  return name.replace(/[\x00-\x1f"\\]/g, '').slice(0, 200) || 'file';
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return fail(401, 'Unauthorized');

  const { id } = await ctx.params;
  if (!id) return fail(400, 'Bad Request');

  const repo = await getAttachmentRepo();
  const att = await repo.findById(id);
  if (!att) return fail(404, 'Not Found');

  const repos: RepoBundleForAttachment = {
    invitation: await getInvitationRepo(),
  };

  const allowed = await canAccessAttachment(
    routeDb(),
    att,
    {
      user: {
        id: session.user.id,
        workspaceId: (session.user as { workspaceId?: string }).workspaceId,
        workspaceType: (
          session.user as { workspaceType?: 'buyer' | 'pg' }
        ).workspaceType,
      },
    },
    repos,
  );
  if (!allowed) return fail(403, 'Forbidden');

  let body: ReadableStream<Uint8Array>;
  let size: number;
  try {
    const r = await getStorage().read(att.storagePath);
    body = r.stream;
    size = r.size;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return fail(410, 'Gone');
    }
    throw err;
  }

  const headers = new Headers({
    'Content-Type': att.mimeType,
    'Content-Length': String(size),
    'Content-Disposition': `inline; filename="${safeDispositionFilename(att.name)}"`,
    // Per-user content + revocable ACLs — never cache.
    'Cache-Control': 'private, no-store, max-age=0',
    Pragma: 'no-cache',
  });

  return new Response(body, { status: 200, headers });
}
