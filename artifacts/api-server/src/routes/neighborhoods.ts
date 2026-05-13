import { Router } from "express";
import { db } from "@workspace/db";
import { neighborhoodsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { makeOpenAIClient } from "../lib/ai-summary";

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

router.post("/neighborhoods/:slug/ask", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [n] = await db.select().from(neighborhoodsTable).where(eq(neighborhoodsTable.slug, slug)).limit(1);
  if (!n) {
    res.status(404).json({ error: "Neighborhood not found" });
    return;
  }

  const { question, compatibilityScore, topPriorities } = req.body as {
    question?: string;
    compatibilityScore?: number;
    topPriorities?: string[];
  };

  if (!question?.trim()) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  const openai = makeOpenAIClient();
  if (!openai) {
    res.status(503).json({ error: "AI service unavailable" });
    return;
  }

  const scores = `Affordability ${n.affordabilityScore}/5, Walkability ${n.walkabilityScore}/5, Transit ${n.transitScore}/5, Nightlife ${n.nightlifeScore}/5, Safety ${n.safetyScore}/5, Fitness ${n.fitnessScore}/5, Pet-friendliness ${n.petFriendlinessScore}/5`;
  const rentInfo = n.medianRentalEstimate ? `, median 1BR rent ~$${n.medianRentalEstimate}/mo` : "";
  const commuteInfo = n.downtownCommuteEstimateMins ? `, ~${n.downtownCommuteEstimateMins} min downtown commute` : "";
  const priorityInfo = topPriorities?.length ? `\nUser's top priorities: ${topPriorities.join(", ")}.` : "";
  const scoreInfo = compatibilityScore != null ? `\nThis neighbourhood scored ${compatibilityScore}% lifestyle compatibility with this user.` : "";

  const systemPrompt = `You are a knowledgeable Calgary neighbourhood guide. Answer questions about ${n.name} concisely and helpfully, based on the data provided. Do not provide financial or legal advice. Keep responses under 150 words. Use British spelling (neighbourhood, not neighborhood).`;

  const userPrompt = `Neighbourhood: ${n.name}, Calgary (${n.identity ?? n.populationDensityClass})
Scores: ${scores}${rentInfo}${commuteInfo}
Tags: ${n.lifestyleTags?.join(", ") || "none"}${priorityInfo}${scoreInfo}
Description: ${n.description ?? ""}

User question: ${question.trim()}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 220,
    });

    const answer = response.choices[0]?.message?.content?.trim() ?? "";
    res.json({ answer });
  } catch (err) {
    req.log.error({ err }, "AI ask failed");
    res.status(503).json({ error: "AI service unavailable" });
  }
});

export default router;
