import { useState } from "react";
import { useLocation, Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveQuestionnaire, DEFAULT_WEIGHTS } from "@/lib/questionnaire-store";
import { CALGARY_NEIGHBORHOODS } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  Info,
  DollarSign,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Budget", "Priorities", "Lifestyle", "Review"];

const STEP_THEMES = [
  {
    gradient: "bg-gradient-to-br from-green-50 to-emerald-100",
    iconBg: "bg-green-500",
    Icon: DollarSign,
    title: "Monthly Rent Budget",
    desc: "We'll flag an affordability warning if a neighbourhood exceeds this.",
    textColor: "text-green-900",
    descColor: "text-green-700",
  },
  {
    gradient: "bg-gradient-to-br from-purple-50 to-pink-100",
    iconBg: "bg-purple-500",
    Icon: SlidersHorizontal,
    title: "Your Priorities",
    desc: "Weight the lifestyle dimensions that matter most to you.",
    textColor: "text-purple-900",
    descColor: "text-purple-700",
  },
  {
    gradient: "bg-gradient-to-br from-indigo-50 to-blue-100",
    iconBg: "bg-indigo-500",
    Icon: Building2,
    title: "Lifestyle & Workplace",
    desc: "Helps contextualise commute estimates in your results.",
    textColor: "text-indigo-900",
    descColor: "text-indigo-700",
  },
  {
    gradient: "bg-gradient-to-br from-slate-50 to-gray-100",
    iconBg: "bg-slate-600",
    Icon: CheckCircle2,
    title: "Review Your Preferences",
    desc: "Check everything looks right before we run the analysis.",
    textColor: "text-slate-900",
    descColor: "text-slate-600",
  },
];

