import { useState } from "react";
import { useGetMe, useAdminListNeighborhoods, useAdminUpdateNeighborhood, useAdminInvalidateCache } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListNeighborhoodsQueryKey } from "@workspace/api-client-react";

const SCORE_FIELDS = [
  "affordabilityScore","walkabilityScore","transitScore","nightlifeScore",
  "safetyScore","fitnessScore","petFriendlinessScore"
] as const;

function EditNeighborhoodForm({ n, onClose }: { n: any; onClose: () => void }) {
  const update = useAdminUpdateNeighborhood();
  const invalidateCache = useAdminInvalidateCache();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...n });

  const handleSave = () => {
    const patch: Record<string, any> = {};
    for (const f of SCORE_FIELDS) {
      patch[f] = parseInt(String(form[f]));
    }
    patch.identity = form.identity;
    patch.description = form.description;
    patch.medianRentalEstimate = form.medianRentalEstimate ? parseInt(String(form.medianRentalEstimate)) : null;
    patch.downtownCommuteEstimateMins = form.downtownCommuteEstimateMins ? parseInt(String(form.downtownCommuteEstimateMins)) : null;

    update.mutate({ id: String(n.id), data: patch }, {
      onSuccess: () => {
        toast({ title: "Updated", description: `${n.name} saved.` });
        queryClient.invalidateQueries({ queryKey: getAdminListNeighborhoodsQueryKey() });
        onClose();
      },
      onError: () => {
        toast({ title: "Error", description: "Update failed.", variant: "destructive" });
      }
    });
  };

  const handleInvalidate = () => {
    invalidateCache.mutate({ id: String(n.id) }, {
      onSuccess: () => toast({ title: "Cache cleared", description: `AI summaries for ${n.name} will regenerate on next request.` }),
    });
  };

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {SCORE_FIELDS.map((f) => (
          <div key={f} className="space-y-1">
            <Label className="text-xs capitalize">{f.replace("Score","").replace(/([A-Z])/g," $1")}</Label>
            <Input
              type="number" min={1} max={5}
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Identity</Label>
        <Input value={form.identity ?? ""} onChange={(e) => setForm({ ...form, identity: e.target.value })} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <textarea
          className="w-full text-sm border border-border rounded-md p-2 bg-background min-h-[80px]"
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Median rent ($/mo)</Label>
          <Input type="number" value={form.medianRentalEstimate ?? ""} onChange={(e) => setForm({ ...form, medianRentalEstimate: e.target.value })} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Downtown commute (min)</Label>
          <Input type="number" value={form.downtownCommuteEstimateMins ?? ""} onChange={(e) => setForm({ ...form, downtownCommuteEstimateMins: e.target.value })} className="h-8 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Save changes
        </Button>
        <Button variant="outline" size="sm" onClick={handleInvalidate} disabled={invalidateCache.isPending} className="gap-1">
          <RotateCcw className="h-3.5 w-3.5" />Clear AI cache
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

export default function AdminNeighborhoods() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: neighborhoods, isLoading } = useAdminListNeighborhoods({ query: { enabled: user?.role === "admin" } });
  const [, setLocation] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "admin")) setLocation("/");
  }, [user, userLoading]);

  if (userLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div
      className="min-h-screen py-10 px-4 relative"
      style={{ backgroundImage: "url('/calgary-bg.png')", backgroundSize: "cover", backgroundPosition: "center 40%", backgroundAttachment: "fixed" }}
    >
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin"><Button variant="ghost" size="sm" className="gap-1 mb-4 text-white/80 hover:text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4" />Admin</Button></Link>
          <h1 className="text-3xl font-bold text-white">Manage Neighbourhoods</h1>
          <p className="text-white/70 mt-1">Edit scores, descriptions, and clear AI summary caches.</p>
        </div>

        <div className="space-y-3">
          {(neighborhoods as any[])?.map((n: any) => (
            <Card key={n.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}>
                  <div>
                    <h3 className="font-semibold">{n.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Scores: Aff {n.affordabilityScore} · Walk {n.walkabilityScore} · Transit {n.transitScore} · Safety {n.safetyScore}
                    </p>
                  </div>
                  {expandedId === n.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
                {expandedId === n.id && (
                  <EditNeighborhoodForm n={n} onClose={() => setExpandedId(null)} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
