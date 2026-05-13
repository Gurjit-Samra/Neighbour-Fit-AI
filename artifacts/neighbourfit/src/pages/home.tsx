import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sliders, Star, GitCompare, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: Sliders,
    title: "Tell us your priorities",
    desc: "Rank what matters — affordability, nightlife, walkability, safety, pets, and more.",
    step: "01",
  },
  {
    icon: MapPin,
    title: "Get matched",
    desc: "Our deterministic scoring engine finds your top 5 Calgary neighbourhoods instantly.",
    step: "02",
  },
  {
    icon: Star,
    title: "AI-generated insight",
    desc: "GPT-4o-mini writes a personalised lifestyle summary for each match.",
    step: "03",
  },
  {
    icon: GitCompare,
    title: "Compare & save",
    desc: "Side-by-side charts to compare finalists. Save favourites to your account.",
    step: "04",
  },
];

const NEIGHBORHOODS = [
  { name: "Beltline", tag: "Urban nightlife hub", score: "Walkability" },
  { name: "Kensington", tag: "Café culture & pets", score: "Pet-friendly" },
  { name: "Marda Loop", tag: "Wellness & fitness", score: "Fitness" },
  { name: "Inglewood", tag: "Arts & creativity", score: "Affordability" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-card text-muted-foreground border border-card-border mb-7 shadow-sm">
            Calgary Neighbourhood Matching
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
            Find the neighbourhood<br />
            <span className="text-primary">that fits how you live.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Answer a 2-minute questionnaire about your lifestyle priorities. NeighbourFit scores 10 Calgary communities and explains why each one works — or doesn't — for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/questionnaire">
              <button
                className="flex items-center justify-center gap-2 px-8 py-3 bg-foreground text-background text-base font-semibold rounded-xl hover:opacity-90 active:opacity-80 transition-opacity shadow-sm"
                data-testid="cta-start"
              >
                Find my neighbourhood <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/neighborhoods">
              <button className="flex items-center justify-center gap-2 px-8 py-3 bg-card text-foreground text-base font-medium rounded-xl border border-card-border hover:shadow-sm transition-shadow">
                Browse all neighbourhoods
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3 text-foreground">How it works</h2>
            <p className="text-muted-foreground">Four steps to your perfect neighbourhood match</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <Card key={i} className="relative overflow-hidden bg-card border-card-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-6">
                  <div className="absolute top-4 right-4 text-3xl font-black text-muted-foreground/10 leading-none select-none">
                    {f.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured neighbourhoods */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3 text-foreground">Featured neighbourhoods</h2>
            <p className="text-muted-foreground">A taste of what you'll discover</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {NEIGHBORHOODS.map((n) => (
              <Link key={n.name} href={`/neighborhoods/${n.name.toLowerCase().replace(/ /g, "-")}`}>
                <Card className="bg-card border-card-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                  <CardContent className="pt-5 pb-5">
                    <h3 className="font-bold text-base mb-1 text-foreground">{n.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{n.tag}</p>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {n.score}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/neighborhoods">
              <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-card text-foreground text-sm font-medium rounded-xl border border-card-border hover:shadow-sm transition-shadow">
                See all 10 neighbourhoods <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl border border-card-border shadow-lg p-12 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to find your fit?</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Takes 2 minutes. No account required.
            </p>
            <Link href="/questionnaire">
              <button className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background text-base font-semibold rounded-xl hover:opacity-90 active:opacity-80 transition-opacity shadow-sm">
                Start the questionnaire <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
