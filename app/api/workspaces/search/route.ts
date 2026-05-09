/**
 * GET /api/workspaces/search?q=&type=pg
 *
 * PG 워크스페이스 이름 검색 endpoint. 바이어가 RFQ 초대 대상을 추가할 때
 * 사용한다. 인증된 사용자(buyer·pg 모두)가 호출 가능.
 *
 * runtime='nodejs' — postgres-js는 Node-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, ilike, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/lib/db/client';
import { workspaces } from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['buyer', 'pg']).default('pg'),
});

/** Escape ILIKE metacharacters to prevent unintentional pattern injection. */
function escapeIlike(s: string): string {
  return s.replace(/[\\%_]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  // type=pg: open to unauthenticated callers (PG names are public business entities).
  // type=buyer: requires auth — buyer workspace names are private.
  const { searchParams } = request.nextUrl;
  const parsed = QuerySchema.safeParse({
    q: searchParams.get('q') ?? '',
    type: searchParams.get('type') ?? 'pg',
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { q, type } = parsed.data;

  if (type === 'buyer') {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
  }

  const pattern = `%${escapeIlike(q)}%`;

  const rows = await db
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaces)
    .where(
      and(
        eq(workspaces.type, type),
        ilike(workspaces.name, pattern),
      ),
    )
    .limit(20);

  // Disambiguate duplicate names: if a name appears multiple times in results,
  // append the first 8 chars of the UUID as a suffix.
  const nameCount = new Map<string, number>();
  for (const row of rows) {
    nameCount.set(row.name, (nameCount.get(row.name) ?? 0) + 1);
  }

  const result = rows.map((row) => ({
    id: row.id,
    name: row.name,
    displayName:
      (nameCount.get(row.name) ?? 1) > 1
        ? `${row.name} #${row.id.slice(0, 8)}`
        : row.name,
  }));

  return NextResponse.json({ workspaces: result });
}
