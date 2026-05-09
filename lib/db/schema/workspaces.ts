import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspaceTypeEnum } from './_enums';
import { bizProfiles } from './biz-profiles';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: workspaceTypeEnum('type').notNull(),
  name: text('name').notNull(),
  bizProfileId: uuid('biz_profile_id').references(() => bizProfiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});
