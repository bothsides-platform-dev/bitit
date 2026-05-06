import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspaceTypeEnum } from './_enums';
import { bizProfiles } from './biz-profiles';

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: workspaceTypeEnum('type').notNull(),
    name: text('name').notNull(),
    domain: text('domain'),
    bizProfileId: uuid('biz_profile_id').references(() => bizProfiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    // Partial unique on domain (NULL allowed for buyer workspaces).
    uniqueIndex('workspaces_domain_unique')
      .on(t.domain)
      .where(sql`${t.domain} IS NOT NULL`),
    // PG workspace must have a domain; buyer workspaces are unconstrained.
    check(
      'pg_domain_required',
      sql`(${t.type} <> 'pg') OR (${t.domain} IS NOT NULL)`,
    ),
  ],
);
