import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiSummaryCacheTable = pgTable("ai_summary_cache", {
  id: serial("id").primaryKey(),
  cacheKey: text("cache_key").notNull().unique(),
  neighborhoodId: integer("neighborhood_id").notNull(),
  summary: text("summary").notNull(),
  model: text("model").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAiSummaryCacheSchema = createInsertSchema(aiSummaryCacheTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAiSummaryCache = z.infer<typeof insertAiSummaryCacheSchema>;
export type AiSummaryCache = typeof aiSummaryCacheTable.$inferSelect;
