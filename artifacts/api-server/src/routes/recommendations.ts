import { Router } from "express";
import { db } from "@workspace/db";
import { recommendationSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateRecommendationBody } from "@workspace/api-zod";
import { rankNeighborhoods, normalizeWeights, DEFAULT_WEIGHTS, deriveWorkplaceQuadrant } from "../lib/scoring";
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

  const workplaceQuadrant = deriveWorkplaceQuadrant(workplaceNeighborhood);
  const ranked = rankNeighborhoods(effectiveWeights, budget, workplaceQuadrant);

  const matchesWithAi = await Promise.all(
    ranked.map(async (match) => {
      const { summary, error } = await getAiSummary(match.neighbourhood, effectiveWeights);
      return { ...match, aiSummary: summary, aiSummaryError: error };
    })
  );

  const normalizedWeights = normalizeWeights(effectiveWeights);

  const results = matchesWithAi.map((m) => {
    const nb = m.neighbourhood;
    return {
      neighborhood: {
        id: nb.index,
        name: nb.name,
        slug: nb.slug,
        city: "Calgary",
        identity: nb.communityVibe || nb.lifestyleIdentity || "",
        description: nb.bestFor || "",
        affordabilityScore: nb.affordabilityScore,
        walkabilityScore: parseFloat((nb.walkability * 5).toFixed(1)),
        transitScore: parseFloat((nb.transitAccess * 5).toFixed(1)),
        nightlifeScore: parseFloat((nb.nightlife * 5).toFixed(1)),
        safetyScore: parseFloat((nb.safetyPerception * 5).toFixed(1)),
        fitnessScore: parseFloat((nb.fitnessWellness * 5).toFixed(1)),
        petFriendlinessScore: parseFloat((nb.parksGreenSpace * 5).toFixed(1)),
        medianRentalEstimate: nb.avg1BRRent,
        downtownCommuteEstimateMins: null,
        populationDensityClass: nb.density.toLowerCase(),
        lifestyleTags: [nb.bestFor, nb.zone].filter(Boolean),
        zone: nb.zone,
        urbanForm: nb.urbanForm,
        keyTradeoffs: nb.keyTradeoffs,
        primaryMatchingDrivers: nb.primaryMatchingDrivers,
      },
      compatibilityScore: m.compatibilityScore,
      fitLabel: m.fitLabel,
      aiSummary: m.aiSummary,
      aiSummaryError: m.aiSummaryError,
      affordabilityWarning: m.affordabilityWarning,
      dimensionBreakdown: m.dimensionBreakdown.map((d) => ({
        dimension: d.label,
        score: d.score,
        weight: d.weight,
        contribution: d.contribution,
      })),
      tradeoffExplanation: m.tradeoffExplanation,
    };
  });

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
