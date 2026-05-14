import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCreateRecommendation,
  useAddFavorite,
  useRemoveFavorite,
  useListFavorites,
  useGetMe,
  useAskNeighbourhood,
} from "@workspace/api-client-react";
import { loadQuestionnaire } from "@/lib/questionnaire-store";
import { RadarChartComponent } from "@/components/neighborhood/RadarChart";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  GitCompare,
  Star,
  BookmarkCheck,
  Bookmark,
  MapPin,
  Clock,
  RefreshCw,
  Navigation,
  TrendingUp,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  SendHorizontal,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { COMMUTE_DISCLAIMER } from "@/lib/utils";

function fitLabelColor(label: string) {
  if (label.startsWith("Excellent")) return "text-emerald-400 bg-emerald-950/60 border-emerald-700";
  if (label.startsWith("Strong"))    return "text-teal-400 bg-teal-950/60 border-teal-700";
  if (label.startsWith("Moderate"))  return "text-amber-400 bg-amber-950/60 border-amber-700";
  return "text-orange-400 bg-orange-950/60 border-orange-700";
}

function dimLabel(dim: string) {
  const map: Record<string, string> = {
    affordability:  "Affordability",
    walkability:    "Walkability",
    transit:        "Transit",
    nightlife:      "Nightlife",
    safety:         "Safety",
    fitness:        "Fitness",
    petFriendliness:"Pet-Friendly",
  };
  return map[dim] ?? dim;
}

function dimColor(dim: string) {
  const map: Record<string, string> = {
    affordability:  "bg-emerald-500",
    walkability:    "bg-teal-500",
    transit:        "bg-blue-500",
    nightlife:      "bg-purple-500",
    safety:         "bg-cyan-500",
    fitness:        "bg-red-500",
    petFriendliness:"bg-amber-500",
  };
  return map[dim] ?? "bg-slate-500";
}

const NEIGHBOURHOOD_IMAGES: Record<string, string> = {
  beltline:              "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&fit=crop&auto=format",
  kensington:            "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format",
  mission:               "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80&fit=crop&auto=format",
  inglewood:             "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80&fit=crop&auto=format",
  bridgeland:            "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80&fit=crop&auto=format",
  "east-village":        "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80&fit=crop&auto=format",
  "marda-loop":          "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80&fit=crop&auto=format",
  sunnyside:             "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop&auto=format",
  "university-district": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80&fit=crop&auto=format",
  seton:                 "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&fit=crop&auto=format",
};
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&fit=crop&auto=format";

function getNeighbourhoodImage(slug: string): string {
  return NEIGHBOURHOOD_IMAGES[slug] ?? FALLBACK_IMAGE;
}

function getPriceRange(median: number): string {
  const low  = Math.round((median * 0.85) / 50) * 50;
  const high = Math.round((median * 1.15) / 50) * 50;
  return `$${low.toLocaleString()}–$${high.toLocaleString()}/mo`;
}

