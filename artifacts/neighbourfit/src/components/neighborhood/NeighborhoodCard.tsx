import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "./ScoreBar";
import { FitBadge } from "./FitBadge";
import { COMMUTE_DISCLAIMER, cn } from "@/lib/utils";
import { MapPin, Heart, GitCompare, Info, Loader2 } from "lucide-react";
import { Link } from "wouter";

interface DimensionBreakdown {
  dimension: string;
  score: number;
  weight: number;
  contribution: number;
}

interface NeighborhoodCardProps {
  rank: number;
  neighborhood: {
    id: number;
    name: string;
    slug: string;
    city: string;
    identity: string;
    description?: string | null;
    affordabilityScore: number;
    walkabilityScore: number;
    transitScore: number;
    nightlifeScore: number;
    safetyScore: number;
    fitnessScore: number;
    petFriendlinessScore: number;
    medianRentalEstimate?: number | null;
    downtownCommuteEstimateMins?: number | null;
    populationDensityClass: string;
    lifestyleTags?: string[] | null;
  };
  compatibilityScore: number;
  fitLabel: string;
  aiSummary?: string | null;
  aiSummaryError?: boolean;
  affordabilityWarning?: boolean;
  dimensionBreakdown?: DimensionBreakdown[];
  tradeoffExplanation?: string;
  isFavorite?: boolean;
  isInCompare?: boolean;
  onFavorite?: () => void;
  onCompare?: () => void;
  isCompareLoading?: boolean;
  isFavoriteLoading?: boolean;
  showFullDetail?: boolean;
}

const SCORE_DIMS = [
  { key: "affordabilityScore", label: "Affordability" },
  { key: "walkabilityScore", label: "Walkability" },
  { key: "transitScore", label: "Transit" },
  { key: "nightlifeScore", label: "Nightlife" },
  { key: "safetyScore", label: "Safety" },
  { key: "fitnessScore", label: "Fitness" },
  { key: "petFriendlinessScore", label: "Pets" },
] as const;

export function NeighborhoodCard({
  rank,
  neighborhood: n,
  compatibilityScore,
  fitLabel,
  aiSummary,
  aiSummaryError,
  affordabilityWarning,
  dimensionBreakdown,
  tradeoffExplanation,
  isFavorite,
  isInCompare,
  onFavorite,
  onCompare,
  isCompareLoading,
  isFavoriteLoading,
  showFullDetail = false,
}: NeighborhoodCardProps) {
  return (
    <div className={cn(
      "bg-card border rounded-xl shadow-sm overflow-hidden",
      rank === 1 ? "border-primary/30 shadow-md" : "border-card-border"
    )}>
      {/* #1 match banner */}
      {rank === 1 && (
        <div className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 flex items-center gap-1.5">
          <span>★</span> Best match for your lifestyle
        </div>
      )}

      <div className={cn("p-6", rank === 1 ? "" : "")}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {rank > 1 && (
                <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  #{rank}
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground">{n.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{n.identity}</p>
          </div>
          <FitBadge score={compatibilityScore} label={fitLabel} />
        </div>

        {/* Tags */}
        {n.lifestyleTags && n.lifestyleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {n.lifestyleTags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* AI summary */}
        {aiSummary && (
          <div className="bg-accent/40 rounded-xl p-3.5 mb-4 text-sm leading-relaxed border border-accent">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <span>✨</span> Lifestyle insight
            </p>
            <p className="text-foreground">{aiSummary}</p>
          </div>
        )}
        {aiSummaryError && (
          <div className="bg-muted rounded-lg p-3 mb-4 text-xs text-muted-foreground italic">
            Lifestyle insight unavailable for this match.
          </div>
        )}

        {/* Score bars grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-4">
          {SCORE_DIMS.map((d) => (
            <div key={d.key}>
              <span className="text-xs text-muted-foreground mb-0.5 block">{d.label}</span>
              <ScoreBar score={n[d.key]} size="sm" />
            </div>
          ))}
        </div>

        {/* Tradeoff */}
        {tradeoffExplanation && (
          <p className="text-xs text-muted-foreground mb-4 italic leading-relaxed">{tradeoffExplanation}</p>
        )}

        {/* Quick facts */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
          {n.medianRentalEstimate && (
            <span className="font-medium">~${n.medianRentalEstimate.toLocaleString()}/mo est. rent</span>
          )}
          {n.downtownCommuteEstimateMins && (
            <span>~{n.downtownCommuteEstimateMins} min to downtown</span>
          )}
          <span className="capitalize">{n.populationDensityClass} density</span>
        </div>

        {n.downtownCommuteEstimateMins && (
          <p className="text-xs text-muted-foreground/70 mb-4 flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            {COMMUTE_DISCLAIMER}
          </p>
        )}

        {affordabilityWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4 text-xs text-amber-700">
            ⚠️ Median rent in this neighbourhood typically exceeds your stated budget.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-card-border mt-2">
          <Link href={`/neighborhoods/${n.slug}`}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-card-border rounded-lg hover:shadow-sm transition-shadow mt-3">
              <MapPin className="h-3.5 w-3.5" /> Details
            </button>
          </Link>
          {onFavorite && (
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all mt-3",
                isFavorite
                  ? "border-primary/50 text-primary bg-primary/5"
                  : "bg-background border-card-border hover:shadow-sm"
              )}
              onClick={onFavorite}
              disabled={isFavoriteLoading}
              data-testid={`btn-favorite-${n.slug}`}
            >
              {isFavoriteLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-primary text-primary")} />
              )}
              {isFavorite ? "Saved" : "Save"}
            </button>
          )}
          {onCompare && (
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all mt-3",
                isInCompare
                  ? "border-primary/50 text-primary bg-primary/5"
                  : "bg-background border-card-border hover:shadow-sm"
              )}
              onClick={onCompare}
              disabled={isCompareLoading}
              data-testid={`btn-compare-${n.slug}`}
            >
              {isCompareLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <GitCompare className="h-3.5 w-3.5" />
              )}
              {isInCompare ? "In compare" : "Compare"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
