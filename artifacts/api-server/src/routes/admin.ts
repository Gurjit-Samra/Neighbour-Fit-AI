import { Router } from "express";
import { db } from "@workspace/db";
import { neighborhoodsTable, analyticsEventsTable, usersTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { AdminUpdateNeighborhoodParams, AdminUpdateNeighborhoodBody, AdminInvalidateCacheParams } from "@workspace/api-zod";
import { invalidateCacheForNeighborhood } from "../lib/ai-summary";
import { trackEvent } from "../lib/analytics";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.use(requireAdmin);

function serializeNeighborhoodAdmin(n: typeof neighborhoodsTable.$inferSelect) {
  return {
    id: n.id, name: n.name, slug: n.slug, city: n.city,
    identity: n.identity, description: n.description,
    affordabilityScore: n.affordabilityScore,
    walkabilityScore: n.walkabilityScore,
    transitScore: n.transitScore,
    nightlifeScore: n.nightlifeScore,
    safetyScore: n.safetyScore,
    fitnessScore: n.fitnessScore,
    petFriendlinessScore: n.petFriendlinessScore,
    affordabilityScoreNote: n.affordabilityScoreNote,
    walkabilityScoreNote: n.walkabilityScoreNote,
    transitScoreNote: n.transitScoreNote,
    nightlifeScoreNote: n.nightlifeScoreNote,
    safetyScoreNote: n.safetyScoreNote,
    fitnessScoreNote: n.fitnessScoreNote,
    petFriendlinessScoreNote: n.petFriendlinessScoreNote,
    medianRentalEstimate: n.medianRentalEstimate,
    downtownCommuteEstimateMins: n.downtownCommuteEstimateMins,
    populationDensityClass: n.populationDensityClass,
    lifestyleTags: n.lifestyleTags,
    lastReviewedDate: n.lastReviewedDate,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

router.get("/admin/neighborhoods", async (req, res): Promise<void> => {
  const neighborhoods = await db.select().from(neighborhoodsTable).orderBy(neighborhoodsTable.name);
  res.json(neighborhoods.map(serializeNeighborhoodAdmin));
});

router.patch("/admin/neighborhoods/:id", async (req, res): Promise<void> => {
  const params = AdminUpdateNeighborhoodParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdateNeighborhoodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof neighborhoodsTable.$inferInsert> = {};
  const d = parsed.data;
  if (d.name != null) updateData.name = d.name;
  if (d.identity != null) updateData.identity = d.identity;
  if (d.description != null) updateData.description = d.description;
  if (d.affordabilityScore != null) updateData.affordabilityScore = d.affordabilityScore;
  if (d.walkabilityScore != null) updateData.walkabilityScore = d.walkabilityScore;
  if (d.transitScore != null) updateData.transitScore = d.transitScore;
  if (d.nightlifeScore != null) updateData.nightlifeScore = d.nightlifeScore;
  if (d.safetyScore != null) updateData.safetyScore = d.safetyScore;
  if (d.fitnessScore != null) updateData.fitnessScore = d.fitnessScore;
  if (d.petFriendlinessScore != null) updateData.petFriendlinessScore = d.petFriendlinessScore;
  if (d.affordabilityScoreNote != null) updateData.affordabilityScoreNote = d.affordabilityScoreNote;
  if (d.walkabilityScoreNote != null) updateData.walkabilityScoreNote = d.walkabilityScoreNote;
  if (d.transitScoreNote != null) updateData.transitScoreNote = d.transitScoreNote;
  if (d.nightlifeScoreNote != null) updateData.nightlifeScoreNote = d.nightlifeScoreNote;
  if (d.safetyScoreNote != null) updateData.safetyScoreNote = d.safetyScoreNote;
  if (d.fitnessScoreNote != null) updateData.fitnessScoreNote = d.fitnessScoreNote;
  if (d.petFriendlinessScoreNote != null) updateData.petFriendlinessScoreNote = d.petFriendlinessScoreNote;
  if (d.medianRentalEstimate != null) updateData.medianRentalEstimate = d.medianRentalEstimate;
  if (d.downtownCommuteEstimateMins != null) updateData.downtownCommuteEstimateMins = d.downtownCommuteEstimateMins;
  if (d.populationDensityClass != null) updateData.populationDensityClass = d.populationDensityClass;
  if (d.lifestyleTags != null) updateData.lifestyleTags = d.lifestyleTags;

  const [updated] = await db
    .update(neighborhoodsTable)
    .set(updateData)
    .where(eq(neighborhoodsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Neighborhood not found" });
    return;
  }

  await trackEvent("admin_neighborhood_updated", { userId: req.session?.userId, neighborhoodId: params.data.id });
  res.json(serializeNeighborhoodAdmin(updated));
});

router.post("/admin/neighborhoods/:id/invalidate-cache", async (req, res): Promise<void> => {
  const params = AdminInvalidateCacheParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await invalidateCacheForNeighborhood(params.data.id);
  res.json({ success: true, message: "AI summary cache invalidated" });
});

router.get("/admin/analytics", async (req, res): Promise<void> => {
  const eventCounts = await db
    .select({ eventName: analyticsEventsTable.eventName, count: count() })
    .from(analyticsEventsTable)
    .groupBy(analyticsEventsTable.eventName);

  const countMap: Record<string, number> = {};
  for (const row of eventCounts) {
    countMap[row.eventName] = row.count;
  }

  const [userCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "user"));

  res.json({
    questionnaireStarts: countMap["questionnaire_started"] ?? 0,
    questionnaireCompletions: countMap["questionnaire_completed"] ?? 0,
    recommendationSessions: countMap["recommendations_generated"] ?? 0,
    favoriteSaves: countMap["neighborhood_saved"] ?? 0,
    registeredUsers: userCount?.count ?? 0,
    guestSessions: countMap["questionnaire_started"] ?? 0,
    adminNeighborhoodUpdates: countMap["admin_neighborhood_updated"] ?? 0,
    aiSummariesGenerated: countMap["ai_summary_generated"] ?? 0,
    aiCacheHits: countMap["ai_summary_cache_hit"] ?? 0,
    aiCacheMisses: countMap["ai_summary_cache_miss"] ?? 0,
  });
});

export default router;
