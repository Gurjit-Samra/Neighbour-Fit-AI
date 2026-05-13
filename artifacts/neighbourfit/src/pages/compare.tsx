import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useCompareNeighborhoods, useListNeighborhoods } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { COMMUTE_DISCLAIMER } from "@/lib/utils";
import { GitCompare, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SCORE_DIMS = [
  { key: "affordabilityScore", label: "Affordability", emoji: "💰" },
  { key: "walkabilityScore", label: "Walkability", emoji: "🚶" },
  { key: "transitScore", label: "Transit", emoji: "🚌" },
  { key: "nightlifeScore", label: "Nightlife", emoji: "🍻" },
  { key: "safetyScore", label: "Safety", emoji: "🛡️" },
  { key: "fitnessScore", label: "Fitness", emoji: "💪" },
  { key: "petFriendlinessScore", label: "Pets", emoji: "🐾" },
] as const;

function scoreColor(score: number) {
  if (score === 5) return "text-emerald-600 font-bold";
  if (score === 4) return "text-teal-600 font-semibold";
  if (score === 3) return "text-amber-600";
  return "text-orange-500";
}

export default function Compare() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialSlugs = (params.get("slugs") ?? "").split(",").filter(Boolean).slice(0, 3);

  const { data: allNeighborhoods } = useListNeighborhoods({});
  const [slugs, setSlugs] = useState<string[]>(initialSlugs);
  const compare = useCompareNeighborhoods();

  const handleCompare = () => {
    if (slugs.length < 2) return;
    compare.mutate({ slugs });
  };

  useEffect(() => {
    if (initialSlugs.length >= 2) compare.mutate({ slugs: initialSlugs });
  }, []);

  const addSlug = (slug: string) => {
    if (slugs.includes(slug) || slugs.length >= 3) return;
    setSlugs([...slugs, slug]);
  };

  const removeSlug = (slug: string) => setSlugs(slugs.filter((s) => s !== slug));

  const results = compare.data as Array<any> | undefined;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitCompare className="h-7 w-7 text-primary" />
            Compare neighbourhoods
          </h1>
          <p className="text-muted-foreground mt-1">Choose 2–3 neighbourhoods to compare side-by-side.</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Selected chips */}
              <div className="flex gap-2 flex-wrap">
                {slugs.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 px-3 py-1.5 text-sm capitalize">
                    {s.replace(/-/g, " ")}
                    <button onClick={() => removeSlug(s)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add picker */}
              {slugs.length < 3 && (
                <Select onValueChange={addSlug} value="">
                  <SelectTrigger className="w-52">
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

              <Button
                disabled={slugs.length < 2 || compare.isPending}
                onClick={handleCompare}
                className="gap-2"
                data-testid="btn-compare-run"
              >
                {compare.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
                Compare
              </Button>
            </div>
          </CardContent>
        </Card>

        {compare.isPending && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {results && results.length >= 2 && (
          <div className="space-y-8">
            {/* Score grid */}
            <Card>
              <CardHeader>
                <CardTitle>Score breakdown</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Dimension</th>
                      {results.map((r) => (
                        <th key={r.neighborhood.slug} className="text-center py-2 px-3 font-bold">
                          {r.neighborhood.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SCORE_DIMS.map((d) => {
                      const scores = results.map((r) => (r.neighborhood as any)[d.key] as number);
                      const maxScore = Math.max(...scores);
                      return (
                        <tr key={d.key} className="border-t border-border">
                          <td className="py-2.5 pr-4 text-muted-foreground">
                            {d.emoji} {d.label}
                          </td>
                          {results.map((r, i) => {
                            const score = (r.neighborhood as any)[d.key] as number;
                            return (
                              <td key={r.neighborhood.slug} className={cn("text-center py-2.5 px-3", scoreColor(score))}>
                                {score}/5 {score === maxScore && scores.filter((s) => s === maxScore).length === 1 && "★"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {/* Quick facts rows */}
                    <tr className="border-t-2 border-border">
                      <td className="py-2.5 pr-4 text-muted-foreground">Est. rent</td>
                      {results.map((r) => (
                        <td key={r.neighborhood.slug} className="text-center py-2.5 px-3">
                          {r.neighborhood.medianRentalEstimate ? `~$${r.neighborhood.medianRentalEstimate.toLocaleString()}` : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-border">
                      <td className="py-2.5 pr-4 text-muted-foreground">Downtown commute *</td>
                      {results.map((r) => (
                        <td key={r.neighborhood.slug} className="text-center py-2.5 px-3">
                          {r.neighborhood.downtownCommuteEstimateMins ? `~${r.neighborhood.downtownCommuteEstimateMins} min` : "—"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />{COMMUTE_DISCLAIMER}
                </p>
              </CardContent>
            </Card>

            {/* Strengths & tradeoffs */}
            <div className={cn("grid gap-4", results.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {results.map((r) => (
                <Card key={r.neighborhood.slug}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{r.neighborhood.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{r.neighborhood.identity}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 mb-1">Strengths</p>
                      <ul className="text-xs space-y-0.5">
                        {r.strengths.map((s: string) => (
                          <li key={s} className="text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-1">Tradeoffs</p>
                      <ul className="text-xs space-y-0.5">
                        {r.tradeoffs.map((t: string) => (
                          <li key={t} className="text-muted-foreground">• {t}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {slugs.length < 2 && (
          <div className="text-center py-20 text-muted-foreground">
            Add at least 2 neighbourhoods to compare.
          </div>
        )}
      </div>
    </div>
  );
}
