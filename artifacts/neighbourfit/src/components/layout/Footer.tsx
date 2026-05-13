import { MapPin } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-primary mb-3">
              <MapPin className="h-4 w-4" />
              <span>NeighbourFit AI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find the Calgary neighborhood that fits how you actually live. Powered by curated data and AI-generated insights.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/questionnaire" className="hover:text-foreground transition-colors">Find my neighborhood</Link></li>
              <li><Link href="/neighborhoods" className="hover:text-foreground transition-colors">Browse neighborhoods</Link></li>
              <li><Link href="/compare" className="hover:text-foreground transition-colors">Compare</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Data Notes</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Neighborhood scores are curated MVP assumptions reviewed by the product team — not AI-generated ratings. AI is used only for narrative summaries. Scores are subject to change as the product evolves.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            This classroom prototype is hosted on Replit and should not be used to collect sensitive personal data. A public production deployment would require Canadian-resident infrastructure and a PIPEDA/PIPA-compliant privacy policy.
          </p>
        </div>
      </div>
    </footer>
  );
}
