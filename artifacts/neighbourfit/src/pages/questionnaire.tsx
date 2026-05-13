import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveQuestionnaire, DEFAULT_WEIGHTS } from "@/lib/questionnaire-store";
import { CALGARY_NEIGHBORHOODS } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Budget", "Priorities", "Lifestyle", "Review"];

const DIMENSION_INFO: Array<{ key: keyof typeof DEFAULT_WEIGHTS; label: string; desc: string; emoji: string }> = [
  { key: "affordability", label: "Affordability", desc: "Lower rents, better value-for-money housing", emoji: "💰" },
  { key: "walkability", label: "Walkability", desc: "Daily errands & amenities reachable on foot", emoji: "🚶" },
  { key: "transit", label: "Transit access", desc: "CTrain stations, frequent bus routes", emoji: "🚌" },
  { key: "nightlife", label: "Nightlife & social", desc: "Bars, restaurants, live music, social scene", emoji: "🍻" },
  { key: "safety", label: "Safety", desc: "Lower crime, well-lit streets, community feel", emoji: "🛡️" },
  { key: "fitness", label: "Fitness & wellness", desc: "Gyms, yoga, parks, outdoor activities", emoji: "💪" },
  { key: "petFriendliness", label: "Pet-friendliness", desc: "Dog parks, off-leash areas, pet-welcome culture", emoji: "🐾" },
];

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn(
          "h-2 rounded-full transition-all",
          i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-muted"
        )} />
      ))}
    </div>
  );
}

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(1800);
  const [budgetInput, setBudgetInput] = useState("1800");
  const [workplace, setWorkplace] = useState<string>("none");
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
  const [useDefaults, setUseDefaults] = useState(false);

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);

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

  const setWeight = (key: keyof typeof DEFAULT_WEIGHTS, val: number) => {
    setWeights((w) => ({ ...w, [key]: val }));
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Find your Calgary neighbourhood</h1>
          <p className="text-muted-foreground mt-2">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
        <StepIndicator step={step} total={STEPS.length} />

        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>What's your monthly rent budget?</CardTitle>
              <CardDescription>We'll show an affordability warning if a neighbourhood typically exceeds this.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Monthly rent budget (CAD)</Label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary">${budget.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm">/ month</span>
                </div>
                <Slider
                  min={900} max={4000} step={50}
                  value={[budget]}
                  onValueChange={([v]) => { setBudget(v); setBudgetInput(String(v)); }}
                  data-testid="budget-slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$900</span><span>$4,000</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Or enter manually:
                </p>
                <Input
                  type="number" value={budgetInput} min={900} max={4000}
                  onChange={(e) => {
                    setBudgetInput(e.target.value);
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 900 && v <= 4000) setBudget(v);
                  }}
                  className="w-40"
                />
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                Budget is used only for affordability warnings — it doesn't affect your compatibility score.
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>What matters most to you?</CardTitle>
              <CardDescription>
                Drag the sliders to weight your priorities. Higher = more important.
                Total weight right now: <span className={cn("font-semibold", totalWeight !== 100 && "text-amber-600")}>{totalWeight}</span>
                {" "}(doesn't need to be exactly 100 — we normalise automatically).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="useDefaults" checked={useDefaults} onChange={(e) => setUseDefaults(e.target.checked)} />
                <Label htmlFor="useDefaults" className="cursor-pointer text-sm">Use balanced default weights instead</Label>
              </div>
              {DIMENSION_INFO.map((d) => (
                <div key={d.key} className={cn("space-y-2", useDefaults && "opacity-40 pointer-events-none")}>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <span>{d.emoji}</span>
                      <span>{d.label}</span>
                    </Label>
                    <span className="text-sm font-bold text-primary w-6 text-right">{weights[d.key]}</span>
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
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Lifestyle preferences</CardTitle>
              <CardDescription>Optional but helps tailor your results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Where do you work? (optional)</Label>
                <p className="text-xs text-muted-foreground">Helps contextualise commute estimates.</p>
                <Select value={workplace} onValueChange={setWorkplace}>
                  <SelectTrigger data-testid="workplace-select">
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
                <p className="text-xs text-amber-600 flex items-start gap-1 mt-1">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Commute estimates assume a downtown Calgary destination. For other workplaces, use Google Maps.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review your preferences</CardTitle>
              <CardDescription>Everything look right? Hit "See my matches" to run the analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Monthly budget</span>
                <span className="font-semibold">${budget.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Weight mode</span>
                <span className="font-semibold">{useDefaults ? "Balanced defaults" : "Custom"}</span>
              </div>
              {!useDefaults && (
                <div className="space-y-2">
                  {DIMENSION_INFO.sort((a, b) => weights[b.key] - weights[a.key]).map((d) => (
                    <div key={d.key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{d.emoji} {d.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-muted w-24 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(weights[d.key] / 40) * 100}%` }} />
                        </div>
                        <span className="font-medium w-4 text-right">{weights[d.key]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {workplace !== "none" && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Work location</span>
                  <span className="font-semibold">{workplace}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 mt-6 justify-between">
          <Button
            variant="outline"
            onClick={() => step === 0 ? setLocation("/") : setStep(step - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} data-testid={`btn-next-${step}`}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} data-testid="btn-submit">
              See my matches <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
