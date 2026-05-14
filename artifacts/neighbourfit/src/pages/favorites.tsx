import { useGetMe, useListFavorites, useRemoveFavorite } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/neighborhood/ScoreBar";
import { Heart, Loader2, MapPin, GitCompare, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Favorites() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: favorites, isLoading } = useListFavorites({ query: { enabled: !!user } });
  const removeFav = useRemoveFavorite();
  const [, setLocation] = useLocation();
  const [compareSet, setCompareSet] = useState<string[]>([]);

  useEffect(() => {
    if (!userLoading && !user) setLocation("/login");
  }, [user, userLoading]);

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const toggleCompare = (slug: string) => {
    setCompareSet((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length < 3 ? [...prev, slug] : prev
    );
  };

  return (
    <div
      className="min-h-screen py-10 px-4 relative"
      style={{ backgroundImage: "url('/calgary-bg.png')", backgroundSize: "cover", backgroundPosition: "center 40%", backgroundAttachment: "fixed" }}
    >
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Heart className="h-7 w-7 text-primary fill-primary" /> Saved neighbourhoods
            </h1>
            <p className="text-white/70 mt-1">{(favorites ?? []).length} saved</p>
          </div>
          {compareSet.length >= 2 && (
            <Link href={`/compare?slugs=${compareSet.join(",")}`}>
              <Button className="gap-1"><GitCompare className="h-4 w-4" />Compare {compareSet.length}</Button>
            </Link>
          )}
        </div>

        {(favorites ?? []).length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-12 w-12 text-muted mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">You haven't saved any neighbourhoods yet.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/questionnaire"><Button>Find my fit</Button></Link>
              <Link href="/neighborhoods"><Button variant="outline">Browse</Button></Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(favorites as any[]).map((f: any) => (
              <Card key={f.id} className="overflow-hidden">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold">{f.name}</h3>
                      <p className="text-xs text-muted-foreground">{f.identity}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{f.populationDensityClass}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
                    {["affordabilityScore","walkabilityScore","safetyScore","fitnessScore"].map((k) => (
                      <div key={k}>
                        <span className="text-xs text-muted-foreground capitalize">{k.replace("Score","").replace(/([A-Z])/g," $1")}</span>
                        <ScoreBar score={f[k]} size="sm" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(f.lifestyleTags ?? []).slice(0,3).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/neighborhoods/${f.slug}`}>
                      <Button variant="outline" size="sm" className="gap-1"><MapPin className="h-3.5 w-3.5" />Details</Button>
                    </Link>
                    <Button
                      variant="outline" size="sm"
                      className={compareSet.includes(f.slug) ? "border-primary/50 text-primary" : ""}
                      onClick={() => toggleCompare(f.slug)}
                    >
                      <GitCompare className="h-3.5 w-3.5 mr-1" />{compareSet.includes(f.slug) ? "In compare" : "Compare"}
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="text-muted-foreground hover:text-destructive ml-auto"
                      onClick={() => removeFav.mutate({ neighborhoodId: String(f.id) })}
                      disabled={removeFav.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
