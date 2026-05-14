import OpenAI from "openai";
import { db } from "@workspace/db";
import { aiSummaryCacheTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import type { CalgaryNeighbourhood } from "./neighbourhood-data";
import type { UserWeights } from "./scoring";

const CACHE_TTL_HOURS = 24;
const PROMPT_VERSION = "lifestyle-insight-v2";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  const integrationBaseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const integrationApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const directApiKey = process.env.OPENAI_API_KEY;
  if (!integrationBaseURL && !directApiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({
      baseURL: integrationBaseURL || undefined,
      apiKey: integrationBaseURL ? (integrationApiKey ?? "replit") : directApiKey!,
    });
  }
  return openaiClient;
}

export function makeOpenAIClient(): OpenAI | null {
  const integrationBaseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const integrationApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const directApiKey = process.env.OPENAI_API_KEY;
  if (!integrationBaseURL && !directApiKey) return null;
  return new OpenAI({
    baseURL: integrationBaseURL || undefined,
    apiKey: integrationBaseURL ? (integrationApiKey ?? "replit") : directApiKey!,
  });
}

function topPriorities(weights: UserWeights): string[] {
  const labelMap: Record<string, string> = {
    affordability: "Affordability",
    walkability: "Walkability",
    transit: "Transit access",
    nightlife: "Nightlife and social scene",
    safety: "Safety",
    fitness: "Fitness and wellness",
    petFriendliness: "Pet-friendliness",
  };
  return Object.entries(weights)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => labelMap[k] ?? k);
}

function buildCacheKey(nb: CalgaryNeighbourhood, weights: UserWeights): string {
  const top3 = Object.entries(weights)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k)
    .sort()
    .join("-");
  const buckets = Object.entries(weights)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([, v]) => Math.round(v / 10) * 10)
    .join("-");
  return `${nb.index}_${top3}_${buckets}_${PROMPT_VERSION}`;
}

function buildContext(nb: CalgaryNeighbourhood, weights: UserWeights): string {
  const top = topPriorities(weights);
  const rentLabel = `~$${nb.avg1BRRent.toLocaleString()}/month`;

  const walkLabel = nb.walkability > 0.7 ? "High" : nb.walkability > 0.4 ? "Moderate" : "Low";
  const transitLabel = nb.transitAccess > 0.7 ? "High" : nb.transitAccess > 0.4 ? "Moderate" : "Low";
  const safetyLabel = nb.safetyPerception > 0.7 ? "High" : nb.safetyPerception > 0.4 ? "Moderate" : "Below average";
  const affordLabel = nb.affordabilityScore >= 4 ? "Affordable" : nb.affordabilityScore >= 3 ? "Moderate" : "Above average cost";

  const lines = [
    `Neighbourhood: ${nb.name} (${nb.zone} Calgary)`,
    `Community vibe: ${nb.communityVibe || nb.lifestyleIdentity || "Mixed"}`,
    `Best for: ${nb.bestFor || "Various lifestyle types"}`,
    ``,
    `Urban character: ${nb.suburbanOrCityLike}`,
    `Urban form: ${nb.urbanForm}`,
    `Population density: ${nb.density}`,
    ``,
    `User's strongest lifestyle priorities: ${top.join(", ")}`,
    ``,
    `Access context:`,
    `- Transit type: ${nb.transitType}`,
    `- Car dependency: ${nb.carDependency > 0.7 ? "High" : nb.carDependency > 0.4 ? "Moderate" : "Low"}`,
    `- Downtown access: ${nb.downtownAccess > 0.7 ? "Strong" : nb.downtownAccess > 0.4 ? "Moderate" : "Limited"}`,
    ``,
    `Lifestyle context:`,
    `- Walkability: ${walkLabel}`,
    `- Winter walkability: ${nb.winterWalkability > 0.6 ? "Good" : nb.winterWalkability > 0.3 ? "Moderate" : "Limited"}`,
    `- Transit access: ${transitLabel}`,
    `- Nightlife/social: ${nb.nightlife > 0.6 ? "Active" : nb.nightlife > 0.3 ? "Moderate" : "Quiet"}`,
    `- Fitness & wellness: ${nb.fitnessWellness > 0.6 ? "Good" : nb.fitnessWellness > 0.3 ? "Moderate" : "Limited"}`,
    `- Parks & green space: ${nb.parksGreenSpace > 0.6 ? "Good" : nb.parksGreenSpace > 0.3 ? "Moderate" : "Limited"}`,
    `- Safety perception: ${safetyLabel}`,
    `- Noise level: ${nb.noiseLevel > 0.6 ? "Higher" : nb.noiseLevel > 0.3 ? "Moderate" : "Quiet"}`,
    `- Affordability: ${affordLabel}`,
    `- Median rental estimate: ${rentLabel}`,
    ``,
    nb.keyTradeoffs ? `Key tradeoff noted: ${nb.keyTradeoffs}` : null,
    nb.primaryMatchingDrivers ? `Primary matching strengths: ${nb.primaryMatchingDrivers}` : null,
  ].filter(Boolean) as string[];

  return lines.join("\n");
}

