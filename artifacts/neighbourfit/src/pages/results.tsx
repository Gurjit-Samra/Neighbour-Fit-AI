import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { useCreateRecommendation, useAddFavorite, useRemoveFavorite, useListFavorites, useGetMe } from "@workspace/api-client-react";
import { loadQuestionnaire } from "@/lib/questionnaire-store";
import { RadarChartComponent } from "@/components/neighborhood/RadarChart";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  GitCompare,
  Star,
  Heart,
  MapPin,
  Clock,
  RefreshCw,
  Navigation,
  TrendingUp,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { COMMUTE_DISCLAIMER } from "@/lib/utils";

// Approximate Calgary neighbourhood coordinates (lng, lat) → normalised to SVG %
// Bounding box: lng -114.145 to -113.99, lat 50.955 to 51.082
const LNG_MIN = -114.145;
const LNG_RANGE = 0.155;
const LAT_MAX = 51.082;
const LAT_RANGE = 0.127;

function toSvgPct(lng: number, lat: number) {
  const x = ((lng - LNG_MIN) / LNG_RANGE) * 100;
  const y = ((LAT_MAX - lat) / LAT_RANGE) * 100;
  return { x, y };
}

const NEIGHBOURHOOD_PINS: Array<{ slug: string; name: string; lng: number; lat: number }> = [
  { slug: "beltline", name: "Beltline", lng: -114.0719, lat: 51.0386 },
  { slug: "kensington", name: "Kensington", lng: -114.0856, lat: 51.0535 },
  { slug: "mission", name: "Mission", lng: -114.0808, lat: 51.0314 },
  { slug: "inglewood", name: "Inglewood", lng: -114.0383, lat: 51.0403 },
  { slug: "bridgeland", name: "Bridgeland", lng: -114.0583, lat: 51.0597 },
  { slug: "east-village", name: "East Village", lng: -114.0550, lat: 51.0450 },
  { slug: "marda-loop", name: "Marda Loop", lng: -114.0950, lat: 51.0280 },
  { slug: "sunnyside", name: "Sunnyside", lng: -114.0828, lat: 51.0542 },
  { slug: "university-district", name: "University District", lng: -114.1280, lat: 51.0745 },
  { slug: "seton", name: "Seton", lng: -113.9980, lat: 50.9615 },
];

function fitLabelColor(label: string) {
  if (label.startsWith("Excellent")) return "text-emerald-400 bg-emerald-950/60 border-emerald-700";
  if (label.startsWith("Strong")) return "text-teal-400 bg-teal-950/60 border-teal-700";
  if (label.startsWith("Moderate")) return "text-amber-400 bg-amber-950/60 border-amber-700";
  return "text-orange-400 bg-orange-950/60 border-orange-700";
}

function dimLabel(dim: string) {
  const map: Record<string, string> = {
    affordability: "Affordability",
    walkability: "Walkability",
    transit: "Transit",
    nightlife: "Nightlife",
    safety: "Safety",
    fitness: "Fitness",
    petFriendliness: "Pet-Friendly",
  };
  return map[dim] ?? dim;
}

function dimColor(dim: string) {
  const map: Record<string, string> = {
    affordability: "bg-emerald-500",
    walkability: "bg-teal-500",
    transit: "bg-blue-500",
    nightlife: "bg-purple-500",
    safety: "bg-cyan-500",
    fitness: "bg-red-500",
    petFriendliness: "bg-amber-500",
  };
  return map[dim] ?? "bg-slate-500";
}

