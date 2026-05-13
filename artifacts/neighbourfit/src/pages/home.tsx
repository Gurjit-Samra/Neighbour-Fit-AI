import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sliders, Star, GitCompare, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: Sliders,
    title: "Tell us your priorities",
    desc: "Rank what matters to you — affordability, nightlife, walkability, safety, pets, and more.",
  },
  {
    icon: MapPin,
    title: "Get matched",
    desc: "Our deterministic scoring engine finds your top 5 Calgary neighbourhoods instantly.",
  },
  {
    icon: Star,
    title: "AI-generated insight",
    desc: "GPT-4o-mini writes a personalised lifestyle summary for each match.",
  },
  {
    icon: GitCompare,
    title: "Compare & save",
    desc: "Side-by-side radar charts to compare finalists. Save favourites to your account.",
  },
];

const NEIGHBORHOODS = [
  { name: "Beltline", tag: "Urban nightlife hub", score: "★★★★★ Walkability" },
  { name: "Kensington", tag: "Café culture & pets", score: "★★★★★ Pet-friendly" },
  { name: "Marda Loop", tag: "Wellness & fitness", score: "★★★★★ Fitness" },
  { name: "Inglewood", tag: "Arts & creativity", score: "★★★★ Affordability" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
            Calgary Neighbourhood Matching
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
            Find the neighbourhood<br />
            <span className="text-primary">that fits how you live.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Answer a 2-minute questionnaire about your lifestyle priorities. NeighbourFit scores 10 Calgary communities and explains why each one works — or doesn't — for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/questionnaire">
              <Button size="lg" className="gap-2 text-base px-8" data-testid="cta-start">
                Find my neighbourhood <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/neighborhoods">
              <Button size="lg" variant="outline" className="text-base px-8">
                Browse all neighbourhoods
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground">Four steps to your perfect neighbourhood match</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardContent className="pt-6 pb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="absolute top-4 right-4 text-4xl font-black text-muted/30 leading-none">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured neighbourhoods */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Featured neighbourhoods</h2>
            <p className="text-muted-foreground">A taste of what you'll discover</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {NEIGHBORHOODS.map((n) => (
              <Link key={n.name} href={`/neighborhoods/${n.name.toLowerCase().replace(/ /g, "-")}`}>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="pt-5 pb-5">
                    <h3 className="font-bold text-base mb-1">{n.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{n.tag}</p>
                    <span className="text-xs text-primary">{n.score}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/neighborhoods">
              <Button variant="outline" className="gap-2">
                See all 10 neighbourhoods <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find your fit?</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Takes 2 minutes. No account required.
          </p>
          <Link href="/questionnaire">
            <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
              Start the questionnaire <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
