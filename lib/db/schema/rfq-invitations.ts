import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { invitationSourceEnum, invitationStatusEnum } from './_enums';
import { rfqs } from './rfqs';
import { workspaces } from './workspaces';
import { users } from './users';

export const rfqInvitations = pgTable(
  'rfq_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rfqId: text('rfq_id')
      .notNull()
      .references(() => rfqs.id, { onDelete: 'cascade' }),
    pgWsId: uuid('pg_ws_id')
      .notNull()
      .references(() => workspaces.id),
    acceptedByUserId: uuid('accepted_by_user_id').references(() => users.id),
    tokenHash: text('token_hash').notNull().unique(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().default(sql`now()`),
    openedAt: timestamp('opened_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    source: invitationSourceEnum('source').notNull().default('request'),
    status: invitationStatusEnum('status').notNull().default('pending'),
  },
  (t) => [
    // 같은 RFQ에 같은 PG 워크스페이스를 두 번 추가하지 못하도록 차단.
    uniqueIndex('rfq_invitations_rfq_ws_uniq').on(t.rfqId, t.pgWsId),
  ],
);
