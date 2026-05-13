import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFitLabel(score: number): string {
  if (score >= 85) return "Excellent fit";
  if (score >= 70) return "Strong fit";
  if (score >= 50) return "Moderate fit";
  if (score >= 30) return "Weak but possible fit";
  return "Poor fit";
}

export function getFitColor(score: number): string {
  if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 70) return "text-teal-600 bg-teal-50 border-teal-200";
  if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-orange-600 bg-orange-50 border-orange-200";
}

export function getDensityLabel(cls: string): string {
  if (cls === "urban") return "Urban";
  if (cls === "mixed") return "Mixed";
  if (cls === "suburban") return "Suburban";
  return cls;
}

export const COMMUTE_DISCLAIMER =
  "Commute estimate assumes a downtown Calgary destination. For other workplaces, use Google Maps.";

export const CALGARY_NEIGHBORHOODS = [
  "Beltline", "Kensington", "Mission", "Inglewood", "Bridgeland",
  "East Village", "Marda Loop", "Sunnyside", "University District", "Seton",
];
