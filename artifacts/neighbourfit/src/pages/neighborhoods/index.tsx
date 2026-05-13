import { useListNeighborhoods as useGetNeighborhoods } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/neighborhood/ScoreBar";
import { Link } from "wouter";
import { useState } from "react";
import { getDensityLabel } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";

export default function NeighborhoodsIndex() {
  const { data: neighborhoods, isLoading } = useGetNeighborhoods();
  const [search, setSearch] = useState("");

  const filtered = (neighborhoods ?? []).filter((n: any) =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.identity.toLowerCase().includes(search.toLowerCase()) ||
    (n.lifestyleTags ?? []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Calgary Neighbourhoods</h1>
          <p className="text-muted-foreground">All 10 communities scored across 7 lifestyle dimensions.</p>
        </div>

        <div className="mb-8 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, vibe, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="search-neighborhoods"
            className="w-full pl-9 pr-4 py-2 bg-card border border-card-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((n: any) => (
              <Link key={n.slug} href={`/neighborhoods/${n.slug}`}>
                <div className="bg-card border border-card-border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-base text-foreground">{n.name}</h3>
                    <Badge variant="outline" className="text-xs capitalize shrink-0 ml-2">{getDensityLabel(n.populationDensityClass)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{n.identity}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-muted-foreground shrink-0">Walkability</span>
                      <ScoreBar score={n.walkabilityScore} size="sm" className="flex-1" />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-muted-foreground shrink-0">Affordability</span>
                      <ScoreBar score={n.affordabilityScore} size="sm" className="flex-1" />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-muted-foreground shrink-0">Safety</span>
                      <ScoreBar score={n.safetyScore} size="sm" className="flex-1" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(n.lifestyleTags ?? []).slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground">
            No neighbourhoods match your search.
          </div>
        )}
      </div>
    </div>
  );
}
