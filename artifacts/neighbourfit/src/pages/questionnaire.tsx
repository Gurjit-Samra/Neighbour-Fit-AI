import { useState } from "react";
import { useLocation, Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { saveQuestionnaire } from "@/lib/questionnaire-store";
import {
  ArrowRight,
  ArrowLeft,
  Info,
  DollarSign,
  Footprints,
  Train,
  Music,
  Shield,
  Dumbbell,
  PawPrint,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 8;

type StepTheme = {
  gradient: string;
  iconBg: string;
  Icon: React.ElementType;
  title: string;
  desc: string;
  textColor: string;
  descColor: string;
  sliderColor: string;
  badgeBg: string;
  badgeText: string;
  infoBg: string;
  infoBorder: string;
  infoText: string;
};

const STEP_THEMES: StepTheme[] = [
  // 0: Budget
  {
    gradient: "bg-gradient-to-br from-green-50 to-emerald-100",
    iconBg: "bg-green-500",
    Icon: DollarSign,
    title: "Monthly Rent Budget",
    desc: "We'll flag an affordability warning if a neighbourhood exceeds this.",
    textColor: "text-green-900",
    descColor: "text-green-700",
    sliderColor: "bg-green-500",
    badgeBg: "bg-green-500",
    badgeText: "text-white",
    infoBg: "bg-green-50",
    infoBorder: "border-green-200",
    infoText: "text-green-800",
  },
  // 1: Walkability
  {
    gradient: "bg-gradient-to-br from-orange-50 to-amber-100",
    iconBg: "bg-orange-500",
    Icon: Footprints,
    title: "Walkability",
    desc: "How important is it to run errands and get around on foot?",
    textColor: "text-orange-900",
    descColor: "text-orange-700",
    sliderColor: "bg-orange-500",
    badgeBg: "bg-orange-500",
    badgeText: "text-white",
    infoBg: "bg-orange-50",
    infoBorder: "border-orange-200",
    infoText: "text-orange-800",
  },
  // 2: Transit
  {
    gradient: "bg-gradient-to-br from-blue-50 to-sky-100",
    iconBg: "bg-blue-500",
    Icon: Train,
    title: "Transit Access",
    desc: "How much do you rely on C-Train or bus access?",
    textColor: "text-blue-900",
    descColor: "text-blue-700",
    sliderColor: "bg-blue-500",
    badgeBg: "bg-blue-500",
    badgeText: "text-white",
    infoBg: "bg-blue-50",
    infoBorder: "border-blue-200",
    infoText: "text-blue-800",
  },
  // 3: Nightlife
  {
    gradient: "bg-gradient-to-br from-purple-50 to-pink-100",
    iconBg: "bg-purple-500",
    Icon: Music,
    title: "Nightlife & Social",
    desc: "How important are bars, restaurants, live music, and a social scene?",
    textColor: "text-purple-900",
    descColor: "text-purple-700",
    sliderColor: "bg-purple-500",
    badgeBg: "bg-purple-500",
    badgeText: "text-white",
    infoBg: "bg-purple-50",
    infoBorder: "border-purple-200",
    infoText: "text-purple-800",
  },
  // 4: Safety
  {
    gradient: "bg-gradient-to-br from-cyan-50 to-teal-100",
    iconBg: "bg-cyan-600",
    Icon: Shield,
    title: "Safety",
    desc: "How important are well-lit streets, low crime rates, and community feel?",
    textColor: "text-cyan-900",
    descColor: "text-cyan-700",
    sliderColor: "bg-cyan-600",
    badgeBg: "bg-cyan-600",
    badgeText: "text-white",
    infoBg: "bg-cyan-50",
    infoBorder: "border-cyan-200",
    infoText: "text-cyan-800",
  },
  // 5: Fitness
  {
    gradient: "bg-gradient-to-br from-red-50 to-rose-100",
    iconBg: "bg-red-500",
    Icon: Dumbbell,
    title: "Fitness & Wellness",
    desc: "How important is proximity to gyms, yoga studios, or the River Pathway?",
    textColor: "text-red-900",
    descColor: "text-red-700",
    sliderColor: "bg-red-500",
    badgeBg: "bg-red-500",
    badgeText: "text-white",
    infoBg: "bg-red-50",
    infoBorder: "border-red-200",
    infoText: "text-red-800",
  },
  // 6: Pet-Friendliness
  {
    gradient: "bg-gradient-to-br from-amber-50 to-yellow-100",
    iconBg: "bg-amber-500",
    Icon: PawPrint,
    title: "Pet-Friendliness",
    desc: "How important are dog parks, off-leash areas, and pet-welcoming culture?",
    textColor: "text-amber-900",
    descColor: "text-amber-700",
    sliderColor: "bg-amber-500",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    infoBg: "bg-amber-50",
    infoBorder: "border-amber-200",
    infoText: "text-amber-800",
  },
  // 7: Workplace
  {
    gradient: "bg-gradient-to-br from-indigo-50 to-blue-100",
    iconBg: "bg-indigo-500",
    Icon: Building2,
    title: "Workplace / School",
    desc: "Helps contextualise commute estimates in your results.",
    textColor: "text-indigo-900",
    descColor: "text-indigo-700",
    sliderColor: "bg-indigo-500",
    badgeBg: "bg-indigo-500",
    badgeText: "text-white",
    infoBg: "bg-indigo-50",
    infoBorder: "border-indigo-200",
    infoText: "text-indigo-800",
  },
];

const STEP_LABELS = [
  "Budget",
  "Walkability",
  "Transit Access",
  "Nightlife & Social",
  "Safety",
  "Fitness & Wellness",
  "Pet-Friendliness",
  "Workplace/School",
];

type PriorityKey = "walkability" | "transit" | "nightlife" | "safety" | "fitness" | "petFriendliness";

const PRIORITY_CONTEXT: Record<PriorityKey, { high: string; low: string }> = {
  walkability: {
    high: "Beltline and Kensington score highest — dense, pedestrian-friendly streets.",
    low: "Seton and University District are more car-dependent but offer other benefits.",
  },
  transit: {
    high: "East Village and Bridgeland sit on the CTrain Red Line with frequent service.",
    low: "Some neighbourhoods rely on buses only — check the CTrain map.",
  },
  nightlife: {
    high: "Beltline and Mission have the densest bar, restaurant, and music venue scene.",
    low: "Sunnyside and Marda Loop are quieter but still have great local cafés.",
  },
  safety: {
    high: "University District and Seton consistently score well for safety.",
    low: "Inner-city neighbourhoods vary — check Calgary Police crime maps for detail.",
  },
  fitness: {
    high: "Kensington and Sunnyside border the Bow River Pathway — ideal for outdoor fitness.",
    low: "All Calgary neighbourhoods have at least one gym within a short drive.",
  },
  petFriendliness: {
    high: "Kensington and Bridgeland have off-leash parks and pet-welcoming restaurants.",
    low: "Most Calgary neighbourhoods allow dogs — building rules vary by complex.",
  },
};

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 0
  const [budget, setBudget] = useState(1800);
  const [budgetInput, setBudgetInput] = useState("1800");

  // Steps 1–6 (priority sliders, 0-100 each, default 50)
  const [walkability, setWalkability] = useState(50);
  const [transit, setTransit] = useState(50);
  const [nightlife, setNightlife] = useState(50);
  const [safety, setSafety] = useState(50);
  const [fitness, setFitness] = useState(50);
  const [hasPet, setHasPet] = useState<boolean | null>(null);
  const [petFriendliness, setPetFriendliness] = useState(50);

  // Step 7
  const [workplace, setWorkplace] = useState<string>("none");
  const [commuteImportance, setCommuteImportance] = useState(50);

  const theme = STEP_THEMES[step];
  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    if (step === 0) {
      setLocation("/");
    } else {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = () => {
    const effectivePet = hasPet === false ? 0 : petFriendliness;
    const isRemote = workplace === "none";
    const effectiveTransit = isRemote ? transit : Math.min(100, transit + Math.round(commuteImportance * 0.4));
    saveQuestionnaire({
      budget,
      weights: {
        affordability: 20,
        walkability,
        transit: effectiveTransit,
        nightlife,
        safety,
        fitness,
        petFriendliness: effectivePet,
      },
      workplaceNeighborhood: isRemote ? null : workplace,
      commuteImportance: isRemote ? 0 : commuteImportance,
      usedDefaultWeights: false,
    });
    setLocation("/results");
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col py-10 px-4">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              Find Your Perfect Calgary Neighbourhood
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Step {step + 1} of {TOTAL_STEPS}: {STEP_LABELS[step]}
            </p>
          </div>
          <Link href="/">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap ml-6 mt-0.5">
              Skip →
            </span>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-border rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl shadow-md border border-card-border flex-1 flex flex-col overflow-hidden">

          {/* Coloured header */}
          <div className={cn("px-7 pt-6 pb-5 border-b border-black/5", theme.gradient)}>
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3", theme.iconBg)}>
              <theme.Icon className="h-5 w-5 text-white" />
            </div>
            <h2 className={cn("text-lg font-bold leading-tight", theme.textColor)}>{theme.title}</h2>
            <p className={cn("text-sm mt-0.5", theme.descColor)}>{theme.desc}</p>
          </div>

          {/* Animated content */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -32 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 p-7"
            >

              {/* ── Step 0: Budget ────────────────────────────── */}
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
                      <span>$900</span>
                      <span>$2,450</span>
                      <span>$4,000</span>
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

              {/* ── Steps 1–5: Priority sliders (walkability → fitness) ── */}
              {step >= 1 && step <= 5 && (() => {
                const configs: Array<{ val: number; set: (v: number) => void; key: PriorityKey }> = [
                  { val: walkability, set: setWalkability, key: "walkability" },
                  { val: transit, set: setTransit, key: "transit" },
                  { val: nightlife, set: setNightlife, key: "nightlife" },
                  { val: safety, set: setSafety, key: "safety" },
                  { val: fitness, set: setFitness, key: "fitness" },
                ];
                const { val, set, key } = configs[step - 1];
                const ctx = PRIORITY_CONTEXT[key];
                return (
                  <PrioritySlider
                    value={val}
                    onChange={set}
                    theme={theme}
                    stepIndex={step}
                    context={ctx}
                  />
                );
              })()}

              {/* ── Step 6: Pet-Friendliness ──────────────────── */}
              {step === 6 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Do you have a pet?</p>
                    <div className="flex gap-3">
                      {[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ].map(({ label, value }) => (
                        <button
                          key={label}
                          onClick={() => setHasPet(value)}
                          className={cn(
                            "flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all",
                            hasPet === value
                              ? "border-amber-500 bg-amber-50 text-amber-800"
                              : "border-border text-muted-foreground hover:border-amber-300 hover:bg-amber-50/50"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {hasPet === true && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <PrioritySlider
                          value={petFriendliness}
                          onChange={setPetFriendliness}
                          theme={theme}
                          stepIndex={6}
                          context={PRIORITY_CONTEXT.petFriendliness}
                        />
                      </motion.div>
                    )}
                    {hasPet === false && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn("p-3 rounded-lg border text-xs flex items-start gap-2", theme.infoBg, theme.infoBorder, theme.infoText)}
                      >
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        Pet-friendliness won't affect your compatibility score.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── Step 7: Workplace ─────────────────────────── */}
              {step === 7 && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Where do you work or study?</Label>
                    <p className="text-xs text-muted-foreground">Only a general area — no precise address needed.</p>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { label: "NW", value: "Northwest Calgary" },
                          { label: "NE", value: "Northeast Calgary" },
                          { label: "SE", value: "Southeast Calgary" },
                          { label: "SW", value: "Southwest Calgary" },
                          { label: "Downtown", value: "Downtown Core" },
                          { label: "Remote / Irrelevant", value: "none" },
                        ] as const
                      ).map(({ label, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setWorkplace(value)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                            workplace === value
                              ? "border-[#00cc99] bg-[#00cc99]/15 text-[#00cc99]"
                              : "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400 hover:text-slate-100"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {workplace !== "none" && (
                    <div className="space-y-3 pt-1">
                      <Label className="text-sm font-medium text-foreground">
                        How much do you value living near your work/school?
                      </Label>
                      <div className="relative py-1">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={commuteImportance}
                          onChange={(e) => setCommuteImportance(Number(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
                          style={{
                            accentColor: "#00cc99",
                            background: `linear-gradient(to right, #00cc99 ${commuteImportance}%, #334155 ${commuteImportance}%)`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Not important</span>
                        <span>Very important</span>
                      </div>
                    </div>
                  )}

                  {workplace === "none" ? (
                    <div className={cn("p-3 rounded-lg border text-xs flex items-start gap-2", theme.infoBg, theme.infoBorder, theme.infoText)}>
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      Working remotely or commute isn't a factor — we'll focus entirely on lifestyle fit.
                    </div>
                  ) : workplace !== "" && (
                    <div className={cn("p-3 rounded-lg border text-xs flex items-start gap-2", theme.infoBg, theme.infoBorder, theme.infoText)}>
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      Commute estimates assume a downtown Calgary destination. For other workplaces, use Google Maps.
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Footer nav */}
          <div className="flex items-center justify-between px-7 py-5 border-t border-card-border">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 0 ? "Cancel" : "Back"}
            </button>

            {/* Pet step: require a Yes/No selection before proceeding */}
            {step === 6 && hasPet === null ? (
              <button
                disabled
                className="flex items-center gap-2 px-6 py-2.5 bg-foreground/30 text-background text-sm font-semibold rounded-lg cursor-not-allowed"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : isLastStep ? (
              <button
                onClick={handleSubmit}
                data-testid="btn-submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-sm font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
              >
                See my matches <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={goNext}
                data-testid={`btn-next-${step}`}
                className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-sm font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared Priority Slider component ───────────────────────────── */
function PrioritySlider({
  value,
  onChange,
  theme,
  context,
}: {
  value: number;
  onChange: (v: number) => void;
  theme: StepTheme;
  stepIndex: number;
  context: { high: string; low: string };
}) {
  const importanceLabel = (v: number) => {
    if (v <= 10) return "Not at all important";
    if (v <= 30) return "Slightly important";
    if (v <= 50) return "Moderately important";
    if (v <= 70) return "Very important";
    if (v <= 90) return "Highly important";
    return "Essential";
  };

  return (
    <div className="space-y-7">
      {/* Big value badge */}
      <div className="flex justify-center">
        <div className={cn(
          "w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg",
          theme.badgeBg
        )}>
          <span className={cn("text-3xl font-black leading-none", theme.badgeText)}>{value}</span>
          <span className={cn("text-[10px] font-medium opacity-80 mt-0.5", theme.badgeText)}>/ 100</span>
        </div>
      </div>

      {/* Importance label */}
      <p className="text-center text-sm font-medium text-foreground -mt-3">{importanceLabel(value)}</p>

      {/* Slider */}
      <div className="space-y-2">
        <Slider
          min={0} max={100} step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          className="py-2"
        />
        {/* Tick labels */}
        <div className="relative flex justify-between text-xs text-muted-foreground px-0.5">
          <span>Not important</span>
          <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-foreground/60">50</span>
          <span>Very important</span>
        </div>
      </div>

      {/* Context info */}
      <div className={cn("p-3 rounded-lg border text-xs leading-relaxed space-y-1.5", theme.infoBg, theme.infoBorder, theme.infoText)}>
        <p><span className="font-semibold">High priority:</span> {context.high}</p>
        <p><span className="font-semibold">Lower priority:</span> {context.low}</p>
      </div>
    </div>
  );
}
