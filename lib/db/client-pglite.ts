// In-process pglite for tests. Use createPgliteDb() per test for isolation.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';

export function createPgliteDb() {
  const pg = new PGlite();
  return drizzle(pg, { schema, casing: 'snake_case' });
}

export type PgliteDB = ReturnType<typeof createPgliteDb>;
