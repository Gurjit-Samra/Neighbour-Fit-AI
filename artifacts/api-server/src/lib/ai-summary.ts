import OpenAI from "openai";
import { db } from "@workspace/db";
import { aiSummaryCacheTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import type { Neighborhood } from "@workspace/db";
import type { UserWeights } from "./scoring";

const CACHE_TTL_HOURS = 24;
const PROMPT_VERSION = "lifestyle-insight-v1";

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

function scoreLabel(score: number): string {
  if (score >= 5) return "Very high";
  if (score >= 4) return "High";
  if (score >= 3) return "Moderate";
  if (score >= 2) return "Low";
  return "Very low";
}

function affordabilityBand(score: number): string {
  if (score >= 5) return "Very affordable";
  if (score >= 4) return "Affordable";
  if (score >= 3) return "Moderate";
  if (score >= 2) return "Above average cost";
  return "Premium / expensive";
}

function densityLabel(density: string): string {
  const map: Record<string, string> = {
    high: "High",
    "medium-high": "Medium-high",
    medium: "Medium",
    "medium-low": "Medium-low",
    low: "Low",
    mixed: "Mixed",
  };
  return map[density] ?? density;
}

function suburbanOrCityLike(walkability: number, transit: number): string {
  const avg = (walkability + transit) / 2;
  if (avg >= 4) return "City-like";
  if (avg >= 3) return "Mixed (city and suburban elements)";
  return "Suburban";
}

function transitType(transit: number, walkability: number): string {
  if (transit >= 4 && walkability >= 4) return "CTrain and frequent bus routes";
  if (transit >= 4) return "CTrain and bus";
  if (transit >= 3) return "Bus routes, some CTrain access";
  return "Limited transit, car recommended";
}

function carDependency(walkability: number, transit: number): string {
  const avg = (walkability + transit) / 2;
  if (avg >= 4.5) return "Very low";
  if (avg >= 3.5) return "Low to moderate";
  if (avg >= 2.5) return "Moderate";
  return "High";
}

function downtownAccess(commuteMins: number | null | undefined): string {
  if (!commuteMins) return "Unknown";
  if (commuteMins <= 10) return "Very strong (under 10 minutes)";
  if (commuteMins <= 20) return "Strong (10–20 minutes)";
  if (commuteMins <= 30) return "Moderate (20–30 minutes)";
  return "Longer commute required";
}

function topPrioritiesForPrompt(weights: UserWeights): string[] {
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
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => labelMap[k] ?? k);
}

function buildCacheKey(neighborhoodId: number, weights: UserWeights): string {
  const top3 = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k)
    .sort()
    .join("-");

  const buckets = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([, v]) => Math.round(v / 10) * 10)
    .join("-");

  return `${neighborhoodId}_${top3}_${buckets}_${PROMPT_VERSION}`;
}

function buildInsightContext(
  neighborhood: Neighborhood,
  weights: UserWeights
): string {
  const top = topPrioritiesForPrompt(weights);

  const lines = [
    `Neighbourhood: ${neighborhood.name}`,
    `Lifestyle identity: ${neighborhood.identity}`,
    ``,
    `Suburban or city-like: ${suburbanOrCityLike(neighborhood.walkabilityScore, neighborhood.transitScore)}`,
    `Density: ${densityLabel(neighborhood.populationDensityClass)}`,
    `Lifestyle tags / best for: ${neighborhood.lifestyleTags?.join(", ") || "Not specified"}`,
    ``,
    `User's strongest lifestyle priorities: ${top.join(", ")}`,
    ``,
    `Access context:`,
    `- Downtown access: ${downtownAccess(neighborhood.downtownCommuteEstimateMins)}`,
    `- Transit type: ${transitType(neighborhood.transitScore, neighborhood.walkabilityScore)}`,
    `- Car dependency level: ${carDependency(neighborhood.walkabilityScore, neighborhood.transitScore)}`,
    ``,
    `Lifestyle context:`,
    `- Walkability: ${scoreLabel(neighborhood.walkabilityScore)}`,
    `- Parks / green space: ${scoreLabel(neighborhood.fitnessScore)}`,
    `- Nightlife / social: ${scoreLabel(neighborhood.nightlifeScore)}`,
    `- Fitness and wellness: ${scoreLabel(neighborhood.fitnessScore)}`,
    `- Pet-friendliness: ${scoreLabel(neighborhood.petFriendlinessScore)}`,
    `- Safety perception: ${scoreLabel(neighborhood.safetyScore)}`,
    `- Affordability band: ${affordabilityBand(neighborhood.affordabilityScore)}`,
    neighborhood.medianRentalEstimate
      ? `- Median rental estimate: ~$${neighborhood.medianRentalEstimate.toLocaleString()}/month`
      : null,
    ``,
    `Score notes (use as supporting context only):`,
    neighborhood.walkabilityScoreNote ? `- Walkability: ${neighborhood.walkabilityScoreNote}` : null,
    neighborhood.transitScoreNote ? `- Transit: ${neighborhood.transitScoreNote}` : null,
    neighborhood.nightlifeScoreNote ? `- Nightlife: ${neighborhood.nightlifeScoreNote}` : null,
    neighborhood.safetyScoreNote ? `- Safety: ${neighborhood.safetyScoreNote}` : null,
    neighborhood.fitnessScoreNote ? `- Fitness: ${neighborhood.fitnessScoreNote}` : null,
    neighborhood.petFriendlinessScoreNote ? `- Pet-friendliness: ${neighborhood.petFriendlinessScoreNote}` : null,
    neighborhood.affordabilityScoreNote ? `- Affordability: ${neighborhood.affordabilityScoreNote}` : null,
    neighborhood.description ? `\nNeighbourhood description:\n${neighborhood.description}` : null,
  ].filter(Boolean) as string[];

  return lines.join("\n");
}

