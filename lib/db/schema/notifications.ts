import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { notificationChannelEnum, notificationStatusEnum } from './_enums';
import { users } from './users';
import { workspaces } from './workspaces';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    channel: notificationChannelEnum('channel').notNull(),
    status: notificationStatusEnum('status').notNull().default('queued'),
    linkUrl: text('link_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (t) => [
    index('notifications_user_created_idx').on(t.userId, sql`${t.createdAt} desc`),
  ],
);