function buildPrompt(nb: CalgaryNeighbourhood, weights: UserWeights): string {
  const context = buildContext(nb, weights);
  return `You are the lifestyle insight writer for NeighbourFit AI, a Calgary neighbourhood matching platform.

Write a creative, specific, lifestyle-focused insight for the neighbourhood card shown to the user.

Use two sources of context:
1. The structured neighbourhood data provided below.
2. Your own general knowledge of Calgary neighbourhoods, local lifestyle patterns, geography, amenities, and common neighbourhood character.

The insight should feel like a local friend explaining what living in this neighbourhood might actually feel like. Do not sound like a real estate listing, tourism brochure, or generic AI summary.

---

${context}

---

Instructions:
Write one polished paragraph between 90 and 130 words.

Start with the strongest lifestyle reason this neighbourhood could fit the user.

Include:
1. A vivid snapshot of daily life in the neighbourhood.
2. One or two realistic activity ideas, routines, or local experiences the user might enjoy.
3. A natural explanation of why this area fits the user's stated priorities.
4. One practical tradeoff or caution based on the provided data.

Important grounding rules:
- Prioritize the structured neighbourhood data when it conflicts with your general Calgary knowledge.
- Use your own Calgary knowledge only to enrich the response with realistic local context.
- Do not invent exact businesses, restaurants, venues, parks, schools, or landmarks unless they are provided in the data or are widely known.
- If you are not confident about a specific place, describe the type of place instead.
- Do not mention compatibility percentages, scores, recommendation tiers, numeric ratings, or internal scoring.
- Do not use alarming or stigmatizing language about crime, demographics, religion, culture, income, newcomers, or family status.
- Do not imply that a neighbourhood is only for one type of person.
- Do not give financial, legal, safety, immigration, or real estate advice.
- Do not overpromise safety, affordability, commute reliability, social life, belonging, or quality of life.
- Avoid clichés like "hidden gem," "something for everyone," "perfect fit," and "vibrant community."
- Keep the tone warm, modern, specific, honest, lifestyle-oriented, and slightly aspirational.
- End with a practical tradeoff sentence.

Output only the paragraph. No heading. No bullet points.`;
}

function buildFallback(nb: CalgaryNeighbourhood): string {
  const cityLike = nb.suburbanOrCityLike.toLowerCase();
  const density = nb.density.toLowerCase();
  const topTradeoff =
    nb.affordabilityScore <= 2
      ? "rent levels are above average for Calgary"
      : nb.transitAccess <= 0.3
      ? "car ownership is recommended for most errands"
      : nb.walkability <= 0.3
      ? "a car is helpful for day-to-day errands"
      : "parking can be limited on busy streets";
  return `${nb.name} has a ${density}-density, ${cityLike} character — ${nb.communityVibe || "a mixed community"}. ${nb.bestFor ? `Best suited to ${nb.bestFor}.` : ""} The main tradeoff to keep in mind is that ${topTradeoff}.`;
}

export async function getAiSummary(
  nb: CalgaryNeighbourhood,
  weights: UserWeights,
): Promise<{ summary: string | null; error: boolean }> {
  const cacheKey = buildCacheKey(nb, weights);
  const now = new Date();

  const [cached] = await db
    .select()
    .from(aiSummaryCacheTable)
    .where(eq(aiSummaryCacheTable.cacheKey, cacheKey))
    .limit(1);

  if (cached && cached.expiresAt > now) {
    logger.debug({ cacheKey }, "AI insight cache hit");
    return { summary: cached.summary, error: false };
  }

  const openai = getOpenAI();
  if (!openai) {
    if (cached) {
      logger.warn({ cacheKey }, "OpenAI unavailable, using expired cache");
      return { summary: cached.summary, error: false };
    }
    return { summary: buildFallback(nb), error: false };
  }

  const prompt = buildPrompt(nb, weights);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 220,
    });

    const summary = response.choices[0]?.message?.content?.trim() ?? null;
    if (!summary) {
      return { summary: buildFallback(nb), error: false };
    }

    const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000);
    if (cached) {
      await db
        .update(aiSummaryCacheTable)
        .set({ summary, expiresAt, updatedAt: now })
        .where(eq(aiSummaryCacheTable.cacheKey, cacheKey));
    } else {
      await db.insert(aiSummaryCacheTable).values({
        cacheKey,
        neighborhoodId: nb.index,
        summary,
        model: "gpt-4o-mini",
        expiresAt,
      });
    }
    return { summary, error: false };
  } catch (err) {
    logger.error({ err }, "OpenAI insight request failed");
    if (cached) {
      logger.warn({ cacheKey }, "Using expired cache as fallback");
      return { summary: cached.summary, error: false };
    }
    return { summary: buildFallback(nb), error: false };
  }
}

export async function invalidateCacheForNeighborhood(neighborhoodId: number): Promise<void> {
  await db
    .delete(aiSummaryCacheTable)
    .where(eq(aiSummaryCacheTable.neighborhoodId, neighborhoodId));
}
