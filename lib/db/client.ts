// Production Postgres client. For tests use ./client-pglite.ts.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __bidit_pg__: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__bidit_pg__ ??
  postgres(process.env.DATABASE_URL!, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__bidit_pg__ = client;
}

export const db = drizzle(client, { schema, casing: 'snake_case' });
export type DB = typeof db;
