import { Router } from "express";
import { db } from "@workspace/db";
import { favoritesTable, neighborhoodsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { AddFavoriteParams, RemoveFavoriteParams } from "@workspace/api-zod";
import { trackEvent } from "../lib/analytics";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/favorites", requireAuth, async (req, res): Promise<void> => {
  const favs = await db
    .select({ neighborhood: neighborhoodsTable })
    .from(favoritesTable)
    .innerJoin(neighborhoodsTable, eq(favoritesTable.neighborhoodId, neighborhoodsTable.id))
    .where(eq(favoritesTable.userId, req.session.userId!))
    .orderBy(favoritesTable.createdAt);

  res.json(favs.map((f) => ({
    id: f.neighborhood.id,
    name: f.neighborhood.name,
    slug: f.neighborhood.slug,
    city: f.neighborhood.city,
    identity: f.neighborhood.identity,
    description: f.neighborhood.description,
    affordabilityScore: f.neighborhood.affordabilityScore,
    walkabilityScore: f.neighborhood.walkabilityScore,
    transitScore: f.neighborhood.transitScore,
    nightlifeScore: f.neighborhood.nightlifeScore,
    safetyScore: f.neighborhood.safetyScore,
    fitnessScore: f.neighborhood.fitnessScore,
    petFriendlinessScore: f.neighborhood.petFriendlinessScore,
    medianRentalEstimate: f.neighborhood.medianRentalEstimate,
    downtownCommuteEstimateMins: f.neighborhood.downtownCommuteEstimateMins,
    populationDensityClass: f.neighborhood.populationDensityClass,
    lifestyleTags: f.neighborhood.lifestyleTags,
  })));
});

router.post("/favorites/:neighborhoodId", requireAuth, async (req, res): Promise<void> => {
  const params = AddFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    await db.insert(favoritesTable).values({
      userId: req.session.userId!,
      neighborhoodId: params.data.neighborhoodId,
    });
    await trackEvent("neighborhood_saved", { userId: req.session.userId });
    res.status(201).json({ success: true, message: "Saved to favorites" });
  } catch {
    res.status(409).json({ success: false, message: "Already in favorites" });
  }
});

router.delete("/favorites/:neighborhoodId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(favoritesTable).where(
    and(
      eq(favoritesTable.userId, req.session.userId!),
      eq(favoritesTable.neighborhoodId, params.data.neighborhoodId),
    )
  );
  res.json({ success: true, message: "Removed from favorites" });
});

export default router;