export default function Results() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const { data: favorites } = useListFavorites({ query: { enabled: !!user } });
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const createRec = useCreateRecommendation();
  const [compareSet, setCompareSet] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-teal-400 mx-auto" />
          <p className="text-lg font-semibold text-slate-100">Analysing your lifestyle priorities…</p>
          <p className="text-sm text-slate-400">Generating AI insights for each match</p>
        </div>
      </div>
    );
  }

  if (createRec.isError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-lg font-semibold text-red-400">Something went wrong</p>
          <p className="text-sm text-slate-400">{String(createRec.error)}</p>
          <Button
            onClick={() => { submitted.current = false; createRec.reset(); }}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const result = createRec.data;
  if (!result) return null;

  const matches: any[] = result.matches ?? [];
  const favoriteIds = new Set((favorites ?? []).map((f: { id: number }) => f.id));

  const toggleFavorite = (id: number) => {
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

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-lg font-semibold text-slate-100">No matches found</p>
          <p className="text-sm text-slate-400">No neighbourhoods met the minimum compatibility threshold. Try adjusting your weights.</p>
          <Link href="/questionnaire">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">Redo questionnaire</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selected = matches[selectedIdx];
  const selectedNeighbourhood = selected?.neighborhood;

  // Build radar chart data from dimension breakdown (score is 1-5 → convert to 0-100)
  const radarData = (selected?.dimensionBreakdown ?? []).map((d: any) => ({
    dimension: dimLabel(d.dimension),
    value: Math.round((d.score / 5) * 100),
    fullMark: 100,
  }));

  return (
    <div className="bg-slate-900 text-slate-100 flex flex-col lg:flex-row lg:h-[calc(100vh-56px)] lg:overflow-hidden min-h-[calc(100vh-56px)]">

      {/* ─── LEFT SIDEBAR: Match list ───────────────────────────── */}
      <div className="w-full lg:w-[25vw] lg:min-w-[280px] bg-slate-800/90 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-slate-700 flex flex-col">

        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-slate-700">
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
            const n = match.neighborhood;
            const isSelected = i === selectedIdx;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
              >
                <button
                  onClick={() => setSelectedIdx(i)}
                  className={cn(
                    "w-full text-left rounded-lg p-3 border transition-all duration-200",
                    isSelected
                      ? "ring-2 ring-teal-500 bg-slate-700 border-transparent"
                      : "bg-slate-800/50 border-slate-700 hover:bg-slate-700/60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-sm",
                          i === 0 ? "bg-red-500 text-white" : "bg-teal-600 text-white"
                        )}>
                          #{i + 1}
                        </span>
                        {i === 0 && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 truncate">{n.name}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-lg font-bold",
                        i === 0 ? "text-red-400" : "text-teal-400"
                      )}>
                        {match.compatibilityScore}%
                      </div>
                      <div className="text-[10px] text-slate-400">match</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
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
                  {/* Mini score bar */}
                  <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", i === 0 ? "bg-red-500" : "bg-teal-500")}
                      style={{ width: `${match.compatibilityScore}%` }}
                    />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar footer actions */}
        <div className="p-3 border-t border-slate-700 space-y-2">
          {compareSet.length >= 2 && (
            <Link href={`/compare?slugs=${compareSet.join(",")}`}>
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors">
                <GitCompare className="h-3.5 w-3.5" />
                Compare {compareSet.length} selected
              </button>
            </Link>
          )}
          <Link href="/questionnaire">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              Redo questionnaire
            </button>
          </Link>
        </div>
      </div>

      {/* ─── CENTER: Calgary map visualization ──────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col relative bg-slate-900 overflow-hidden">

        {/* SVG city grid map */}
        <div className="flex-1 relative">
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern id="citygrid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#1e293b" strokeWidth="0.3" />
              </pattern>
              <radialGradient id="glow-teal" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="glow-red" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background */}
            <rect width="100" height="100" fill="#0f172a" />
            <rect width="100" height="100" fill="url(#citygrid)" />

            {/* Bow River (approximate path through city) */}
            <path
              d="M 0,42 Q 15,38 28,40 Q 40,43 52,41 Q 62,39 72,43 Q 85,47 100,44"
              fill="none" stroke="#1d4ed8" strokeWidth="1.8" opacity="0.45"
            />
            {/* Elbow River */}
            <path
              d="M 42,100 Q 43,80 45,70 Q 47,60 44,55 Q 41,50 43,43"
              fill="none" stroke="#1d4ed8" strokeWidth="1.2" opacity="0.3"
            />

            {/* Major roads */}
            <line x1="48" y1="0" x2="48" y2="100" stroke="#1e3a5f" strokeWidth="0.8" />
            <line x1="0" y1="48" x2="100" y2="48" stroke="#1e3a5f" strokeWidth="0.8" />
            <line x1="0" y1="30" x2="100" y2="30" stroke="#1e293b" strokeWidth="0.5" />
            <line x1="0" y1="65" x2="100" y2="65" stroke="#1e293b" strokeWidth="0.5" />
            <line x1="30" y1="0" x2="30" y2="100" stroke="#1e293b" strokeWidth="0.5" />
            <line x1="68" y1="0" x2="68" y2="100" stroke="#1e293b" strokeWidth="0.5" />

            {/* Downtown core indicator */}
            <rect x="44" y="36" width="8" height="8" fill="#1e293b" stroke="#334155" strokeWidth="0.4" rx="0.5" />
            <text x="48" y="41.5" fontSize="2" fill="#64748b" textAnchor="middle" dominantBaseline="middle">DT</text>

            {/* Neighbourhood pins */}
            {NEIGHBOURHOOD_PINS.map((pin) => {
              const { x, y } = toSvgPct(pin.lng, pin.lat);
              const matchIdx = matches.findIndex((m: any) => m.neighborhood.slug === pin.slug);
              if (matchIdx === -1) return null;
              const isSelected = matchIdx === selectedIdx;
              const isTop = matchIdx === 0;
              const pinColor = isTop ? "#ef4444" : "#14b8a6";
              const score = matches[matchIdx].compatibilityScore;

              return (
                <g
                  key={pin.slug}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedIdx(matchIdx)}
                >
                  {/* Glow ring when selected */}
                  {isSelected && (
                    <circle cx={x} cy={y} r="8" fill={`url(#${isTop ? "glow-red" : "glow-teal"})`} />
                  )}
                  {/* Outer ring */}
                  {isSelected && (
                    <circle cx={x} cy={y} r="5" fill="none" stroke={pinColor} strokeWidth="0.6" opacity="0.7" />
                  )}
                  {/* Pin circle */}
                  <circle cx={x} cy={y} r={isSelected ? 3.5 : 2.5} fill={pinColor} stroke="white" strokeWidth="0.5" />
                  {/* Rank label inside pin */}
                  <text x={x} y={y} fontSize="2.2" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                    {matchIdx + 1}
                  </text>
                  {/* Name label */}
                  <text
                    x={x + 4}
                    y={y}
                    fontSize={isSelected ? "3" : "2.5"}
                    fill={isSelected ? "#e2e8f0" : "#94a3b8"}
                    dominantBaseline="middle"
                    fontWeight={isSelected ? "600" : "400"}
                  >
                    {pin.name}
                  </text>
                  {/* Score badge when selected */}
                  {isSelected && (
                    <text x={x + 4} y={y + 3.5} fontSize="2.2" fill={isTop ? "#f87171" : "#2dd4bf"} dominantBaseline="middle">
                      {score}% match
                    </text>
                  )}
                </g>
              );
            })}

            {/* Legend */}
            <g transform="translate(2, 88)">
              <circle cx="2" cy="2" r="1.5" fill="#ef4444" stroke="white" strokeWidth="0.3" />
              <text x="5" y="2" fontSize="2.2" fill="#94a3b8" dominantBaseline="middle">#1 Match</text>
              <circle cx="2" cy="6" r="1.5" fill="#14b8a6" stroke="white" strokeWidth="0.3" />
              <text x="5" y="6" fontSize="2.2" fill="#94a3b8" dominantBaseline="middle">Other matches</text>
            </g>

            {/* Compass rose */}
            <g transform="translate(91, 4)">
              <text x="3" y="1" fontSize="2.5" fill="#475569" textAnchor="middle">N</text>
              <line x1="3" y1="2" x2="3" y2="7" stroke="#475569" strokeWidth="0.5" />
              <polygon points="3,2 2,4 4,4" fill="#475569" />
            </g>
          </svg>

          {/* Map overlay: selected neighbourhood pill */}
          {selectedNeighbourhood && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 shadow-lg">
                <div className={cn("w-2 h-2 rounded-full", selectedIdx === 0 ? "bg-red-500" : "bg-teal-500")} />
                <span className="text-sm font-semibold text-slate-100">{selectedNeighbourhood.name}</span>
                <span className={cn(
                  "text-xs font-bold",
                  selectedIdx === 0 ? "text-red-400" : "text-teal-400"
                )}>
                  {selected?.compatibilityScore}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Map footer: commute disclaimer */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm border-t border-slate-700 px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Navigation className="h-3 w-3 shrink-0" />
            <span>{COMMUTE_DISCLAIMER}</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDEBAR: Deep dive ───────────────────────────── */}
      <div className="w-full lg:w-[35vw] lg:min-w-[320px] bg-slate-800 border-t lg:border-t-0 lg:border-l border-slate-700 flex flex-col lg:overflow-y-auto">

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIdx}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="flex flex-col h-full"
          >
            {selectedNeighbourhood && (
              <>
                {/* Header */}
                <div className="px-5 py-5 border-b border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-sm",
                          selectedIdx === 0 ? "bg-red-500 text-white" : "bg-teal-600 text-white"
                        )}>
                          #{selectedIdx + 1} MATCH
                        </span>
                        {selectedIdx === 0 && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-100">{selectedNeighbourhood.name}</h2>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-3xl font-black",
                        selectedIdx === 0 ? "text-red-400" : "text-teal-400"
                      )}>
                        {selected?.compatibilityScore}%
                      </div>
                      <div className="text-xs text-slate-400">lifestyle fit</div>
                    </div>
                  </div>

                  {/* Fit label */}
                  <span className={cn(
                    "inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border",
                    fitLabelColor(selected?.fitLabel ?? "")
                  )}>
                    {selected?.fitLabel}
                  </span>

                  {/* Meta info row */}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
                    {selectedNeighbourhood.downtownCommuteEstimateMins && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {selectedNeighbourhood.downtownCommuteEstimateMins} min to Downtown
                      </span>
                    )}
                    {selectedNeighbourhood.medianRentalEstimate && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        ~${selectedNeighbourhood.medianRentalEstimate.toLocaleString()}/mo median
                      </span>
                    )}
                  </div>

                  {selected?.affordabilityWarning && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-950/50 border border-amber-800 rounded-lg px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Median rent may exceed your budget
                    </div>
                  )}
                </div>

                {/* Scores overview: 3-column grid */}
                {selected?.dimensionBreakdown?.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-700">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Score Overview</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {(selected.dimensionBreakdown as any[]).slice(0, 6).map((d: any) => (
                        <div key={d.dimension} className="text-center p-2.5 bg-slate-700/50 rounded-lg">
                          <div className="text-lg font-bold text-teal-400 tabular-nums">
                            {Math.round((d.score / 5) * 100)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{dimLabel(d.dimension)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Radar chart */}
                {radarData.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-700">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lifestyle Radar</h3>
                    <RadarChartComponent data={radarData} />
                  </div>
                )}

                {/* Dimension breakdown bars */}
                {selected?.dimensionBreakdown?.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-700">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Dimension Breakdown</h3>
                    <div className="space-y-2.5">
                      {(selected.dimensionBreakdown as any[]).map((d: any) => {
                        const pct = Math.round((d.score / 5) * 100);
                        return (
                          <div key={d.dimension}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-300">{dimLabel(d.dimension)}</span>
                              <span className="text-slate-400 tabular-nums">{pct}/100</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", dimColor(d.dimension))}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI narrative */}
                {selected?.aiSummary && !selected?.aiSummaryError && (
                  <div className="px-5 py-4 border-b border-slate-700">
                    <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/30 border border-slate-600 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-teal-400" />
                        <h3 className="text-sm font-semibold text-slate-100">AI Lifestyle Fit Analysis</h3>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{selected.aiSummary}</p>
                      <p className="text-[10px] text-slate-500 mt-2">Scores are curated MVP estimates, not AI-generated.</p>
                    </div>
                  </div>
                )}

                {/* Lifestyle tags */}
                {selectedNeighbourhood.lifestyleTags?.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-700">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lifestyle Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNeighbourhood.lifestyleTags.map((tag: string) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full border border-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commute disclaimer (mobile only — desktop shows in map footer) */}
                <div className="lg:hidden px-5 py-3 border-b border-slate-700 bg-slate-900/50">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Navigation className="h-3 w-3 shrink-0" />
                    <span>{COMMUTE_DISCLAIMER}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-5 py-4 space-y-2 bg-slate-900/30">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(selectedNeighbourhood.id)}
                      disabled={addFav.isPending || removeFav.isPending}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors",
                        favoriteIds.has(selectedNeighbourhood.id)
                          ? "bg-red-950/60 border-red-700 text-red-300 hover:bg-red-900/60"
                          : "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", favoriteIds.has(selectedNeighbourhood.id) && "fill-red-400 text-red-400")} />
                      {favoriteIds.has(selectedNeighbourhood.id) ? "Saved" : "Save"}
                    </button>
                    <button
                      onClick={() => toggleCompare(selectedNeighbourhood.slug)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors",
                        compareSet.includes(selectedNeighbourhood.slug)
                          ? "bg-teal-950/60 border-teal-700 text-teal-300 hover:bg-teal-900/60"
                          : "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                      )}
                    >
                      <GitCompare className="h-4 w-4" />
                      {compareSet.includes(selectedNeighbourhood.slug) ? "In compare" : "Compare"}
                    </button>
                  </div>
                  <Link href={`/neighborhoods/${selectedNeighbourhood.slug}`}>
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors">
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
