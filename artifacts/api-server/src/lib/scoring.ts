import type { Neighborhood } from "@workspace/db";

export interface UserWeights {
  affordability: number;
  walkability: number;
  transit: number;
  nightlife: number;
  safety: number;
  fitness: number;
  petFriendliness: number;
}

export interface DimensionBreakdown {
  dimension: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface NeighborhoodMatch {
  neighborhood: Neighborhood;
  compatibilityScore: number;
  fitLabel: string;
  dimensionBreakdown: DimensionBreakdown[];
  tradeoffExplanation: string;
  affordabilityWarning: boolean;
  aiSummary: string | null;
  aiSummaryError: boolean;
}

export const DEFAULT_WEIGHTS: UserWeights = {
  affordability: 20,
  walkability: 20,
  transit: 15,
  safety: 15,
  fitness: 10,
  nightlife: 10,
  petFriendliness: 10,
};

export function getFitLabel(score: number): string {
  if (score >= 85) return "Excellent fit";
  if (score >= 70) return "Strong fit";
  if (score >= 50) return "Moderate fit";
  if (score >= 30) return "Weak but possible fit";
  return "Poor fit";
}

export function normalizeWeights(weights: UserWeights): UserWeights {
  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);
  if (total === 0) return DEFAULT_WEIGHTS;
  const factor = 100 / total;
  return {
    affordability: weights.affordability * factor,
    walkability: weights.walkability * factor,
    transit: weights.transit * factor,
    nightlife: weights.nightlife * factor,
    safety: weights.safety * factor,
    fitness: weights.fitness * factor,
    petFriendliness: weights.petFriendliness * factor,
  };
}

export function scoreNeighborhood(
  neighborhood: Neighborhood,
  normalizedWeights: UserWeights,
  budget: number
): Omit<NeighborhoodMatch, "aiSummary" | "aiSummaryError"> {
  const dimensions: Array<{ key: keyof UserWeights; label: string; score: number }> = [
    { key: "affordability", label: "Affordability", score: neighborhood.affordabilityScore },
    { key: "walkability", label: "Walkability", score: neighborhood.walkabilityScore },
    { key: "transit", label: "Transit", score: neighborhood.transitScore },
    { key: "nightlife", label: "Nightlife & Social", score: neighborhood.nightlifeScore },
    { key: "safety", label: "Safety", score: neighborhood.safetyScore },
    { key: "fitness", label: "Fitness & Wellness", score: neighborhood.fitnessScore },
    { key: "petFriendliness", label: "Pet-Friendliness", score: neighborhood.petFriendlinessScore },
  ];

  const weightSum = Object.values(normalizedWeights).reduce((sum, v) => sum + v, 0);

  const dimensionBreakdown: DimensionBreakdown[] = dimensions.map((d) => {
    const weight = normalizedWeights[d.key];
    const contribution = (d.score * weight) / (5 * weightSum);
    return {
      dimension: d.label,
      score: d.score,
      weight: Math.round(weight),
      contribution: Math.round(contribution * 100 * 100) / 100,
    };
  });

  const rawScore =
    dimensions.reduce((sum, d) => sum + d.score * normalizedWeights[d.key], 0) /
    (5 * weightSum);
  const compatibilityScore = Math.round(rawScore * 100 * 10) / 10;

  const fitLabel = getFitLabel(compatibilityScore);

  // Build tradeoff explanation
  const sorted = [...dimensions].sort(
    (a, b) =>
      b.score * normalizedWeights[b.key] - a.score * normalizedWeights[a.key]
  );
  const topStrengths = sorted.slice(0, 2).map((d) => d.label.toLowerCase());
  const weaknesses = dimensions
    .filter((d) => d.score <= 2)
    .map((d) => d.label.toLowerCase());

  let tradeoff = `Strongest in ${topStrengths.join(" and ")}.`;
  if (weaknesses.length > 0) {
    tradeoff += ` Lower scores in ${weaknesses.join(" and ")}.`;
  }

  const affordabilityWarning =
    budget > 0 &&
    neighborhood.medianRentalEstimate != null &&
    budget < neighborhood.medianRentalEstimate;

  return {
    neighborhood,
    compatibilityScore,
    fitLabel,
    dimensionBreakdown,
    tradeoffExplanation: tradeoff,
    affordabilityWarning,
  };
}

export function rankNeighborhoods(
  neighborhoods: Neighborhood[],
  weights: UserWeights,
  budget: number
): Array<Omit<NeighborhoodMatch, "aiSummary" | "aiSummaryError">> {
  const normalized = normalizeWeights(weights);
  return neighborhoods
    .map((n) => scoreNeighborhood(n, normalized, budget))
    .filter((m) => m.compatibilityScore >= 30)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 5);
}