function buildPrompt(neighborhood: Neighborhood, weights: UserWeights): string {
  const context = buildInsightContext(neighborhood, weights);

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
- Do not invent exact businesses, restaurants, venues, parks, schools, churches, mosques, temples, gurdwaras, or landmarks unless they are provided in the data or are widely known.
- If you are not confident about a specific place, describe the type of place instead.
- Do not mention compatibility percentages, scores, recommendation tiers, numeric ratings, or internal scoring.
- Do not mention data confidence, MVP scores, or needs validation.
- Do not use alarming or stigmatizing language about crime, demographics, religion, culture, income, newcomers, or family status.
- Do not imply that a neighbourhood is only for one type of person.
- Do not give financial, legal, safety, immigration, or real estate advice.
- Do not overpromise safety, affordability, commute reliability, social life, belonging, or quality of life.
- Avoid clichés like "hidden gem," "something for everyone," "perfect fit," and "vibrant community."
- Keep the tone warm, modern, specific, honest, lifestyle-oriented, and slightly aspirational.
- End with a practical tradeoff sentence.

Output only the paragraph. No heading. No bullet points.`;
}

function buildFallbackText(neighborhood: Neighborhood): string {
  const tags = neighborhood.lifestyleTags?.slice(0, 3).join(", ") || "various lifestyle types";
  const density = densityLabel(neighborhood.populationDensityClass).toLowerCase();
  const cityLike = suburbanOrCityLike(neighborhood.walkabilityScore, neighborhood.transitScore).toLowerCase();
  const topTradeoff =
    neighborhood.affordabilityScore <= 2
      ? "rent levels are above average for Calgary"
      : neighborhood.transitScore <= 2
      ? "car ownership is recommended for most errands"
      : neighborhood.walkabilityScore <= 2
      ? "a car is helpful for day-to-day errands"
      : "parking can be limited on busy streets";

  return `${neighborhood.name} has a ${density}-density, ${cityLike} character that may appeal to ${tags}. ${neighborhood.identity} The main tradeoff to keep in mind is that ${topTradeoff}.`;
}

export async function getAiSummary(
  neighborhood: Neighborhood,
  weights: UserWeights
): Promise<{ summary: string | null; error: boolean }> {
  const cacheKey = buildCacheKey(neighborhood.id, weights);
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
    const fallback = buildFallbackText(neighborhood);
    return { summary: fallback, error: false };
  }

  const prompt = buildPrompt(neighborhood, weights);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 220,
    });

    const summary = response.choices[0]?.message?.content?.trim() ?? null;
    if (!summary) {
      const fallback = buildFallbackText(neighborhood);
      return { summary: fallback, error: false };
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
        neighborhoodId: neighborhood.id,
        summary,
        model: "gpt-5.4",
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
    const fallback = buildFallbackText(neighborhood);
    return { summary: fallback, error: false };
  }
}

export async function invalidateCacheForNeighborhood(neighborhoodId: number): Promise<void> {
  await db
    .delete(aiSummaryCacheTable)
    .where(eq(aiSummaryCacheTable.neighborhoodId, neighborhoodId));
}
