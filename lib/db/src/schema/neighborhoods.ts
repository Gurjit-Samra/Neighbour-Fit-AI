import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const neighborhoodsTable = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  city: text("city").notNull().default("Calgary"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  identity: text("identity").notNull(),
  description: text("description"),
  affordabilityScore: integer("affordability_score").notNull(),
  walkabilityScore: integer("walkability_score").notNull(),
  transitScore: integer("transit_score").notNull(),
  nightlifeScore: integer("nightlife_score").notNull(),
  safetyScore: integer("safety_score").notNull(),
  fitnessScore: integer("fitness_score").notNull(),
  petFriendlinessScore: integer("pet_friendliness_score").notNull(),
  affordabilityScoreNote: text("affordability_score_note"),
  walkabilityScoreNote: text("walkability_score_note"),
  transitScoreNote: text("transit_score_note"),
  nightlifeScoreNote: text("nightlife_score_note"),
  safetyScoreNote: text("safety_score_note"),
  fitnessScoreNote: text("fitness_score_note"),
  petFriendlinessScoreNote: text("pet_friendliness_score_note"),
  medianRentalEstimate: integer("median_rental_estimate"),
  downtownCommuteEstimateMins: integer("downtown_commute_estimate_mins"),
  populationDensityClass: text("population_density_class").notNull().default("mixed"),
  lifestyleTags: text("lifestyle_tags").array().notNull().default([]),
  lastReviewedDate: text("last_reviewed_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNeighborhoodSchema = createInsertSchema(neighborhoodsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;
export type Neighborhood = typeof neighborhoodsTable.$inferSelect;
