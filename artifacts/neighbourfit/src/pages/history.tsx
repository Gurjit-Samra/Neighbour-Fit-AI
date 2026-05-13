import { useGetMe, useGetRecommendationHistory } from "@workspace/api-client-react";

import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, History, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export default function HistoryPage() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: history, isLoading } = useGetRecommendationHistory({ query: { enabled: !!user } });
  const [, setLocation] = useLocation();

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

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-7 w-7 text-primary" />Search history
          </h1>
          <p className="text-muted-foreground mt-1">{(history ?? []).length} past searches</p>
        </div>

        {(history ?? []).length === 0 ? (
          <div className="text-center py-20">
            <History className="h-12 w-12 text-muted mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No searches yet.</p>
            <Link href="/questionnaire"><Button>Find my neighbourhood</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(history as any[]).map((h: any) => (
              <Card key={h.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{h.resultsCount} neighbourhood matches</p>
                    <p className="text-sm text-muted-foreground">
                      Budget: ${h.budget?.toLocaleString() ?? "—"}/mo · {h.usedDefaultWeights ? "Default weights" : "Custom weights"}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</p>
                  </div>
                  <Link href={`/results/${h.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      View <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
