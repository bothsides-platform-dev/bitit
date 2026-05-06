import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { invitationStatusEnum } from './_enums';
import { rfqs } from './rfqs';
import { workspaces } from './workspaces';
import { users } from './users';

export const rfqInvitations = pgTable('rfq_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  rfqId: text('rfq_id')
    .notNull()
    .references(() => rfqs.id, { onDelete: 'cascade' }),
  pgEmail: text('pg_email').notNull(),
  pgWsId: uuid('pg_ws_id').references(() => workspaces.id),
  acceptedByUserId: uuid('accepted_by_user_id').references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().default(sql`now()`),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  status: invitationStatusEnum('status').notNull().default('pending'),
});
