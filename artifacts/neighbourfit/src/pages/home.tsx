import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sliders, Star, GitCompare, ArrowRight } from "lucide-react";
import { CommunityCarousel } from "@/components/CommunityCarousel";

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


export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative py-36 px-4 overflow-hidden"
        style={{
          backgroundImage: "url('/calgary-hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/20 mb-7 shadow-sm backdrop-blur-sm">
            Calgary Neighbourhood Matching
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-white leading-tight drop-shadow-lg">
            Find the neighbourhood<br />
            <span style={{ color: "#00cc99" }}>that fits how you live.</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
            Answer a 2-minute questionnaire about your lifestyle priorities. NeighbourFit matches you against 200 Calgary communities and shows your top 5 — with an AI-written lifestyle insight for each.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/questionnaire">
              <button
                className="flex items-center justify-center gap-2 px-8 py-3 text-white text-base font-semibold rounded-xl hover:opacity-90 active:opacity-80 transition-opacity shadow-lg"
                style={{ backgroundColor: "#00cc99" }}
                data-testid="cta-start"
              >
                Find my neighbourhood <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/neighborhoods">
              <button className="flex items-center justify-center gap-2 px-8 py-3 text-white text-base font-medium rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors">
                Browse all neighbourhoods
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community carousel */}
      <CommunityCarousel />

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
