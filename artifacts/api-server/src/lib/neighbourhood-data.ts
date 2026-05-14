import { readFileSync } from "fs";
import { join } from "path";

export interface CalgaryNeighbourhood {
  index: number;
  zone: string;
  name: string;
  slug: string;
  downtownAccess: number;
  carDependency: number;
  crimeRate: number;
  affordability: number;
  affordabilityScore: number;
  avg1BRRent: number;
  walkability: number;
  winterWalkability: number;
  transitAccess: number;
  transitType: string;
  safetyPerception: number;
  nightlife: number;
  parksGreenSpace: number;
  noiseLevel: number;
  coffeeShopDensity: number;
  fitnessWellness: number;
  suburbanOrCityLike: string;
  urbanForm: string;
  density: string;
  communityVibe: string;
  bestFor: string;
  keyTradeoffs: string;
  primaryMatchingDrivers: string;
  lifestyleIdentity: string;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function n(s: string): number {
  const v = parseFloat(s);
  if (!isNaN(v)) return Math.max(0, Math.min(1, v));
  const lower = s.toLowerCase().trim();
  const map: Record<string, number> = {
    "excellent": 1.0, "very high": 1.0, "strong": 1.0,
    "high": 0.8, "good": 0.8,
    "medium-high": 0.65,
    "medium": 0.5, "moderate": 0.5, "average": 0.5, "balanced": 0.5,
    "medium-low": 0.35, "low-medium": 0.35,
    "low": 0.25, "poor": 0.25,
    "very low": 0.1, "very poor": 0.1,
  };
  return map[lower] ?? 0.5;
}

function parseRent(s: string): number {
  const clean = s.replace(/[$,]/g, "");
  const v = parseInt(clean, 10);
  return isNaN(v) ? 1800 : v;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function loadNeighbourhoods(): CalgaryNeighbourhood[] {
  // Resolves from dist/ → ../data/ in production bundle
  // Copy neighbourhoods.csv to artifacts/api-server/data/ for this to work
  const csvPath = join(__dirname, "../data/neighbourhoods.csv");
  const raw = readFileSync(csvPath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const result: CalgaryNeighbourhood[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVRow(lines[i]);
    if (cols.length < 50) continue;
    result.push({
      index: i,
      zone: cols[0] ?? "Unknown",
      name: cols[1] ?? "Unknown",
      slug: slugify(cols[1] ?? "unknown"),
      downtownAccess: n(cols[6]),
      carDependency: n(cols[7]),
      crimeRate: n(cols[9]),
      affordability: n(cols[11]),
      walkability: n(cols[12]),
      transitAccess: n(cols[13]),
      safetyPerception: n(cols[14]),
      nightlife: n(cols[15]),
      parksGreenSpace: n(cols[17]),
      avg1BRRent: parseRent(cols[29]),
      affordabilityScore: Math.max(1, Math.min(5, parseFloat(cols[32]) || 3)),
      winterWalkability: n(cols[33]),
      transitType: cols[34] ?? "Bus-focused",
      noiseLevel: n(cols[35]),
      coffeeShopDensity: n(cols[38]),
      fitnessWellness: n(cols[39]),
      suburbanOrCityLike: cols[42] ?? "Suburban",
      keyTradeoffs: cols[43] ?? "",
      urbanForm: cols[50] ?? "Established suburban",
      density: cols[52] ?? "Medium",
      lifestyleIdentity: cols[53] ?? "",
      communityVibe: cols[27] ?? "",
      bestFor: cols[28] ?? "",
      primaryMatchingDrivers: cols[48] ?? "",
    });
  }
  return result;
}

export const NEIGHBOURHOODS: CalgaryNeighbourhood[] = loadNeighbourhoods();
