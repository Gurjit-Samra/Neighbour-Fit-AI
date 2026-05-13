import { Router } from "express";
import { db } from "@workspace/db";
import { neighborhoodsTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { CompareNeighborhoodsBody } from "@workspace/api-zod";
import { trackEvent } from "../lib/analytics";

const router = Router();

router.post("/compare", async (req, res): Promise<void> => {
  const parsed = CompareNeighborhoodsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { slugs } = parsed.data;

  const neighborhoods = await db
    .select()
    .from(neighborhoodsTable)
    .where(inArray(neighborhoodsTable.slug, slugs));

  if (neighborhoods.length === 0) {
    res.status(400).json({ error: "No valid neighborhoods found" });
    return;
  }

  await trackEvent("comparison_started", { userId: req.session?.userId ?? null, slugs });

  const result = neighborhoods.map((n) => {
    const scores = [
      { key: "affordability", label: "Affordability", score: n.affordabilityScore },
      { key: "walkability", label: "Walkability", score: n.walkabilityScore },
      { key: "transit", label: "Transit", score: n.transitScore },
      { key: "nightlife", label: "Nightlife", score: n.nightlifeScore },
      { key: "safety", label: "Safety", score: n.safetyScore },
      { key: "fitness", label: "Fitness", score: n.fitnessScore },
      { key: "petFriendliness", label: "Pet-Friendliness", score: n.petFriendlinessScore },
    ];

    const strengths = scores.filter((s) => s.score >= 4).map((s) => `${s.label} (${s.score}/5)`);
    const tradeoffs = scores.filter((s) => s.score <= 2).map((s) => `${s.label} (${s.score}/5)`);

    return {
      neighborhood: {
        id: n.id, name: n.name, slug: n.slug, city: n.city,
        identity: n.identity, description: n.description,
        affordabilityScore: n.affordabilityScore,
        walkabilityScore: n.walkabilityScore,
        transitScore: n.transitScore,
        nightlifeScore: n.nightlifeScore,
        safetyScore: n.safetyScore,
        fitnessScore: n.fitnessScore,
        petFriendlinessScore: n.petFriendlinessScore,
        medianRentalEstimate: n.medianRentalEstimate,
        downtownCommuteEstimateMins: n.downtownCommuteEstimateMins,
        populationDensityClass: n.populationDensityClass,
        lifestyleTags: n.lifestyleTags,
        lastReviewedDate: n.lastReviewedDate,
      },
      strengths: strengths.length > 0 ? strengths : ["Balanced across all dimensions"],
      tradeoffs: tradeoffs.length > 0 ? tradeoffs : ["No major weaknesses"],
    };
  });

  res.json(result);
});

export default router;