const DIMENSION_INFO: Array<{ key: keyof typeof DEFAULT_WEIGHTS; label: string; desc: string; emoji: string }> = [
  { key: "affordability", label: "Affordability", desc: "Lower rents, better value-for-money housing", emoji: "💰" },
  { key: "walkability", label: "Walkability", desc: "Daily errands & amenities reachable on foot", emoji: "🚶" },
  { key: "transit", label: "Transit access", desc: "CTrain stations, frequent bus routes", emoji: "🚌" },
  { key: "nightlife", label: "Nightlife & social", desc: "Bars, restaurants, live music, social scene", emoji: "🍻" },
  { key: "safety", label: "Safety", desc: "Lower crime, well-lit streets, community feel", emoji: "🛡️" },
  { key: "fitness", label: "Fitness & wellness", desc: "Gyms, yoga, parks, outdoor activities", emoji: "💪" },
  { key: "petFriendliness", label: "Pet-friendliness", desc: "Dog parks, off-leash areas, pet-welcome culture", emoji: "🐾" },
];

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(1800);
  const [budgetInput, setBudgetInput] = useState("1800");
  const [workplace, setWorkplace] = useState<string>("none");
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
  const [useDefaults, setUseDefaults] = useState(false);
  const [direction, setDirection] = useState(1);

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
  const progressPct = ((step + 1) / STEPS.length) * 100;
  const theme = STEP_THEMES[step];

  const handleSubmit = () => {
    const data = {
      budget,
      weights,
      workplaceNeighborhood: workplace === "none" ? null : workplace,
      usedDefaultWeights: useDefaults,
    };
    saveQuestionnaire(data);
    setLocation("/results");
  };

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) {
      setLocation("/");
    } else {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const setWeight = (key: keyof typeof DEFAULT_WEIGHTS, val: number) => {
    setWeights((w) => ({ ...w, [key]: val }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col py-10 px-4">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">

        {/* Title + skip */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              Find Your Perfect Calgary Neighbourhood
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </p>
          </div>
          <Link href="/">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap ml-6 mt-0.5">
              Skip questionnaire →
            </span>
          </Link>
        </div>

        {/* Thin progress bar */}
        <div className="w-full h-0.5 bg-border rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Main card */}
        <div className="bg-card rounded-xl shadow-md border border-card-border flex-1 flex flex-col overflow-hidden">

          {/* Per-step coloured header */}
          <div className={cn("px-7 pt-6 pb-5 border-b border-black/5", theme.gradient)}>
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3", theme.iconBg)}>
              <theme.Icon className="h-5 w-5 text-white" />
            </div>
            <h2 className={cn("text-lg font-bold leading-tight", theme.textColor)}>{theme.title}</h2>
            <p className={cn("text-sm mt-0.5", theme.descColor)}>{theme.desc}</p>
          </div>

          {/* Animated step content */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -28 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 p-7"
            >

              {step === 0 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">${budget.toLocaleString()}</span>
                      <span className="text-muted-foreground text-sm">/ month</span>
                    </div>
                    <Slider
                      min={900} max={4000} step={50}
                      value={[budget]}
                      onValueChange={([v]) => { setBudget(v); setBudgetInput(String(v)); }}
                      data-testid="budget-slider"
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$900</span><span>$4,000</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Or enter manually:</Label>
                      <Input
                        type="number" value={budgetInput} min={900} max={4000}
                        onChange={(e) => {
                          setBudgetInput(e.target.value);
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v >= 900 && v <= 4000) setBudget(v);
                        }}
                        className="w-32 bg-background"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 leading-relaxed">
                    Budget is used only for affordability warnings — it doesn't affect your compatibility score.
                  </div>
                  {budget < 1260 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      Your budget is significantly below Calgary's median rent (~$1,800/mo). Fewer options may be available.
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useDefaults}
                      onChange={(e) => setUseDefaults(e.target.checked)}
                      className="w-4 h-4 accent-foreground"
                    />
                    <span className="text-sm text-muted-foreground">Use balanced default weights instead</span>
                  </label>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Total: <span className={cn("font-semibold", totalWeight !== 100 && "text-amber-600")}>{totalWeight}</span>
                    {" "}(we normalise to 100% automatically)
                  </p>
                  <div className={cn("space-y-5", useDefaults && "opacity-40 pointer-events-none")}>
                    {DIMENSION_INFO.map((d) => (
                      <div key={d.key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2 text-sm font-medium cursor-default">
                            <span>{d.emoji}</span>
                            <span>{d.label}</span>
                          </Label>
                          <span className="text-sm font-bold w-8 text-right tabular-nums">{weights[d.key]}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{d.desc}</p>
                        <Slider
                          min={0} max={40} step={1}
                          value={[weights[d.key]]}
                          onValueChange={([v]) => setWeight(d.key, v)}
                          disabled={useDefaults}
                          data-testid={`slider-${d.key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Where do you work? (optional)</Label>
                    <p className="text-xs text-muted-foreground">Helps contextualise commute estimates in your results.</p>
                    <Select value={workplace} onValueChange={setWorkplace}>
                      <SelectTrigger data-testid="workplace-select" className="bg-background">
                        <SelectValue placeholder="Select or skip" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Prefer not to say / remote</SelectItem>
                        {CALGARY_NEIGHBORHOODS.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                        <SelectItem value="Downtown Core">Downtown Core</SelectItem>
                      </SelectContent>
                    </Select>
                    {workplace === "none" || workplace === "" ? (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        Commute estimates assume a downtown Calgary destination. For other workplaces, use Google Maps.
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                        Great — we'll show commute estimates relative to <strong>{workplace}</strong>.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-0 divide-y divide-border">
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">Monthly budget</span>
                      <span className="font-semibold">${budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">Weight mode</span>
                      <span className="font-semibold">{useDefaults ? "Balanced defaults" : "Custom"}</span>
                    </div>
                    {!useDefaults && (
                      <div className="py-3 space-y-2">
                        {DIMENSION_INFO.sort((a, b) => weights[b.key] - weights[a.key]).map((d) => (
                          <div key={d.key} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{d.emoji} {d.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 rounded-full bg-muted w-24 overflow-hidden">
                                <div className="h-full bg-foreground rounded-full" style={{ width: `${(weights[d.key] / 40) * 100}%` }} />
                              </div>
                              <span className="font-medium w-4 text-right tabular-nums">{weights[d.key]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {workplace !== "none" && (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-muted-foreground">Work location</span>
                        <span className="font-semibold">{workplace}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Footer navigation */}
          <div className="flex items-center justify-between px-7 py-5 border-t border-card-border">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 0 ? "Cancel" : "Back"}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                data-testid={`btn-next-${step}`}
                className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-sm font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                data-testid="btn-submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-sm font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
              >
                See my matches <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
