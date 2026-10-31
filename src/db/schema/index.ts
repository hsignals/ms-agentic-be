// Application-owned tables; Mastra initializes its own native storage separately.

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { RunResult } from '../../runtime/types';

/** Durable application outcome, scoped to the verified account and originating channel. */
export const runs = pgTable('analysis_runs', {
  id: uuid('id').primaryKey(),
  accountId: varchar('account_id', { length: 200 }).notNull(),
  channelId: varchar('channel_id', { length: 200 }).notNull(),
  mode: varchar('mode', { length: 20, enum: ['foreground', 'background'] }).notNull(),
  status: varchar('status', { length: 20, enum: ['queued', 'running', 'completed', 'failed'] }).notNull(),
  result: jsonb('result').$type<RunResult>(),
  errorCode: varchar('error_code', { length: 80 }),
  deploymentId: varchar('deployment_id', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('analysis_runs_scope_idx').on(table.accountId, table.channelId),
  check('analysis_runs_mode_check', sql`${table.mode} IN ('foreground', 'background')`),
  check('analysis_runs_status_check', sql`${table.status} IN ('queued', 'running', 'completed', 'failed')`),
]);

/** Retention metadata; object references remain private and never authorize access. */
export const retainedFiles = pgTable('retained_files', {
  id: uuid('id').primaryKey(),
  accountId: varchar('account_id', { length: 200 }).notNull(),
  channelId: varchar('channel_id', { length: 200 }).notNull(),
  runId: uuid('run_id').notNull().references(() => runs.id),
  dataType: text('data_type').notNull(),
  access: varchar('access', { length: 30, enum: ['accountEvidence', 'channelPrivate'] }).notNull(),
  provider: text('provider'),
  connectionId: text('connection_id'),
  savedAt: timestamp('saved_at', { withTimezone: true }).notNull(),
  retrievedAt: timestamp('retrieved_at', { withTimezone: true }),
  sourceAsOf: timestamp('source_as_of', { withTimezone: true }),
  sizeBytes: integer('size_bytes').notNull(),
  storageReference: text('storage_reference').notNull(),
  name: text('name').notNull(),
  contentType: text('content_type').notNull(),
}, table => [
  index('retained_files_scope_idx').on(table.accountId, table.channelId),
  check('retained_files_access_check', sql`${table.access} IN ('accountEvidence', 'channelPrivate')`),
  check('retained_files_size_check', sql`${table.sizeBytes} >= 0`),
]);
