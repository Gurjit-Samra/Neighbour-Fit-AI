import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetNeighborhood,
  useGetMe,
  useListFavorites,
  useAddFavorite,
  useRemoveFavorite,
  useAskNeighbourhood,
  getListFavoritesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/neighborhood/ScoreBar";
import { COMMUTE_DISCLAIMER, getDensityLabel } from "@/lib/utils";
import {
  Heart,
  MapPin,
  ArrowLeft,
  Info,
  Loader2,
  Sparkles,
  SendHorizontal,
  MessageCircle,
} from "lucide-react";
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
  const addFav    = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const askNeighbourhood = useAskNeighbourhood();

  const [aiExpanded, setAiExpanded]             = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer]     = useState<string | null>(null);

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
  const isFavorite  = favoriteIds.has(n.id);

  const toggleFavorite = () => {
    if (!user) { toast({ title: "Sign in required", description: "Create a free account to save favourites." }); return; }
    const queryKey = getListFavoritesQueryKey();
    const previous = queryClient.getQueryData(queryKey);
    if (isFavorite) {
      queryClient.setQueryData(queryKey, (old: any[]) => (old ?? []).filter((f: any) => f.id !== n.id));
      removeFav.mutate(
        { neighborhoodId: n.id },
        {
          onError: () => queryClient.setQueryData(queryKey, previous),
          onSettled: () => queryClient.invalidateQueries({ queryKey }),
        }
      );
    } else {
      queryClient.setQueryData(queryKey, (old: any[]) => [...(old ?? []), { ...n }]);
      addFav.mutate(
        { neighborhoodId: n.id },
        {
          onError: () => queryClient.setQueryData(queryKey, previous),
          onSettled: () => queryClient.invalidateQueries({ queryKey }),
        }
      );
    }
  };

  const handleAsk = () => {
    if (!followUpQuestion.trim()) return;
    askNeighbourhood.mutate(
      { slug: n.slug, data: { question: followUpQuestion.trim() } },
      {
        onSuccess: (data) => {
          setFollowUpAnswer(data.answer);
          setFollowUpQuestion("");
        },
      }
    );
  };

  const aiSummary: string | null | undefined = (n as any).aiSummary;
  const aiSummaryError: boolean              = !!(n as any).aiSummaryError;

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

          {/* AI Lifestyle Overview */}
          {aiSummary && !aiSummaryError && (
            <div className="bg-card border border-card-border rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-base text-foreground">AI Lifestyle Overview</h2>
              </div>

              <div
                style={{
                  maxHeight: aiExpanded ? "600px" : "72px",
                  transition: "max-height 0.35s ease-in-out",
                }}
                className="overflow-hidden"
              >
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  style={
                    aiExpanded
                      ? undefined
                      : {
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }
                  }
                >
                  {aiSummary}
                </p>
              </div>

              <button
                onClick={() => setAiExpanded((v) => !v)}
                className="mt-2 text-xs font-medium transition-opacity hover:opacity-75"
                style={{ color: "#00cc99", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                {aiExpanded ? "Hide" : "Read more"}
              </button>

              <p className="text-[10px] text-muted-foreground/60 mt-3">
                AI-generated overview — scores are curated estimates, not AI-generated.
              </p>
            </div>
          )}

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

          {/* Ask about this neighbourhood */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-base text-foreground">Ask about {n.name}</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !askNeighbourhood.isPending) handleAsk();
                }}
                placeholder="e.g. Is it good for families? How is parking?"
                disabled={askNeighbourhood.isPending}
                className="flex-1 min-w-0 text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
              />
              <button
                onClick={handleAsk}
                disabled={!followUpQuestion.trim() || askNeighbourhood.isPending}
                className="shrink-0 flex items-center justify-center w-9 h-9 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-colors"
              >
                {askNeighbourhood.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <SendHorizontal className="h-4 w-4" />
                }
              </button>
            </div>

            {(followUpAnswer || askNeighbourhood.isError) && (
              <div className="mt-3 bg-muted/40 border border-border rounded-lg p-3">
                {askNeighbourhood.isError ? (
                  <p className="text-xs text-destructive">Could not get an answer. Please try again.</p>
                ) : (
                  <>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{followUpAnswer}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">AI response — verify details with local sources.</p>
                  </>
                )}
              </div>
            )}
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
