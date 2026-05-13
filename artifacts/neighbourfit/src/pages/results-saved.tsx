import { useParams, Link } from "wouter";
import { useGetRecommendation } from "@workspace/api-client-react";
import { NeighborhoodCard } from "@/components/neighborhood/NeighborhoodCard";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

export default function SavedResults() {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading } = useGetRecommendation(parseInt(id!, 10));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Session not found.</p>
        <Link href="/history"><Button variant="outline">Back to history</Button></Link>
      </div>
    );
  }

  const matches = (result as any).matches ?? [];

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/history">
            <Button variant="ghost" size="sm" className="gap-1 mb-4">
              <ArrowLeft className="h-4 w-4" />Back to history
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Saved results</h1>
          <p className="text-muted-foreground mt-1">
            {matches.length} matches · {new Date((result as any).createdAt).toLocaleString()}
          </p>
        </div>
        <div className="space-y-6">
          {matches.map((match: any, i: number) => (
            <NeighborhoodCard
              key={match.neighborhood.id}
              rank={i + 1}
              neighborhood={match.neighborhood}
              compatibilityScore={match.compatibilityScore}
              fitLabel={match.fitLabel}
              aiSummary={match.aiSummary}
              aiSummaryError={match.aiSummaryError}
              affordabilityWarning={match.affordabilityWarning}
              dimensionBreakdown={match.dimensionBreakdown}
              tradeoffExplanation={match.tradeoffExplanation}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
