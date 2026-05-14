import { useGetMe, useGetRecommendationHistory, useListFavorites } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, History, ArrowRight, User, MapPin } from "lucide-react";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: history } = useGetRecommendationHistory({ query: { enabled: !!user } });
  const { data: favorites } = useListFavorites({ query: { enabled: !!user } });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!userLoading && !user) setLocation("/login");
  }, [user, userLoading]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className="min-h-screen py-10 px-4 relative"
      style={{ backgroundImage: "url('/calgary-bg.png')", backgroundSize: "cover", backgroundPosition: "center 40%", backgroundAttachment: "fixed" }}
    >
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/70 mt-1 flex items-center gap-1">
            <User className="h-4 w-4" />{user.email}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <History className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(history ?? []).length}</p>
                  <p className="text-xs text-muted-foreground">Searches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(favorites ?? []).length}</p>
                  <p className="text-xs text-muted-foreground">Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold capitalize">{user.role}</p>
                  <p className="text-xs text-muted-foreground">Account type</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent searches */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent searches</CardTitle>
              <Link href="/history"><Button variant="ghost" size="sm" className="text-xs">All</Button></Link>
            </CardHeader>
            <CardContent>
              {(history ?? []).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No searches yet</p>
                  <Link href="/questionnaire"><Button size="sm">Find my neighbourhood</Button></Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(history as any[]).slice(0, 5).map((h: any) => (
                    <li key={h.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                      <div>
                        <span className="font-medium">{h.resultsCount} matches</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Link href={`/results/${h.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 text-xs gap-0.5">
                          View <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Saved */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Saved neighbourhoods</CardTitle>
              <Link href="/favorites"><Button variant="ghost" size="sm" className="text-xs">All</Button></Link>
            </CardHeader>
            <CardContent>
              {(favorites ?? []).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No saved neighbourhoods yet</p>
                  <Link href="/neighborhoods"><Button size="sm">Browse</Button></Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(favorites as any[]).slice(0, 5).map((f: any) => (
                    <li key={f.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                      <div>
                        <span className="font-medium">{f.name}</span>
                        <p className="text-xs text-muted-foreground">{f.identity}</p>
                      </div>
                      <Link href={`/neighborhoods/${f.slug}`}>
                        <Button variant="ghost" size="sm" className="h-6 text-xs gap-0.5">
                          View <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/questionnaire">
            <Button className="gap-1"><MapPin className="h-4 w-4" />New search</Button>
          </Link>
          <Link href="/neighborhoods">
            <Button variant="outline">Browse neighbourhoods</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
