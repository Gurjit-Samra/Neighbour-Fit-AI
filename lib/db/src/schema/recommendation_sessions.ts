import { pgTable, serial, integer, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recommendationSessionsTable = pgTable("recommendation_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  guestSessionId: text("guest_session_id"),
  inputWeights: jsonb("input_weights").notNull(),
  normalizedWeights: jsonb("normalized_weights").notNull(),
  budget: integer("budget").notNull(),
  workplaceNeighborhood: text("workplace_neighborhood"),
  usedDefaultWeights: boolean("used_default_weights").notNull().default(false),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecommendationSessionSchema = createInsertSchema(recommendationSessionsTable).omit({ id: true, createdAt: true });
export type InsertRecommendationSession = z.infer<typeof insertRecommendationSessionSchema>;
export type RecommendationSession = typeof recommendationSessionsTable.$inferSelect;
