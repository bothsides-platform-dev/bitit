import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  bizStatusEnum,
  gradeSourceEnum,
  merchantGradeEnum,
  taxTypeEnum,
} from './_enums';
import { users } from './users';

// Immutable: edits create a new row + workspace.biz_profile_id pointer update.
export const bizProfiles = pgTable('biz_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  bizNo: text('biz_no').notNull(),
  taxType: taxTypeEnum('tax_type').notNull(),
  status: bizStatusEnum('status').notNull(),
  grade: merchantGradeEnum('grade'),
  gradeSource: gradeSourceEnum('grade_source').notNull(),
  gradeConfirmedBy: uuid('grade_confirmed_by').references(() => users.id),
  gradeConfirmedAt: timestamp('grade_confirmed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});