export default function Results() {
  const [, setLocation] = useLocation();
  const { toast }       = useToast();
  const { data: user }  = useGetMe();
  const { data: favorites } = useListFavorites({ query: { enabled: !!user } });
  const addFav    = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const createRec = useCreateRecommendation();
  const [compareSet, setCompareSet] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx]         = useState(0);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer]     = useState<string | null>(null);
  const [aiExpanded, setAiExpanded]             = useState(false);
  const submitted      = useRef(false);
  const askNeighbourhood = useAskNeighbourhood();

  useEffect(() => {
    if (submitted.current) return;
    const q = loadQuestionnaire();
    if (!q) { setLocation("/questionnaire"); return; }
    submitted.current = true;
    createRec.mutate({
      data: {
        budget:                  q.budget,
        weights:                 q.weights,
        workplaceNeighborhood:   q.workplaceNeighborhood ?? undefined,
        usedDefaultWeights:      q.usedDefaultWeights,
      },
    });
  }, []);

  /* ── Loading ───────────────────────────────────── */
  if (createRec.isPending) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400 mx-auto" />
          <p className="text-lg font-semibold text-slate-100">Analysing your lifestyle priorities…</p>
          <p className="text-sm text-slate-400">Generating AI insights for each match</p>
        </div>
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────── */
  if (createRec.isError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-lg font-semibold text-red-400">Something went wrong</p>
          <p className="text-sm text-slate-400">{String(createRec.error)}</p>
          <Button
            onClick={() => { submitted.current = false; createRec.reset(); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const result  = createRec.data;
  if (!result) return null;

  const matches: any[]   = result.matches ?? [];
  const favoriteIds      = new Set((favorites ?? []).map((f: { id: number }) => f.id));

  /* ── No matches ────────────────────────────────── */
  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-lg font-semibold text-slate-100">No matches found</p>
          <p className="text-sm text-slate-400">
            No neighbourhoods met the minimum compatibility threshold. Try adjusting your weights.
          </p>
          <Link href="/questionnaire">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Redo questionnaire</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selected             = matches[selectedIdx];
  const selectedNeighbourhood = selected?.neighborhood;

  const radarData = (selected?.dimensionBreakdown ?? []).map((d: any) => ({
    dimension: dimLabel(d.dimension),
    value:     Math.round((d.score / 5) * 100),
    fullMark:  100,
  }));

  /* ── Handlers ──────────────────────────────────── */
  const selectNeighbourhood = (idx: number) => {
    setSelectedIdx(idx);
    setFollowUpQuestion("");
    setFollowUpAnswer(null);
    setAiExpanded(false);
    askNeighbourhood.reset();
  };

  const toggleFavorite = (id: number) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Create a free account to save favourites." });
      return;
    }
    if (favoriteIds.has(id)) removeFav.mutate({ neighborhoodId: id });
    else                      addFav.mutate({ neighborhoodId: id });
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

  const handleAsk = () => {
    if (!followUpQuestion.trim() || !selectedNeighbourhood) return;
    const q = loadQuestionnaire();
    const topPriorities = q?.weights
      ? Object.entries(q.weights).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 3).map(([k]) => k)
      : undefined;
    askNeighbourhood.mutate(
      {
        slug: selectedNeighbourhood.slug,
        data: { question: followUpQuestion.trim(), compatibilityScore: selected?.compatibilityScore, topPriorities },
      },
      {
        onSuccess: (data) => { setFollowUpAnswer(data.answer); setFollowUpQuestion(""); },
      }
    );
  };

  /* ── Layout ────────────────────────────────────── */
  return (
    <div className="bg-slate-950 text-slate-100 flex flex-col lg:flex-row min-h-[calc(100vh-56px)] lg:h-[calc(100vh-56px)] lg:overflow-hidden">

      {/* ════════════════════════════════════════════════
          LEFT — Match list
      ════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[360px] shrink-0 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">Your Matches</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {matches.length} neighbourhood{matches.length !== 1 ? "s" : ""} ranked by lifestyle fit
            {result.usedDefaultWeights && (
              <span className="ml-1 text-amber-400">(default weights)</span>
            )}
          </p>
        </div>

        {/* Match list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {matches.map((match: any, i: number) => {
            const n          = match.neighborhood;
            const isSelected = i === selectedIdx;
            const isTop      = i === 0;

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.28 }}
              >
                <button
                  onClick={() => selectNeighbourhood(i)}
                  className={cn(
                    "w-full text-left rounded-xl p-3.5 border transition-all duration-200",
                    isSelected
                      ? isTop
                        ? "ring-2 ring-emerald-500 bg-slate-800 border-transparent"
                        : "ring-2 ring-slate-600 bg-slate-800 border-transparent"
                      : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-sm tabular-nums",
                          isTop ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"
                        )}>
                          #{i + 1}
                        </span>
                        {isTop && (
                          <Star className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400 shrink-0" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 truncate">{n.name}</h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{n.identity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-xl font-bold tabular-nums leading-none",
                        isTop ? "text-emerald-400" : "text-slate-300"
                      )}>
                        {match.compatibilityScore}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">match</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {match.fitLabel}
                    </span>
                    {n.downtownCommuteEstimateMins && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {n.downtownCommuteEstimateMins}m
                      </span>
                    )}
                  </div>

                  {/* Score bar */}
                  <div className="mt-2.5 h-1 rounded-full bg-slate-700/80 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isTop ? "bg-emerald-500" : "bg-slate-500/70"
                      )}
                      style={{ width: `${match.compatibilityScore}%` }}
                    />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {compareSet.length >= 2 && (
            <Link href={`/compare?slugs=${compareSet.join(",")}`}>
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors">
                <GitCompare className="h-3.5 w-3.5" />
                Compare {compareSet.length} selected
              </button>
            </Link>
          )}
          <Link href="/questionnaire">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors border border-slate-700">
              <RefreshCw className="h-3.5 w-3.5" />
              Redo questionnaire
            </button>
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          RIGHT — Deep-dive detail
      ════════════════════════════════════════════════ */}
      <div className="flex-1 bg-slate-900 flex flex-col lg:overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.26, ease: "easeInOut" }}
            className="flex flex-col flex-1"
          >
            {selectedNeighbourhood && (
              <>
                {/* ── Hero image ── */}
                <div className="relative h-52 shrink-0 overflow-hidden">
                  <img
                    src={getNeighbourhoodImage(selectedNeighbourhood.slug)}
                    alt={selectedNeighbourhood.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(15,23,42,0.95) 100%)" }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full shadow-lg",
                        selectedIdx === 0
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700/90 text-slate-200 border border-slate-600"
                      )}>
                        {selected?.compatibilityScore}% Lifestyle Fit
                      </span>
                      {selectedNeighbourhood.medianRentalEstimate && (
                        <span className="border border-white/50 text-white text-xs font-medium px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                          {getPriceRange(selectedNeighbourhood.medianRentalEstimate)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-[2rem] font-bold text-white leading-none tracking-tight drop-shadow-md">
                      {selectedNeighbourhood.name}
                    </h2>
                    {selectedNeighbourhood.downtownCommuteEstimateMins && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-slate-300 text-sm">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {selectedNeighbourhood.downtownCommuteEstimateMins} min to Downtown
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Fit label strip ── */}
                <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border",
                    fitLabelColor(selected?.fitLabel ?? "")
                  )}>
                    {selected?.fitLabel}
                  </span>
                  {selected?.affordabilityWarning && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/50 border border-amber-800 rounded-full px-2.5 py-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Rent may exceed your budget
                    </span>
                  )}
                </div>

                {/* ── AI Lifestyle Insight ── */}
                {selected?.aiSummary && !selected?.aiSummaryError && (
                  <div className="px-5 py-4 border-b border-slate-800">
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/30 border border-slate-700/60 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className={cn(
                          "h-4 w-4",
                          selectedIdx === 0 ? "text-emerald-400" : "text-slate-400"
                        )} />
                        <h3 className="text-sm font-semibold text-slate-100">Lifestyle insight</h3>
                      </div>

                      {/* Collapsed / expanded text */}
                      <div
                        style={{
                          maxHeight: aiExpanded ? "600px" : "72px",
                          transition: "max-height 0.35s ease-in-out",
                        }}
                        className="overflow-hidden"
                      >
                        <p
                          className="text-sm text-slate-300 leading-relaxed"
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
                          {selected.aiSummary}
                        </p>
                      </div>

                      {/* Expand / Hide toggle */}
                      <button
                        onClick={() => setAiExpanded((v) => !v)}
                        className="mt-2 text-xs font-medium transition-opacity hover:opacity-75"
                        style={{ color: "#00cc99", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        {aiExpanded ? "Hide" : "Expand"}
                      </button>

                      <p className="text-[10px] text-slate-500 mt-2">Scores are curated estimates, not AI-generated.</p>
                    </div>
                  </div>
                )}

                {/* ── Radar chart ── */}
                {radarData.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lifestyle Radar</h3>
                    <RadarChartComponent data={radarData} />
                  </div>
                )}

                {/* ── Follow-up Q&A ── */}
                <div className="px-5 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-100">
                      Ask about {selectedNeighbourhood.name}
                    </h3>
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
                      className="flex-1 min-w-0 text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                    />
                    <button
                      onClick={handleAsk}
                      disabled={!followUpQuestion.trim() || askNeighbourhood.isPending}
                      className="shrink-0 flex items-center justify-center w-9 h-9 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {askNeighbourhood.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <SendHorizontal className="h-4 w-4" />
                      }
                    </button>
                  </div>
                  {(followUpAnswer || askNeighbourhood.isError) && (
                    <div className="mt-3 bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                      {askNeighbourhood.isError ? (
                        <p className="text-xs text-red-400">Could not get an answer. Please try again.</p>
                      ) : (
                        <>
                          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{followUpAnswer}</p>
                          <p className="text-[10px] text-slate-500 mt-2">AI response — verify details with local sources.</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Lifestyle tags ── */}
                {selectedNeighbourhood.lifestyleTags?.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Lifestyle Tags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNeighbourhood.lifestyleTags.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Commute disclaimer ── */}
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Navigation className="h-3 w-3 shrink-0" />
                    <span>{COMMUTE_DISCLAIMER}</span>
                  </div>
                </div>

                {/* ── Action buttons ── */}
                <div className="px-5 py-4 space-y-2 bg-slate-950/30 mt-auto">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(selectedNeighbourhood.id)}
                      disabled={addFav.isPending || removeFav.isPending}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors",
                        favoriteIds.has(selectedNeighbourhood.id)
                          ? "bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60"
                          : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      )}
                    >
                      {addFav.isPending || removeFav.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : favoriteIds.has(selectedNeighbourhood.id) ? (
                        <BookmarkCheck className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                      {favoriteIds.has(selectedNeighbourhood.id) ? "Saved" : "Save"}
                    </button>
                    <button
                      onClick={() => toggleCompare(selectedNeighbourhood.slug)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors",
                        compareSet.includes(selectedNeighbourhood.slug)
                          ? "bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
                          : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      )}
                    >
                      <GitCompare className="h-4 w-4" />
                      {compareSet.includes(selectedNeighbourhood.slug) ? "In compare" : "Compare"}
                    </button>
                  </div>
                  <Link href={`/neighborhoods/${selectedNeighbourhood.slug}`}>
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
                      <ExternalLink className="h-4 w-4" />
                      View full neighbourhood profile
                    </button>
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
