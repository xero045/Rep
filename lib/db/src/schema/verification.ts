import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const verificationRunsTable = pgTable("verification_runs", {
  id: serial("id").primaryKey(),
  geography: text("geography").notNull(),
  indicator: text("indicator").notNull(),
  period: text("period").notNull(),
  status: text("status").notNull(),
  agreement: real("agreement").notNull().default(0),
  recordsCompared: real("records_compared").notNull().default(0),
  sourceResults: jsonb("source_results").notNull(),
  report: text("report").notNull(),
  contentHash: text("content_hash").notNull(),
  txHash: text("tx_hash"),
  explorerUrl: text("explorer_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVerificationRunSchema = createInsertSchema(verificationRunsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertVerificationRun = z.infer<typeof insertVerificationRunSchema>;
export type VerificationRun = typeof verificationRunsTable.$inferSelect;