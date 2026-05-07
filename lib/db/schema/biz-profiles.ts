import { check, pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  bizStatusEnum,
  gradeSourceEnum,
  merchantGradeEnum,
  taxTypeEnum,
} from './_enums';
import { users } from './users';

// Immutable: edits create a new row + workspace.biz_profile_id pointer update.
// bizNo·grade 모두 옵셔널 — 둘 다 NULL 인 row 는 의미 없으므로 CHECK 로 차단.
export const bizProfiles = pgTable(
  'biz_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bizNo: text('biz_no'),
    taxType: taxTypeEnum('tax_type'),
    status: bizStatusEnum('status'),
    grade: merchantGradeEnum('grade'),
    gradeSource: gradeSourceEnum('grade_source').notNull(),
    gradeConfirmedBy: uuid('grade_confirmed_by').references(() => users.id),
    gradeConfirmedAt: timestamp('grade_confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    check(
      'biz_profile_at_least_one_field',
      sql`${t.bizNo} IS NOT NULL OR ${t.grade} IS NOT NULL`,
    ),
  ],
);
