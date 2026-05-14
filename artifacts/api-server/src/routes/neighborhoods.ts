import { Router } from "express";
import { db } from "@workspace/db";
import { neighborhoodsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { makeOpenAIClient, getAiSummary } from "../lib/ai-summary";
import { NEIGHBOURHOODS } from "../lib/neighbourhood-data";
import { DEFAULT_WEIGHTS } from "../lib/scoring";

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

  const csvNeighbourhood = NEIGHBOURHOODS.find((nb) => nb.slug === n.slug);
  let aiSummary: string | null = null;
  let aiSummaryError = false;

  if (csvNeighbourhood) {
    const result = await getAiSummary(csvNeighbourhood, DEFAULT_WEIGHTS);
    aiSummary = result.summary;
    aiSummaryError = result.error;
  }

  res.json({ ...serializeNeighborhood(n), aiSummary, aiSummaryError });
});

router.post("/neighborhoods/compare-summary", async (req, res): Promise<void> => {
  const { slugs } = req.body as { slugs?: string[] };
  if (!Array.isArray(slugs) || slugs.length < 2 || slugs.length > 3) {
    res.status(400).json({ error: "slugs must be an array of 2-3 neighbourhood slugs" });
    return;
  }

  const openai = makeOpenAIClient();
  if (!openai) {
    res.status(503).json({ error: "AI service unavailable" });
    return;
  }

  const records = await Promise.all(
    slugs.map((slug) =>
      db.select().from(neighborhoodsTable).where(eq(neighborhoodsTable.slug, slug)).limit(1).then(([r]) => r)
    )
  );
  const found = records.filter(Boolean);
  if (found.length < 2) {
    res.status(400).json({ error: "Could not find enough valid neighbourhoods" });
    return;
  }

  const nhSummaries = found.map((n) =>
    `${n.name}: Affordability ${n.affordabilityScore}/5, Walkability ${n.walkabilityScore}/5, Transit ${n.transitScore}/5, Nightlife ${n.nightlifeScore}/5, Safety ${n.safetyScore}/5, Fitness ${n.fitnessScore}/5, Pets ${n.petFriendlinessScore}/5. Rent ~$${n.medianRentalEstimate ?? "?"}/mo. Commute ~${n.downtownCommuteEstimateMins ?? "?"}min. Tags: ${n.lifestyleTags?.join(", ") || "none"}. ${n.identity ?? ""}`
  ).join("\n");

  const prompt = `You are a Calgary neighbourhood expert. Compare the following ${found.length} neighbourhoods objectively and concisely in 150–200 words. Highlight the key differences, what each suits best, and give a balanced recommendation for who should choose each one. Use British spelling (neighbourhood). Do not repeat the raw scores — synthesise insights instead.\n\n${nhSummaries}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 280,
    });
    const overview = response.choices[0]?.message?.content?.trim() ?? "";
    res.json({ overview });
  } catch (err) {
    req.log.error({ err }, "AI compare-summary failed");
    res.status(503).json({ error: "AI service unavailable" });
  }
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
