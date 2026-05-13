import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCompareNeighborhoods,
  useListNeighborhoods,
  useAskNeighbourhood,
  useCompareNeighbourhoodsSummary,
} from "@workspace/api-client-react";
import { RadarChartComponent } from "@/components/neighborhood/RadarChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { COMMUTE_DISCLAIMER } from "@/lib/utils";
import {
  GitCompare,
  Info,
  Loader2,
  X,
  MapPin,
  Clock,
  Sparkles,
  MessageCircle,
  SendHorizontal,
  Navigation,
  Star,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SCORE_DIMS = [
  { key: "affordabilityScore" as const, label: "Affordability", dim: "affordability", color: "bg-emerald-500" },
  { key: "walkabilityScore" as const, label: "Walkability", dim: "walkability", color: "bg-teal-500" },
  { key: "transitScore" as const, label: "Transit", dim: "transit", color: "bg-blue-500" },
  { key: "nightlifeScore" as const, label: "Nightlife", dim: "nightlife", color: "bg-purple-500" },
  { key: "safetyScore" as const, label: "Safety", dim: "safety", color: "bg-cyan-500" },
  { key: "fitnessScore" as const, label: "Fitness", dim: "fitness", color: "bg-red-500" },
  { key: "petFriendlinessScore" as const, label: "Pet-Friendly", dim: "petFriendliness", color: "bg-amber-500" },
] as const;

const TAB_COLORS = [
  { active: "bg-teal-600 text-white", score: "text-teal-400", bar: "bg-teal-500", ring: "ring-teal-500" },
  { active: "bg-purple-600 text-white", score: "text-purple-400", bar: "bg-purple-500", ring: "ring-purple-500" },
  { active: "bg-amber-600 text-white", score: "text-amber-400", bar: "bg-amber-500", ring: "ring-amber-500" },
];

function scoreBar(score: number) {
  if (score === 5) return "text-emerald-400";
  if (score === 4) return "text-teal-400";
  if (score === 3) return "text-amber-400";
  return "text-orange-400";
}

export default function Compare() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialSlugs = (params.get("slugs") ?? "").split(",").filter(Boolean).slice(0, 3);

  const { data: allNeighborhoods } = useListNeighborhoods({});
  const [slugs, setSlugs] = useState<string[]>(initialSlugs);
  const [selectedTab, setSelectedTab] = useState(0);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);

  const compare = useCompareNeighborhoods();
  const aiOverview = useCompareNeighbourhoodsSummary();
  const askNeighbourhood = useAskNeighbourhood();

  const runCompare = (s: string[]) => {
    if (s.length < 2) return;
    compare.mutate({ data: { slugs: s } });
    aiOverview.mutate({ data: { slugs: s } });
  };

  useEffect(() => {
    if (initialSlugs.length >= 2) runCompare(initialSlugs);
  }, []);

  const addSlug = (slug: string) => {
    if (slugs.includes(slug) || slugs.length >= 3) return;
    setSlugs([...slugs, slug]);
  };

  const removeSlug = (slug: string) => {
    setSlugs(slugs.filter((s) => s !== slug));
  };

  const results = compare.data as Array<any> | undefined;
  const selectedResult = results?.[selectedTab] ?? results?.[0];
  const selectedN = selectedResult?.neighborhood;

  const switchTab = (idx: number) => {
    setSelectedTab(idx);
    setFollowUpQuestion("");
    setFollowUpAnswer(null);
    askNeighbourhood.reset();
  };

  const handleAsk = () => {
    if (!followUpQuestion.trim() || !selectedN) return;
    askNeighbourhood.mutate(
      {
        slug: selectedN.slug,
        data: { question: followUpQuestion.trim() },
      },
      {
        onSuccess: (data) => {
          setFollowUpAnswer(data.answer);
          setFollowUpQuestion("");
        },
      }
    );
  };

  // Build radar data for the selected neighbourhood
  const radarData = selectedN
    ? SCORE_DIMS.map((d) => ({
        dimension: d.label,
        value: Math.round(((selectedN[d.key] as number) / 5) * 100),
        fullMark: 100,
      }))
    : [];

  const tabColor = TAB_COLORS[selectedTab % TAB_COLORS.length];

  return (
    <div className="bg-slate-900 text-slate-100 flex flex-col min-h-[calc(100vh-56px)]">

      {/* ─── TOP SELECTOR BAR ─────────────────────────────── */}
      <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-4 py-3">
        <div className="max-w-screen-2xl mx-auto flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 shrink-0">
            <GitCompare className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-semibold text-slate-200">Compare</span>
          </div>

          {/* Selected chips */}
          <div className="flex gap-2 flex-wrap">
            {slugs.map((s, i) => {
              const col = TAB_COLORS[i % TAB_COLORS.length];
              return (
                <Badge
                  key={s}
                  className={cn(
                    "gap-1 px-3 py-1.5 text-sm capitalize border-0",
                    results && selectedTab === i ? col.active : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  )}
                >
                  {s.replace(/-/g, " ")}
                  <button
                    onClick={() => removeSlug(s)}
                    className="ml-1 opacity-70 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>

          {/* Add picker */}
          {slugs.length < 3 && (
            <Select onValueChange={addSlug} value="">
              <SelectTrigger className="w-48 h-8 text-xs bg-slate-700 border-slate-600 text-slate-200">
                <SelectValue placeholder="Add neighbourhood…" />
              </SelectTrigger>
              <SelectContent>
                {(allNeighborhoods ?? [])
                  .filter((n: any) => !slugs.includes(n.slug))
                  .map((n: any) => (
                    <SelectItem key={n.slug} value={n.slug}>{n.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          <button
            disabled={slugs.length < 2 || compare.isPending}
            onClick={() => runCompare(slugs)}
            className="flex items-center gap-2 px-4 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {compare.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCompare className="h-3.5 w-3.5" />}
            Compare
          </button>
        </div>
      </div>

      {/* ─── EMPTY STATE ───────────────────────────────────── */}
      {slugs.length < 2 && !results && (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Add at least 2 neighbourhoods to compare.
        </div>
      )}

      {/* ─── LOADING ───────────────────────────────────────── */}
      {compare.isPending && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400 mx-auto" />
            <p className="text-sm text-slate-400">Loading comparison…</p>
          </div>
        </div>
      )}

      {/* ─── SPLIT-SCREEN CONTENT ──────────────────────────── */}
      {results && results.length >= 2 && (
        <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">

          {/* ══ LEFT PANEL: Detail view ═══════════════════════ */}
          <div className="w-full lg:w-[42%] lg:min-w-[340px] bg-slate-800 border-b lg:border-b-0 lg:border-r border-slate-700 flex flex-col lg:overflow-y-auto">

            {/* Tab selector */}
            <div className="px-4 pt-4 pb-0 border-b border-slate-700">
              <div className="flex gap-1 mb-3">
                {results.map((r: any, i: number) => {
                  const col = TAB_COLORS[i % TAB_COLORS.length];
                  const isActive = selectedTab === i;
                  return (
                    <button
                      key={r.neighborhood.slug}
                      onClick={() => switchTab(i)}
                      className={cn(
                        "flex-1 text-xs font-semibold px-2 py-2 rounded-t-lg border-b-2 transition-all",
                        isActive
                          ? `${col.active} border-current`
                          : "bg-slate-700/50 text-slate-400 border-transparent hover:bg-slate-700 hover:text-slate-200"
                      )}
                    >
                      {r.neighborhood.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {selectedN && (
                  <>
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
                      <h2 className="text-2xl font-bold text-slate-100 mb-1">{selectedN.name}</h2>
                      {selectedN.identity && (
                        <p className="text-sm text-slate-400">{selectedN.identity}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
                        {selectedN.downtownCommuteEstimateMins && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {selectedN.downtownCommuteEstimateMins} min to Downtown
                          </span>
                        )}
                        {selectedN.medianRentalEstimate && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            ~${selectedN.medianRentalEstimate.toLocaleString()}/mo median rent
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Scores overview grid */}
                    <div className="px-5 py-4 border-b border-slate-700">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Score Overview</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {SCORE_DIMS.map((d) => {
                          const score = selectedN[d.key] as number;
                          return (
                            <div key={d.key} className="text-center p-2 bg-slate-700/50 rounded-lg">
                              <div className={cn("text-lg font-bold tabular-nums", scoreBar(score))}>
                                {score}/5
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{d.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Radar chart */}
                    {radarData.length > 0 && (
                      <div className="px-5 py-4 border-b border-slate-700">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lifestyle Radar</h3>
                        <RadarChartComponent data={radarData} />
                      </div>
                    )}

                    {/* Dimension bars */}
                    <div className="px-5 py-4 border-b border-slate-700">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Dimension Breakdown</h3>
                      <div className="space-y-2.5">
                        {SCORE_DIMS.map((d) => {
                          const score = selectedN[d.key] as number;
                          const pct = Math.round((score / 5) * 100);
                          return (
                            <div key={d.key}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-300">{d.label}</span>
                                <span className="text-slate-400 tabular-nums">{pct}/100</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", d.color)}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Strengths & Tradeoffs */}
                    <div className="px-5 py-4 border-b border-slate-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Strengths
                          </p>
                          <ul className="text-xs space-y-1">
                            {selectedResult.strengths.map((s: string) => (
                              <li key={s} className="text-slate-300 flex gap-1">
                                <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Tradeoffs
                          </p>
                          <ul className="text-xs space-y-1">
                            {selectedResult.tradeoffs.map((t: string) => (
                              <li key={t} className="text-slate-300 flex gap-1">
                                <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Lifestyle tags */}
                    {selectedN.lifestyleTags?.length > 0 && (
                      <div className="px-5 py-4 border-b border-slate-700">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lifestyle Tags</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedN.lifestyleTags.map((tag: string) => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full border border-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Q&A */}
                    <div className="px-5 py-4 border-b border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="h-4 w-4 text-teal-400" />
                        <h3 className="text-sm font-semibold text-slate-100">Ask about {selectedN.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={followUpQuestion}
                          onChange={(e) => setFollowUpQuestion(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !askNeighbourhood.isPending) handleAsk(); }}
                          placeholder="e.g. Is it good for families?"
                          disabled={askNeighbourhood.isPending}
                          className="flex-1 min-w-0 text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50"
                        />
                        <button
                          onClick={handleAsk}
                          disabled={!followUpQuestion.trim() || askNeighbourhood.isPending}
                          className="shrink-0 flex items-center justify-center w-9 h-9 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                          {askNeighbourhood.isPending
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <SendHorizontal className="h-4 w-4" />}
                        </button>
                      </div>
                      {(followUpAnswer || askNeighbourhood.isError) && (
                        <div className="mt-3 bg-slate-700/50 border border-slate-600 rounded-lg p-3">
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

                    {/* Commute disclaimer */}
                    <div className="px-5 py-3 bg-slate-900/40">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Navigation className="h-3 w-3 shrink-0" />
                        <span>{COMMUTE_DISCLAIMER}</span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ══ RIGHT PANEL: Comparison view ══════════════════ */}
          <div className="w-full lg:flex-1 bg-slate-900 flex flex-col lg:overflow-y-auto">

            {/* AI Comparison Overview */}
            <div className="px-5 py-5 border-b border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-100">AI Comparison Overview</h3>
              </div>
              {aiOverview.isPending && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
                  Generating overview…
                </div>
              )}
              {aiOverview.data?.overview && !aiOverview.isPending && (
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/40 border border-slate-600 rounded-xl p-4">
                  <p className="text-sm text-slate-200 leading-relaxed">{aiOverview.data.overview}</p>
                  <p className="text-[10px] text-slate-500 mt-2">AI-generated overview — scores are curated estimates, not AI-generated.</p>
                </div>
              )}
              {aiOverview.isError && !aiOverview.isPending && (
                <p className="text-xs text-slate-500 italic">Overview unavailable — AI service error.</p>
              )}
            </div>

            {/* Score comparison table */}
            <div className="px-5 py-5 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-slate-100 mb-4">Score Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-6 text-xs text-slate-400 font-medium uppercase tracking-wider">Dimension</th>
                      {results.map((r: any, i: number) => {
                        const col = TAB_COLORS[i % TAB_COLORS.length];
                        return (
                          <th key={r.neighborhood.slug} className="text-center py-2 px-3">
                            <button
                              onClick={() => switchTab(i)}
                              className={cn(
                                "text-xs font-bold px-2.5 py-1 rounded-full transition-colors",
                                selectedTab === i ? col.active : "text-slate-300 hover:text-slate-100"
                              )}
                            >
                              {r.neighborhood.name}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {SCORE_DIMS.map((d) => {
                      const scores = results.map((r: any) => (r.neighborhood as any)[d.key] as number);
                      const maxScore = Math.max(...scores);
                      return (
                        <tr key={d.key} className="border-t border-slate-700/60">
                          <td className="py-3 pr-6">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full shrink-0", d.color)} />
                              <span className="text-xs text-slate-300">{d.label}</span>
                            </div>
                          </td>
                          {results.map((r: any, i: number) => {
                            const score = (r.neighborhood as any)[d.key] as number;
                            const isWinner = score === maxScore && scores.filter((s) => s === maxScore).length === 1;
                            const pct = Math.round((score / 5) * 100);
                            return (
                              <td key={r.neighborhood.slug} className="py-3 px-3">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={cn(
                                    "text-sm font-bold tabular-nums",
                                    isWinner ? scoreBar(score) : "text-slate-400"
                                  )}>
                                    {score}/5 {isWinner && <Star className="inline h-3 w-3 fill-current mb-0.5" />}
                                  </span>
                                  <div className="w-full h-1 rounded-full bg-slate-700 overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full", isWinner ? d.color : "bg-slate-600")}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Quick facts */}
                    <tr className="border-t-2 border-slate-600">
                      <td className="py-3 pr-6 text-xs text-slate-400">Est. rent</td>
                      {results.map((r: any) => (
                        <td key={r.neighborhood.slug} className="text-center py-3 px-3 text-xs text-slate-300">
                          {r.neighborhood.medianRentalEstimate
                            ? `~$${r.neighborhood.medianRentalEstimate.toLocaleString()}`
                            : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-slate-700/60">
                      <td className="py-3 pr-6 text-xs text-slate-400">Downtown commute</td>
                      {results.map((r: any) => (
                        <td key={r.neighborhood.slug} className="text-center py-3 px-3 text-xs text-slate-300">
                          {r.neighborhood.downtownCommuteEstimateMins
                            ? `~${r.neighborhood.downtownCommuteEstimateMins} min`
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-slate-500 mt-3 flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  {COMMUTE_DISCLAIMER}
                </p>
              </div>
            </div>

            {/* Per-neighbourhood summary cards */}
            <div className="px-5 py-5">
              <h3 className="text-sm font-semibold text-slate-100 mb-4">Neighbourhood Profiles</h3>
              <div className={cn("grid gap-4", results.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3")}>
                {results.map((r: any, i: number) => {
                  const col = TAB_COLORS[i % TAB_COLORS.length];
                  return (
                    <div
                      key={r.neighborhood.slug}
                      className={cn(
                        "bg-slate-800/80 border rounded-xl p-4 cursor-pointer transition-all",
                        selectedTab === i
                          ? `border-slate-500 ring-2 ${col.ring}`
                          : "border-slate-700 hover:border-slate-600"
                      )}
                      onClick={() => switchTab(i)}
                    >
                      <div className="mb-3">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-sm",
                          col.active
                        )}>
                          {r.neighborhood.name}
                        </span>
                      </div>
                      {r.neighborhood.identity && (
                        <p className="text-xs text-slate-400 mb-3 leading-snug">{r.neighborhood.identity}</p>
                      )}
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-400 mb-1.5">Strengths</p>
                        <ul className="text-xs space-y-0.5 mb-3">
                          {r.strengths.slice(0, 3).map((s: string) => (
                            <li key={s} className="text-slate-300 flex gap-1">
                              <span className="text-emerald-500 shrink-0">•</span>{s}
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] font-semibold text-amber-400 mb-1.5">Tradeoffs</p>
                        <ul className="text-xs space-y-0.5">
                          {r.tradeoffs.slice(0, 3).map((t: string) => (
                            <li key={t} className="text-slate-300 flex gap-1">
                              <span className="text-amber-500 shrink-0">•</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
