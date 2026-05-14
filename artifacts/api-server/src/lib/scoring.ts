import type { CalgaryNeighbourhood } from "./neighbourhood-data";
import { NEIGHBOURHOODS } from "./neighbourhood-data";

export type WorkplaceQuadrant = "NW" | "NE" | "SE" | "SW" | "Downtown" | null;

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
  key: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface NeighbourhoodMatch {
  neighbourhood: CalgaryNeighbourhood;
  compatibilityScore: number;
  fitLabel: string;
  affordabilityWarning: boolean;
  dimensionBreakdown: DimensionBreakdown[];
  tradeoffExplanation: string;
}

export const DEFAULT_WEIGHTS: UserWeights = {
  affordability: 60,
  walkability: 50,
  transit: 50,
  nightlife: 40,
  safety: 70,
  fitness: 40,
  petFriendliness: 0,
};

export function normalizeWeights(w: UserWeights): UserWeights {
  const total = Object.values(w).reduce((s, v) => s + v, 0);
  if (total === 0) return DEFAULT_WEIGHTS;
  const factor = 100 / total;
  return {
    affordability: Math.round(w.affordability * factor),
    walkability: Math.round(w.walkability * factor),
    transit: Math.round(w.transit * factor),
    nightlife: Math.round(w.nightlife * factor),
    safety: Math.round(w.safety * factor),
    fitness: Math.round(w.fitness * factor),
    petFriendliness: Math.round(w.petFriendliness * factor),
  };
}

export function deriveWorkplaceQuadrant(s: string | null | undefined): WorkplaceQuadrant {
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower.includes("remote") || lower.includes("work from home") || lower.includes("wfh") || lower === "none") return null;
  if (lower.includes("downtown") || lower === "downtown core") return "Downtown";
  if (lower.includes("northwest") || lower === "nw") return "NW";
  if (lower.includes("northeast") || lower === "ne") return "NE";
  if (lower.includes("southeast") || lower === "se") return "SE";
  if (lower.includes("southwest") || lower === "sw") return "SW";
  return null;
}

export function getFitLabel(score: number): string {
  if (score >= 85) return "Excellent fit";
  if (score >= 70) return "Strong fit";
  if (score >= 50) return "Moderate fit";
  if (score >= 30) return "Weak but possible fit";
  return "Poor fit";
}

function transitTypeScore(t: string): number {
  const l = t.toLowerCase();
  if (l.includes("ctrain")) return 1.0;
  if (l.includes("bus-focused") || l.includes("bus focused")) return 0.65;
  if (l.includes("car-based") || l.includes("car based")) return 0.25;
  return 0.5;
}

function urbanFormScore(suburbanOrCityLike: string): number {
  const l = suburbanOrCityLike.toLowerCase();
  if (l.includes("city-like") || l.includes("city like") || l.includes("urban")) return 1.0;
  if (l.includes("balanced") || l.includes("mixed")) return 0.65;
  if (l.includes("suburban")) return 0.30;
  return 0.5;
}

function densityCompatScore(density: string): number {
  const l = density.toLowerCase().trim();
  if (l === "medium") return 1.0;
  if (l === "low-medium" || l === "low medium") return 0.9;
  if (l === "low") return 0.85;
  if (l === "medium-high" || l === "medium high") return 0.7;
  if (l === "high") return 0.5;
  return 0.7;
}

function workplaceCompatScore(zone: string, quadrant: WorkplaceQuadrant, downtownAccess: number): number {
  if (!quadrant) return 0.7;
  const z = zone.trim().toUpperCase();
  if (z === quadrant.toUpperCase()) return 1.0;
  if (quadrant === "Downtown") {
    if (downtownAccess > 0.7) return 0.85;
    if (downtownAccess > 0.5) return 0.70;
    if (downtownAccess > 0.3) return 0.50;
    return 0.25;
  }
  if (z === "Downtown") return 0.75;
  const adjacency: Record<string, string[]> = {
    NW: ["NE", "SW"],
    NE: ["NW", "SE"],
    SE: ["NE", "SW"],
    SW: ["NW", "SE"],
  };
  if ((adjacency[quadrant] ?? []).includes(z)) return 0.55;
  return 0.35;
}

