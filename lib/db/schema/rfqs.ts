import {
  pgTable,
  uuid,
  text,
  timestamp,
  check,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { rfqStatusEnum } from './_enums';
import { workspaces } from './workspaces';
import { bizProfiles } from './biz-profiles';
import { users } from './users';
import { bids } from './bids';

export const rfqs = pgTable(
  'rfqs',
  {
    // Q-YYMM-NNNN — application-generated text PK.
    id: text('id').primaryKey(),
    buyerWsId: uuid('buyer_ws_id')
      .notNull()
      .references(() => workspaces.id),
    bizProfileId: uuid('biz_profile_id')
      .notNull()
      .references(() => bizProfiles.id),
    title: text('title').notNull(),
    memo: text('memo').notNull().default(''),
    allowedPgEmails: text('allowed_pg_emails')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    deadline: timestamp('deadline', { withTimezone: true }).notNull(),
    status: rfqStatusEnum('status').notNull().default('draft'),
    // Circular FK with bids.rfq_id — annotated to break TS recursion.
    awardedBidId: uuid('awarded_bid_id').references((): AnyPgColumn => bids.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (t) => [
    check(
      'awarded_consistency',
      sql`(${t.awardedBidId} IS NULL) OR (${t.status} = 'awarded')`,
    ),
  ],
);
