import {
  useListNeighborhoods as useGetNeighborhoods,
  useGetMe,
  useListFavorites,
  useAddFavorite,
  useRemoveFavorite,
  getListFavoritesQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/neighborhood/ScoreBar";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { getDensityLabel } from "@/lib/utils";
import {
  Loader2,
  Search,
  Bookmark,
  BookmarkCheck,
  GitCompare,
  Plus,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

export default function NeighborhoodsIndex() {
  const { data: neighborhoods, isLoading } = useGetNeighborhoods();
  const [search, setSearch] = useState("");
  const [compareQueue, setCompareQueue] = useState<string[]>([]);
  const [, navigate] = useLocation();

  const { data: user } = useGetMe();
  const { data: favorites } = useListFavorites({ query: { enabled: !!user } });
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const favoriteIds = new Set((favorites ?? []).map((f: any) => f.id));

  const filtered = (neighborhoods ?? []).filter(
    (n: any) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.identity.toLowerCase().includes(search.toLowerCase()) ||
      (n.lifestyleTags ?? []).some((t: string) =>
        t.toLowerCase().includes(search.toLowerCase())
      )
  );

  const toggleFavorite = (e: React.MouseEvent, n: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Create a free account to save favourites.",
      });
      return;
    }
    if (favoriteIds.has(n.id)) {
      removeFav.mutate(
        { neighborhoodId: n.id },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({
              queryKey: getListFavoritesQueryKey(),
            }),
        }
      );
    } else {
      addFav.mutate(
        { neighborhoodId: n.id },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({
              queryKey: getListFavoritesQueryKey(),
            }),
        }
      );
    }
  };

  const toggleCompare = (e: React.MouseEvent, n: any) => {
    e.stopPropagation();
    e.preventDefault();
    setCompareQueue((prev) => {
      if (prev.includes(n.slug)) return prev.filter((s) => s !== n.slug);
      if (prev.length >= 3) {
        toast({
          title: "Maximum 3 neighbourhoods",
          description: "Remove one to add another.",
        });
        return prev;
      }
      return [...prev, n.slug];
    });
  };

  const removeFromQueue = (slug: string) =>
    setCompareQueue((prev) => prev.filter((s) => s !== slug));

  const goCompare = () => {
    if (compareQueue.length < 2) return;
    navigate(`/compare?slugs=${compareQueue.join(",")}`);
  };

  const getNameForSlug = (slug: string) =>
    (neighborhoods ?? []).find((n: any) => n.slug === slug)?.name ??
    slug.replace(/-/g, " ");

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            Calgary Neighbourhoods
          </h1>
          <p className="text-muted-foreground">
            All Calgary communities scored across 7 lifestyle dimensions.
          </p>
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
            {filtered.map((n: any) => {
              const isSaved = favoriteIds.has(n.id);
              const inQueue = compareQueue.includes(n.slug);
              const isMutating =
                (addFav.isPending || removeFav.isPending) &&
                (addFav.variables as any)?.neighborhoodId === String(n.id);

              return (
                <div
                  key={n.slug}
                  className="bg-card border border-card-border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  {/* ── Clickable main content ── */}
                  <Link href={`/neighborhoods/${n.slug}`} className="flex-1">
                    <div className="p-5 h-full">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-base text-foreground">
                          {n.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-xs capitalize shrink-0 ml-2"
                        >
                          {getDensityLabel(n.populationDensityClass)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {n.identity}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-20 text-muted-foreground shrink-0">
                            Walkability
                          </span>
                          <ScoreBar
                            score={n.walkabilityScore}
                            size="sm"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-20 text-muted-foreground shrink-0">
                            Affordability
                          </span>
                          <ScoreBar
                            score={n.affordabilityScore}
                            size="sm"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-20 text-muted-foreground shrink-0">
                            Safety
                          </span>
                          <ScoreBar
                            score={n.safetyScore}
                            size="sm"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(n.lifestyleTags ?? []).slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Link>

                  {/* ── Quick Actions row ── */}
                  <div className="border-t border-border/50 flex rounded-b-xl overflow-hidden">
                    {/* Save */}
                    <button
                      onClick={(e) => toggleFavorite(e, n)}
                      disabled={isMutating}
                      title={isSaved ? "Remove from saved" : "Save neighbourhood"}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all",
                        "bg-card hover:bg-muted/60 backdrop-blur-sm",
                        isSaved
                          ? "text-[#00cc99]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isMutating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSaved ? (
                        <BookmarkCheck className="h-3.5 w-3.5 fill-[#00cc99] text-[#00cc99]" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )}
                      {isSaved ? "Saved" : "Save"}
                    </button>

                    {/* Divider */}
                    <div className="w-px bg-border/50" />

                    {/* Compare */}
                    <button
                      onClick={(e) => toggleCompare(e, n)}
                      title={
                        inQueue
                          ? "Remove from comparison"
                          : compareQueue.length >= 3
                          ? "Maximum 3 neighbourhoods"
                          : "Add to comparison"
                      }
                      disabled={!inQueue && compareQueue.length >= 3}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all",
                        "bg-card hover:bg-muted/60 backdrop-blur-sm",
                        inQueue
                          ? "text-[#00cc99]"
                          : "text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                      )}
                    >
                      {inQueue ? (
                        <GitCompare className="h-3.5 w-3.5 text-[#00cc99]" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      {inQueue ? "In queue" : "Compare"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground">
            No neighbourhoods match your search.
          </div>
        )}
      </div>

      {/* ── Floating Compare Bar ── */}
      <AnimatePresence>
        {compareQueue.length >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 max-w-[calc(100vw-2rem)]"
          >
            {/* Queue chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {compareQueue.map((slug) => (
                <span
                  key={slug}
                  className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-slate-700/80 rounded-full text-xs text-slate-200 capitalize font-medium"
                >
                  {getNameForSlug(slug)}
                  <button
                    onClick={() => removeFromQueue(slug)}
                    className="p-0.5 rounded-full hover:bg-slate-600 transition-colors"
                  >
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-200" />
                  </button>
                </span>
              ))}
            </div>

            {/* Slot indicators when < 3 */}
            {compareQueue.length < 3 && (
              <span className="text-xs text-slate-500 shrink-0">
                {3 - compareQueue.length} slot{3 - compareQueue.length !== 1 ? "s" : ""} left
              </span>
            )}

            {/* Compare Now */}
            <button
              onClick={goCompare}
              disabled={compareQueue.length < 2}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                compareQueue.length >= 2
                  ? "bg-[#00cc99] hover:bg-[#00b386] text-slate-900"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              )}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Compare Now
              {compareQueue.length >= 2 && (
                <ArrowRight className="h-3 w-3" />
              )}
            </button>

            {/* Clear all */}
            <button
              onClick={() => setCompareQueue([])}
              className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200"
              title="Clear comparison queue"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
