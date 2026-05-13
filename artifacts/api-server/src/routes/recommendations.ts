import { Router } from "express";
import { db } from "@workspace/db";
import { neighborhoodsTable, recommendationSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateRecommendationBody } from "@workspace/api-zod";
import { rankNeighborhoods, normalizeWeights, DEFAULT_WEIGHTS } from "../lib/scoring";
import { getAiSummary } from "../lib/ai-summary";
import { trackEvent } from "../lib/analytics";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/recommendations", async (req, res): Promise<void> => {
  const parsed = CreateRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { budget, weights, workplaceNeighborhood, usedDefaultWeights } = parsed.data;

  const effectiveWeights = usedDefaultWeights ? DEFAULT_WEIGHTS : {
    affordability: weights.affordability,
    walkability: weights.walkability,
    transit: weights.transit,
    nightlife: weights.nightlife,
    safety: weights.safety,
    fitness: weights.fitness,
    petFriendliness: weights.petFriendliness,
  };

  await trackEvent("questionnaire_completed", {
    userId: req.session?.userId ?? null,
  });

  const neighborhoods = await db.select().from(neighborhoodsTable).orderBy(neighborhoodsTable.name);
  const ranked = rankNeighborhoods(neighborhoods, effectiveWeights, budget);

  // Generate AI summaries in parallel
  const matchesWithAi = await Promise.all(
    ranked.map(async (match) => {
      const { summary, error } = await getAiSummary(match.neighborhood, effectiveWeights);
      return { ...match, aiSummary: summary, aiSummaryError: error };
    })
  );

  const normalizedWeights = normalizeWeights(effectiveWeights);

  // Serialize results
  const results = matchesWithAi.map((m) => ({
    neighborhood: {
      id: m.neighborhood.id, name: m.neighborhood.name, slug: m.neighborhood.slug,
      city: m.neighborhood.city, identity: m.neighborhood.identity,
      description: m.neighborhood.description,
      affordabilityScore: m.neighborhood.affordabilityScore,
      walkabilityScore: m.neighborhood.walkabilityScore,
      transitScore: m.neighborhood.transitScore,
      nightlifeScore: m.neighborhood.nightlifeScore,
      safetyScore: m.neighborhood.safetyScore,
      fitnessScore: m.neighborhood.fitnessScore,
      petFriendlinessScore: m.neighborhood.petFriendlinessScore,
      medianRentalEstimate: m.neighborhood.medianRentalEstimate,
      downtownCommuteEstimateMins: m.neighborhood.downtownCommuteEstimateMins,
      populationDensityClass: m.neighborhood.populationDensityClass,
      lifestyleTags: m.neighborhood.lifestyleTags,
    },
    compatibilityScore: m.compatibilityScore,
    fitLabel: m.fitLabel,
    aiSummary: m.aiSummary,
    aiSummaryError: m.aiSummaryError,
    affordabilityWarning: m.affordabilityWarning,
    dimensionBreakdown: m.dimensionBreakdown,
    tradeoffExplanation: m.tradeoffExplanation,
  }));

  // Save session if authenticated
  let sessionId: number | null = null;
  if (req.session?.userId) {
    const [saved] = await db.insert(recommendationSessionsTable).values({
      userId: req.session.userId,
      inputWeights: weights,
      normalizedWeights: normalizedWeights,
      budget,
      workplaceNeighborhood: workplaceNeighborhood ?? null,
      usedDefaultWeights: usedDefaultWeights ?? false,
      results,
    }).returning();
    sessionId = saved.id;
  }

  await trackEvent("recommendations_generated", { userId: req.session?.userId ?? null, count: results.length });

  res.json({
    sessionId,
    matches: results,
    usedDefaultWeights: usedDefaultWeights ?? false,
    createdAt: new Date().toISOString(),
  });
});

router.get("/recommendations/history", requireAuth, async (req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(recommendationSessionsTable)
    .where(eq(recommendationSessionsTable.userId, req.session.userId!))
    .orderBy(recommendationSessionsTable.createdAt);

  const history = sessions.map((s) => {
    const results = s.results as Array<{ compatibilityScore: number }>;
    return {
      id: s.id,
      budget: s.budget,
      usedDefaultWeights: s.usedDefaultWeights,
      resultsCount: results.length,
      createdAt: s.createdAt.toISOString(),
    };
  });

  res.json(history);
});

router.get("/recommendations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [session] = await db.select().from(recommendationSessionsTable).where(eq(recommendationSessionsTable.id, id)).limit(1);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json({
    sessionId: session.id,
    matches: session.results,
    usedDefaultWeights: session.usedDefaultWeights,
    createdAt: session.createdAt.toISOString(),
  });
});

export default router;
