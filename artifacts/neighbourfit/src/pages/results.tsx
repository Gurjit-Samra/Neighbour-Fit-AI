import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateRecommendation, useAddFavorite, useRemoveFavorite, useListFavorites, useGetMe } from "@workspace/api-client-react";
import { loadQuestionnaire } from "@/lib/questionnaire-store";
import { NeighborhoodCard } from "@/components/neighborhood/NeighborhoodCard";
import { Button } from "@/components/ui/button";
import { Loader2, GitCompare, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Results() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const { data: favorites } = useListFavorites({ query: { enabled: !!user } });
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const createRec = useCreateRecommendation();
  const [compareSet, setCompareSet] = useState<string[]>([]);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    const q = loadQuestionnaire();
    if (!q) {
      setLocation("/questionnaire");
      return;
    }
    submitted.current = true;
    createRec.mutate({
      data: {
        budget: q.budget,
        weights: q.weights,
        workplaceNeighborhood: q.workplaceNeighborhood ?? undefined,
        usedDefaultWeights: q.usedDefaultWeights,
      },
    });
  }, []);

  if (createRec.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-lg font-semibold">Analysing your lifestyle priorities...</p>
          <p className="text-sm text-muted-foreground">Generating AI insights for each match</p>
        </div>
      </div>
    );
  }

  if (createRec.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-lg font-semibold text-destructive">Something went wrong</p>
          <p className="text-sm text-muted-foreground">{String(createRec.error)}</p>
          <Button onClick={() => { submitted.current = false; createRec.reset(); }}>Try again</Button>
        </div>
      </div>
    );
  }

  const result = createRec.data;
  if (!result) return null;

  const matches = result.matches ?? [];
  const favoriteIds = new Set((favorites ?? []).map((f: { id: number }) => f.id));

  const toggleFavorite = (id: number, slug: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Create a free account to save favourites." });
      return;
    }
    if (favoriteIds.has(id)) {
      removeFav.mutate({ neighborhoodId: String(id) });
    } else {
      addFav.mutate({ neighborhoodId: String(id) });
    }
  };

  const toggleCompare = (slug: string) => {
    setCompareSet((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) {
        toast({ title: "Max 3 neighbourhoods", description: "Remove one before adding another." });
        return prev;
      }
      return [...prev, slug];
    });
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your neighbourhood matches</h1>
            <p className="text-muted-foreground mt-1">
              {matches.length} neighbourhood{matches.length !== 1 ? "s" : ""} ranked by lifestyle compatibility
              {result.usedDefaultWeights && (
                <span className="ml-2 text-xs text-amber-600 font-medium">(balanced default weights)</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {compareSet.length >= 2 && (
              <Link href={`/compare?slugs=${compareSet.join(",")}`}>
                <Button size="sm" className="gap-1">
                  <GitCompare className="h-4 w-4" />
                  Compare {compareSet.length}
                </Button>
              </Link>
            )}
            <Link href="/questionnaire">
              <Button variant="outline" size="sm">Redo questionnaire</Button>
            </Link>
          </div>
        </div>

        {compareSet.length > 0 && (
          <div className="bg-accent/40 border border-accent rounded-lg p-3 mb-6 flex items-center justify-between">
            <div className="text-sm">
              Comparing: <span className="font-semibold">{compareSet.join(", ")}</span>
            </div>
            {compareSet.length >= 2 && (
              <Link href={`/compare?slugs=${compareSet.join(",")}`}>
                <Button size="sm" className="gap-1">
                  Go <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No neighbourhoods met the minimum compatibility threshold. Try adjusting your weights.</p>
            <Link href="/questionnaire">
              <Button className="mt-4">Redo questionnaire</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match: any, i: number) => (
              <NeighborhoodCard
                key={match.neighborhood.id}
                rank={i + 1}
                neighborhood={match.neighborhood}
                compatibilityScore={match.compatibilityScore}
                fitLabel={match.fitLabel}
                aiSummary={match.aiSummary}
                aiSummaryError={match.aiSummaryError}
                affordabilityWarning={match.affordabilityWarning}
                dimensionBreakdown={match.dimensionBreakdown}
                tradeoffExplanation={match.tradeoffExplanation}
                isFavorite={favoriteIds.has(match.neighborhood.id)}
                isInCompare={compareSet.includes(match.neighborhood.slug)}
                onFavorite={() => toggleFavorite(match.neighborhood.id, match.neighborhood.slug)}
                onCompare={() => toggleCompare(match.neighborhood.slug)}
                isFavoriteLoading={addFav.isPending || removeFav.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
