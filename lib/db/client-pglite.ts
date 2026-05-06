// In-process pglite for tests. Use createPgliteDb() per test for isolation.
// Schema is applied via the same drizzle-generated migration SQL the prod DB
// uses, so drift is impossible by construction.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from './schema';

// Resolve drizzle/ migrations relative to this file so tests work from any cwd.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_FOLDER = path.resolve(__dirname, '../../drizzle');

export async function createPgliteDb() {
  const pg = new PGlite();
  const db = drizzle(pg, { schema, casing: 'snake_case' });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

// PgliteDB type — extracted from the synchronous drizzle factory call so the
// type stays usable in interfaces without dragging Promise around.
export type PgliteDB = ReturnType<typeof drizzle<typeof schema>>;
