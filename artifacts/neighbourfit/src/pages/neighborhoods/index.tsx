import { useListNeighborhoods as useGetNeighborhoods } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/neighborhood/ScoreBar";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { getDensityLabel } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function NeighborhoodsIndex() {
  const { data: neighborhoods, isLoading } = useGetNeighborhoods();
  const [search, setSearch] = useState("");

  const filtered = (neighborhoods ?? []).filter((n: any) =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.identity.toLowerCase().includes(search.toLowerCase()) ||
    (n.lifestyleTags ?? []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Calgary Neighbourhoods</h1>
          <p className="text-muted-foreground">All 10 communities scored across 7 lifestyle dimensions.</p>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search by name, vibe, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            data-testid="search-neighborhoods"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((n: any) => (
              <Link key={n.slug} href={`/neighborhoods/${n.slug}`}>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-base">{n.name}</h3>
                      <Badge variant="outline" className="text-xs capitalize">{getDensityLabel(n.populationDensityClass)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{n.identity}</p>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-20 text-muted-foreground">Walkability</span>
                        <ScoreBar score={n.walkabilityScore} size="sm" className="flex-1" />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-20 text-muted-foreground">Affordability</span>
                        <ScoreBar score={n.affordabilityScore} size="sm" className="flex-1" />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-20 text-muted-foreground">Safety</span>
                        <ScoreBar score={n.safetyScore} size="sm" className="flex-1" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(n.lifestyleTags ?? []).slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
