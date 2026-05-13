import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className={cn("relative overflow-hidden", rank === 1 && "border-primary/40 shadow-md")}>
      {rank === 1 && (
        <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 absolute top-0 left-0 right-0">
          #1 Best match
        </div>
      )}
      <CardContent className={cn("pt-6 pb-6", rank === 1 && "pt-10")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {rank > 1 && (
                <span className="text-xs text-muted-foreground font-semibold">#{rank}</span>
              )}
              <h3 className="text-xl font-bold">{n.name}</h3>
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
          <div className="bg-accent/40 rounded-lg p-3 mb-4 text-sm text-foreground leading-relaxed border border-accent">
            <p className="text-xs font-semibold text-accent-foreground mb-1 flex items-center gap-1">
              <span>✨</span> AI-generated insight
            </p>
            {aiSummary}
          </div>
        )}
        {aiSummaryError && (
          <div className="bg-muted rounded-lg p-3 mb-4 text-xs text-muted-foreground italic">
            AI summary unavailable for this match.
          </div>
        )}

        {/* Scores */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
          {SCORE_DIMS.map((d) => (
            <div key={d.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
              <ScoreBar score={n[d.key]} size="sm" />
            </div>
          ))}
        </div>

        {/* Tradeoff */}
        {tradeoffExplanation && (
          <p className="text-xs text-muted-foreground mb-4 italic">{tradeoffExplanation}</p>
        )}

        {/* Quick facts */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
          {n.medianRentalEstimate && (
            <span>~${n.medianRentalEstimate.toLocaleString()}/mo est. rent</span>
          )}
          {n.downtownCommuteEstimateMins && (
            <span title={COMMUTE_DISCLAIMER}>
              ~{n.downtownCommuteEstimateMins} min to downtown *
            </span>
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4 text-xs text-amber-700">
            ⚠️ Median rent typically exceeds your stated budget.
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/neighborhoods/${n.slug}`}>
            <Button variant="outline" size="sm" className="gap-1">
              <MapPin className="h-3.5 w-3.5" /> Details
            </Button>
          </Link>
          {onFavorite && (
            <Button
              variant="outline" size="sm"
              className={cn("gap-1", isFavorite && "text-primary border-primary/50")}
              onClick={onFavorite}
              disabled={isFavoriteLoading}
              data-testid={`btn-favorite-${n.slug}`}
            >
              {isFavoriteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-primary")} />}
              {isFavorite ? "Saved" : "Save"}
            </Button>
          )}
          {onCompare && (
            <Button
              variant="outline" size="sm"
              className={cn("gap-1", isInCompare && "text-primary border-primary/50")}
              onClick={onCompare}
              disabled={isCompareLoading}
              data-testid={`btn-compare-${n.slug}`}
            >
              {isCompareLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCompare className="h-3.5 w-3.5" />}
              {isInCompare ? "In compare" : "Compare"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
