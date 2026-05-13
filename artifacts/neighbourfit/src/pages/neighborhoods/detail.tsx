import { useParams, Link } from "wouter";
import { useGetNeighborhood, useGetMe, useListFavorites, useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/neighborhood/ScoreBar";
import { COMMUTE_DISCLAIMER, getDensityLabel } from "@/lib/utils";
import { Heart, MapPin, ArrowLeft, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SCORE_DIMS = [
  { key: "affordabilityScore", label: "Affordability", emoji: "💰" },
  { key: "walkabilityScore", label: "Walkability", emoji: "🚶" },
  { key: "transitScore", label: "Transit", emoji: "🚌" },
  { key: "nightlifeScore", label: "Nightlife & social", emoji: "🍻" },
  { key: "safetyScore", label: "Safety", emoji: "🛡️" },
  { key: "fitnessScore", label: "Fitness & wellness", emoji: "💪" },
  { key: "petFriendlinessScore", label: "Pet-friendliness", emoji: "🐾" },
] as const;

export default function NeighborhoodDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: n, isLoading } = useGetNeighborhood(slug!);
  const { data: user } = useGetMe();
  const { data: favorites } = useListFavorites({ query: { enabled: !!user } });
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!n) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Neighbourhood not found.</p>
        <Link href="/neighborhoods">
          <button className="px-4 py-2 bg-card border border-card-border rounded-xl text-sm font-medium hover:shadow-sm transition-shadow">Browse all</button>
        </Link>
      </div>
    );
  }

  const favoriteIds = new Set((favorites ?? []).map((f: any) => f.id));
  const isFavorite = favoriteIds.has(n.id);

  const toggleFavorite = () => {
    if (!user) { toast({ title: "Sign in required", description: "Create a free account to save favourites." }); return; }
    if (isFavorite) removeFav.mutate({ neighborhoodId: String(n.id) });
    else addFav.mutate({ neighborhoodId: String(n.id) });
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/neighborhoods">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
              <ArrowLeft className="h-4 w-4" /> All neighbourhoods
            </button>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold text-foreground">{n.name}</h1>
              <p className="text-muted-foreground text-base mt-1">{n.city} · {getDensityLabel(n.populationDensityClass)} community</p>
            </div>
            <div className="flex gap-2">
              <button
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 bg-card border rounded-xl text-sm font-medium transition-all",
                  isFavorite
                    ? "border-primary/50 text-primary"
                    : "border-card-border text-foreground hover:shadow-sm"
                )}
                onClick={toggleFavorite}
                disabled={addFav.isPending || removeFav.isPending}
                data-testid="btn-favorite"
              >
                {addFav.isPending || removeFav.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Heart className={cn("h-4 w-4", isFavorite && "fill-primary")} />
                }
                {isFavorite ? "Saved" : "Save"}
              </button>
              <Link href={`/compare?slugs=${n.slug}`}>
                <button className="px-4 py-2 bg-card border border-card-border rounded-xl text-sm font-medium hover:shadow-sm transition-shadow">Compare</button>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* About */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-base mb-3 text-foreground">About {n.name}</h2>
            <p className="text-sm font-medium text-primary mb-2">{n.identity}</p>
            {n.description && <p className="text-sm text-muted-foreground leading-relaxed">{n.description}</p>}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {(n.lifestyleTags ?? []).map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Lifestyle scores */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-base mb-4 text-foreground">Lifestyle scores</h2>
            <div className="space-y-4">
              {SCORE_DIMS.map((d) => (
                <div key={d.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                      <span>{d.emoji}</span>{d.label}
                    </span>
                    <span className="text-sm font-bold text-foreground">{(n as any)[d.key]}/5</span>
                  </div>
                  <ScoreBar score={(n as any)[d.key]} size="md" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick facts */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-base mb-4 text-foreground">Quick facts</h2>
            <dl className="space-y-3 divide-y divide-border">
              {n.medianRentalEstimate && (
                <div className="flex justify-between text-sm pt-3 first:pt-0">
                  <dt className="text-muted-foreground">Median rental estimate</dt>
                  <dd className="font-semibold">~${n.medianRentalEstimate.toLocaleString()}/mo</dd>
                </div>
              )}
              {n.downtownCommuteEstimateMins && (
                <>
                  <div className="flex justify-between text-sm pt-3">
                    <dt className="text-muted-foreground">Commute to downtown</dt>
                    <dd className="font-semibold">~{n.downtownCommuteEstimateMins} minutes</dd>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-start gap-1 pt-2">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />{COMMUTE_DISCLAIMER}
                  </p>
                </>
              )}
              <div className="flex justify-between text-sm pt-3">
                <dt className="text-muted-foreground">Density class</dt>
                <dd className="font-semibold capitalize">{getDensityLabel(n.populationDensityClass)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/questionnaire">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
                <MapPin className="h-4 w-4" />Check my fit
              </button>
            </Link>
            <Link href={`/compare?slugs=${n.slug}`}>
              <button className="px-5 py-2.5 bg-card border border-card-border text-sm font-medium rounded-xl hover:shadow-sm transition-shadow">
                Compare neighbourhoods
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
