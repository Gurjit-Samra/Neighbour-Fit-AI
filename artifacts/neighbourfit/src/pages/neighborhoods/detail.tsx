import { useParams, Link } from "wouter";
import { useGetNeighborhood, useGetMe, useListFavorites, useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        <Link href="/neighborhoods"><Button variant="outline">Browse all</Button></Link>
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
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/neighborhoods">
            <Button variant="ghost" size="sm" className="gap-1 mb-4">
              <ArrowLeft className="h-4 w-4" /> All neighbourhoods
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold">{n.name}</h1>
              <p className="text-muted-foreground text-lg mt-1">{n.city} · {getDensityLabel(n.populationDensityClass)} community</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className={cn("gap-1", isFavorite && "text-primary border-primary/50")}
                onClick={toggleFavorite}
                disabled={addFav.isPending || removeFav.isPending}
                data-testid="btn-favorite"
              >
                {addFav.isPending || removeFav.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Heart className={cn("h-4 w-4", isFavorite && "fill-primary")} />
                }
                {isFavorite ? "Saved" : "Save"}
              </Button>
              <Link href={`/compare?slugs=${n.slug}`}>
                <Button variant="outline" size="default">Compare</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>About {n.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-primary mb-2">{n.identity}</p>
              {n.description && <p className="text-sm text-muted-foreground leading-relaxed">{n.description}</p>}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {(n.lifestyleTags ?? []).map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lifestyle scores</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {SCORE_DIMS.map((d) => (
                <div key={d.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <span>{d.emoji}</span>{d.label}
                    </span>
                    <span className="text-sm font-bold">{(n as any)[d.key]}/5</span>
                  </div>
                  <ScoreBar score={(n as any)[d.key]} size="md" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick facts</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {n.medianRentalEstimate && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Median rental estimate</dt>
                    <dd className="font-semibold">~${n.medianRentalEstimate.toLocaleString()}/mo</dd>
                  </div>
                )}
                {n.downtownCommuteEstimateMins && (
                  <>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Commute to downtown</dt>
                      <dd className="font-semibold">~{n.downtownCommuteEstimateMins} minutes</dd>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />{COMMUTE_DISCLAIMER}
                    </p>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Density class</dt>
                  <dd className="font-semibold capitalize">{getDensityLabel(n.populationDensityClass)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link href="/questionnaire">
              <Button className="gap-1"><MapPin className="h-4 w-4" />Check my fit</Button>
            </Link>
            <Link href={`/compare?slugs=${n.slug}`}>
              <Button variant="outline">Compare neighbourhoods</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
