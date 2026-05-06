import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { rfqs } from './rfqs';
import { bids } from './bids';
import { users } from './users';

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  rfqId: text('rfq_id')
    .notNull()
    .unique()
    .references(() => rfqs.id),
  bidId: uuid('bid_id')
    .notNull()
    .references(() => bids.id),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().default(sql`now()`),
  awardedBy: uuid('awarded_by')
    .notNull()
    .references(() => users.id),
});
