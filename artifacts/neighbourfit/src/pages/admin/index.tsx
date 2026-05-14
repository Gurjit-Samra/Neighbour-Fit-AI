import { useGetMe, useAdminGetAnalytics } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, BarChart2, MapPin } from "lucide-react";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: analytics } = useAdminGetAnalytics({ query: { enabled: user?.role === "admin" } });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "admin")) setLocation("/");
  }, [user, userLoading]);

  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user || user.role !== "admin") return null;

  const stats = analytics as any;

  const statCards = [
    { label: "Questionnaire completions", value: stats?.questionnaireCompletions ?? "—" },
    { label: "Recommendation sessions", value: stats?.recommendationSessions ?? "—" },
    { label: "Registered users", value: stats?.registeredUsers ?? "—" },
    { label: "Neighbourhood saves", value: stats?.favoriteSaves ?? "—" },
    { label: "AI summaries generated", value: stats?.aiSummariesGenerated ?? "—" },
    { label: "AI cache hits", value: stats?.aiCacheHits ?? "—" },
  ];

  return (
    <div
      className="min-h-screen py-10 px-4 relative"
      style={{ backgroundImage: "url('/calgary-bg.png')", backgroundSize: "cover", backgroundPosition: "center 40%", backgroundAttachment: "fixed" }}
    >
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
            <Settings className="h-7 w-7 text-primary" />Admin Dashboard
          </h1>
          <p className="text-white/70 mt-1">Platform analytics and neighbourhood management</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map((c) => (
            <Card key={c.label}>
              <CardContent className="pt-5 pb-5">
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 flex-wrap">
          <Link href="/admin/neighborhoods">
            <Button className="gap-2"><MapPin className="h-4 w-4" />Manage neighbourhoods</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