function rentFitScore(rent: number, budget: number): number {
  if (budget <= 0) return 0.5;
  const r = rent / budget;
  if (r <= 0.90) return 1.0;
  if (r <= 1.00) return 0.90;
  if (r <= 1.05) return 0.75;
  if (r <= 1.10) return 0.60;
  if (r <= 1.25) return 0.35;
  return 0.10;
}

function budgetPenalty(rent: number, budget: number): number {
  if (budget <= 0) return 0;
  const pct = (rent - budget) / budget;
  if (pct <= 0) return 0;
  if (pct <= 0.05) return 2;
  if (pct <= 0.10) return 5;
  if (pct <= 0.20) return 12;
  return 25;
}

type Dim = { key: string; label: string; rawScore: number; weight: number };

function computeDimensions(
  nb: CalgaryNeighbourhood,
  weights: UserWeights,
  workplaceQuadrant: WorkplaceQuadrant,
  hasPet: boolean,
  budget: number,
): Dim[] {
  const walkScore =
    0.60 * nb.walkability +
    0.25 * nb.winterWalkability +
    0.15 * (1 - nb.carDependency);

  const transitScore =
    0.70 * nb.transitAccess +
    0.20 * transitTypeScore(nb.transitType) +
    0.10 * (1 - nb.carDependency);

  const nightScore =
    0.65 * nb.nightlife +
    0.20 * nb.coffeeShopDensity +
    0.15 * urbanFormScore(nb.suburbanOrCityLike);

  const safetyScore =
    0.70 * nb.safetyPerception +
    0.20 * (1 - nb.crimeRate) +
    0.10 * (1 - nb.noiseLevel);

  const fitnessScore =
    0.60 * nb.fitnessWellness +
    0.25 * nb.parksGreenSpace +
    0.15 * nb.walkability;

  const rentFit = rentFitScore(nb.avg1BRRent, budget);
  const budgetScore =
    0.75 * rentFit +
    0.15 * nb.affordability +
    0.10 * (nb.affordabilityScore / 5);

  const dims: Dim[] = [
    { key: "affordability", label: "Affordability",    rawScore: budgetScore,  weight: weights.affordability },
    { key: "walkability",   label: "Walkability",      rawScore: walkScore,    weight: weights.walkability },
    { key: "transit",       label: "Transit",          rawScore: transitScore, weight: weights.transit },
    { key: "nightlife",     label: "Nightlife",        rawScore: nightScore,   weight: weights.nightlife },
    { key: "safety",        label: "Safety",           rawScore: safetyScore,  weight: weights.safety },
    { key: "fitness",       label: "Fitness & Parks",  rawScore: fitnessScore, weight: weights.fitness },
  ];

  if (hasPet) {
    const petScore =
      0.45 * nb.parksGreenSpace +
      0.30 * nb.walkability +
      0.15 * (1 - nb.noiseLevel) +
      0.10 * densityCompatScore(nb.density);
    dims.push({ key: "petFriendliness", label: "Pet-Friendly", rawScore: petScore, weight: weights.petFriendliness });
  }

  if (workplaceQuadrant) {
    const wScore = workplaceCompatScore(nb.zone, workplaceQuadrant, nb.downtownAccess);
    dims.push({ key: "workplace", label: "Workplace Fit", rawScore: wScore, weight: weights.transit });
  }

  return dims;
}

function buildDimensionBreakdown(dims: Dim[]): DimensionBreakdown[] {
  const weightSum = dims.reduce((s, d) => s + d.weight, 0);
  if (weightSum === 0) return [];
  return dims.map((d) => {
    const nw = d.weight / weightSum;
    return {
      key: d.key,
      label: d.label,
      score: parseFloat((d.rawScore * 5).toFixed(2)),
      weight: Math.round(nw * 100),
      contribution: parseFloat((d.rawScore * nw).toFixed(4)),
    };
  });
}

