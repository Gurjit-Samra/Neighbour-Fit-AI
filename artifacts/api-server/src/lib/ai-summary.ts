import OpenAI from "openai";
import { db } from "@workspace/db";
import { aiSummaryCacheTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { logger } from "./logger";
import type { Neighborhood } from "@workspace/db";
import type { UserWeights } from "./scoring";

const CACHE_TTL_HOURS = 24;

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

function buildCacheKey(
  neighborhoodId: number,
  weights: UserWeights
): string {
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

  return `${neighborhoodId}_${top3}_${buckets}`;
}

export async function getAiSummary(
  neighborhood: Neighborhood,
  weights: UserWeights
): Promise<{ summary: string | null; error: boolean }> {
  const cacheKey = buildCacheKey(neighborhood.id, weights);
  const now = new Date();

  // Check cache
  const [cached] = await db
    .select()
    .from(aiSummaryCacheTable)
    .where(eq(aiSummaryCacheTable.cacheKey, cacheKey))
    .limit(1);

  if (cached && cached.expiresAt > now) {
    logger.debug({ cacheKey }, "AI summary cache hit");
    return { summary: cached.summary, error: false };
  }

  const openai = getOpenAI();
  if (!openai) {
    if (cached) {
      logger.warn({ cacheKey }, "OpenAI unavailable, using expired cache");
      return { summary: cached.summary, error: false };
    }
    return { summary: null, error: true };
  }

  const topPriorities = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k)
    .join(", ");

  const scores = `Affordability: ${neighborhood.affordabilityScore}/5, Walkability: ${neighborhood.walkabilityScore}/5, Transit: ${neighborhood.transitScore}/5, Nightlife: ${neighborhood.nightlifeScore}/5, Safety: ${neighborhood.safetyScore}/5, Fitness: ${neighborhood.fitnessScore}/5, Pet-friendliness: ${neighborhood.petFriendlinessScore}/5`;

  const prompt = `Generate a concise neighborhood lifestyle summary for ${neighborhood.name}, Calgary, for a user prioritizing ${topPriorities}. Neighborhood scores: ${scores}. Explain strengths and tradeoffs in under 120 words. Begin with the strongest fit reason. Do not provide financial, legal, or real estate advice. Base the summary only on the provided structured data.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 180,
    });

    const summary = response.choices[0]?.message?.content?.trim() ?? null;
    if (!summary) return { summary: null, error: true };

    const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000);

    // Upsert cache
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
        model: "gpt-4o-mini",
        expiresAt,
      });
    }

    return { summary, error: false };
  } catch (err) {
    logger.error({ err }, "OpenAI request failed");
    if (cached) {
      logger.warn({ cacheKey }, "Using expired cache as fallback");
      return { summary: cached.summary, error: false };
    }
    return { summary: null, error: true };
  }
}

export async function invalidateCacheForNeighborhood(neighborhoodId: number): Promise<void> {
  await db
    .delete(aiSummaryCacheTable)
    .where(eq(aiSummaryCacheTable.neighborhoodId, neighborhoodId));
}
