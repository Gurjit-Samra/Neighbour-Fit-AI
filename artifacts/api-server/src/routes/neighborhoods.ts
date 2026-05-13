import { Router } from "express";
import { db } from "@workspace/db";
import { neighborhoodsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function serializeNeighborhood(n: typeof neighborhoodsTable.$inferSelect) {
  return {
    id: n.id,
    name: n.name,
    slug: n.slug,
    city: n.city,
    identity: n.identity,
    description: n.description ?? null,
    affordabilityScore: n.affordabilityScore,
    walkabilityScore: n.walkabilityScore,
    transitScore: n.transitScore,
    nightlifeScore: n.nightlifeScore,
    safetyScore: n.safetyScore,
    fitnessScore: n.fitnessScore,
    petFriendlinessScore: n.petFriendlinessScore,
    medianRentalEstimate: n.medianRentalEstimate ?? null,
    downtownCommuteEstimateMins: n.downtownCommuteEstimateMins ?? null,
    populationDensityClass: n.populationDensityClass,
    lifestyleTags: n.lifestyleTags,
    lastReviewedDate: n.lastReviewedDate ?? null,
  };
}

router.get("/neighborhoods", async (req, res): Promise<void> => {
  const neighborhoods = await db.select().from(neighborhoodsTable).orderBy(neighborhoodsTable.name);
  res.json(neighborhoods.map(serializeNeighborhood));
});

router.get("/neighborhoods/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [n] = await db.select().from(neighborhoodsTable).where(eq(neighborhoodsTable.slug, slug)).limit(1);
  if (!n) {
    res.status(404).json({ error: "Neighborhood not found" });
    return;
  }
  res.json(serializeNeighborhood(n));
});

export default router;