function weightedFit(dims: Dim[]): number {
  const weightSum = dims.reduce((s, d) => s + d.weight, 0);
  if (weightSum === 0) return 0.5;
  return dims.reduce((s, d) => s + d.rawScore * (d.weight / weightSum), 0);
}

function buildTradeoff(nb: CalgaryNeighbourhood, dims: Dim[], budget: number): string {
  const warnings: string[] = [];
  if (nb.avg1BRRent > budget * 1.1) {
    warnings.push(`rent (~$${nb.avg1BRRent.toLocaleString()}/mo) runs above your budget`);
  }
  const weak = dims
    .filter((d) => d.rawScore < 0.45 && d.weight > 25)
    .sort((a, b) => a.rawScore - b.rawScore)
    .slice(0, 2);
  for (const d of weak) {
    if (d.key === "walkability") warnings.push("walkability is limited — a car is useful");
    else if (d.key === "transit") warnings.push("transit options are limited — driving is recommended");
    else if (d.key === "nightlife") warnings.push("the social scene is quieter than average");
    else if (d.key === "safety") warnings.push("safety perception is below Calgary average");
    else if (d.key === "fitness") warnings.push("fitness and park access is more limited");
    else if (d.key === "petFriendliness") warnings.push("pet-friendly green space is limited");
    else if (d.key === "workplace") warnings.push("commute to your workplace zone may be longer");
  }
  if (warnings.length === 0 && nb.keyTradeoffs) return `Key tradeoff: ${nb.keyTradeoffs}.`;
  if (warnings.length === 0) return "A well-rounded match for your priorities.";
  return warnings.map((w, i) => (i === 0 ? `Key tradeoff: ${w}` : w)).join("; ") + ".";
}

export function rankNeighborhoods(
  weights: UserWeights,
  budget: number,
  workplaceQuadrant: WorkplaceQuadrant,
): NeighbourhoodMatch[] {
  const hasPet = weights.petFriendliness > 0;

  return NEIGHBOURHOODS.map((nb) => {
    const dims = computeDimensions(nb, weights, workplaceQuadrant, hasPet, budget);
    const lifestyleFit = weightedFit(dims);
    const budgetDim = dims.find((d) => d.key === "affordability");
    const budgetScore = budgetDim?.rawScore ?? 0.5;
    const raw = 0.25 * budgetScore + 0.75 * lifestyleFit;

    let penalty = budgetPenalty(nb.avg1BRRent, budget);
    const safetyDim = dims.find((d) => d.key === "safety");
    if (weights.safety >= 70 && safetyDim && safetyDim.rawScore < 0.5) penalty += 10;
    const transitDim = dims.find((d) => d.key === "transit");
    if (weights.transit >= 70 && transitDim && transitDim.rawScore < 0.5) penalty += 10;
    const walkDim = dims.find((d) => d.key === "walkability");
    if (weights.walkability >= 70 && walkDim && walkDim.rawScore < 0.5) penalty += 8;
    const petDim = dims.find((d) => d.key === "petFriendliness");
    if (hasPet && petDim && petDim.rawScore < 0.5) penalty += 8;
    const workDim = dims.find((d) => d.key === "workplace");
    if (workplaceQuadrant && weights.transit >= 70 && workDim && workDim.rawScore < 0.5) penalty += 10;

    const finalScore = Math.max(0, Math.min(100, raw * 100 - penalty));

    return {
      neighbourhood: nb,
      compatibilityScore: Math.round(finalScore),
      fitLabel: getFitLabel(finalScore),
      affordabilityWarning: nb.avg1BRRent > budget * 1.1,
      dimensionBreakdown: buildDimensionBreakdown(dims),
      tradeoffExplanation: buildTradeoff(nb, dims, budget),
    };
  })
    .filter((m) => m.compatibilityScore >= 30)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 5);
}
