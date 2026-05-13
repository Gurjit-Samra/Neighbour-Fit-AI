import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analyticsEventsTable = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  guestSessionId: text("guest_session_id"),
  eventName: text("event_name").notNull(),
  eventPayload: jsonb("event_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEventsTable).omit({ id: true, createdAt: true });
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect;
