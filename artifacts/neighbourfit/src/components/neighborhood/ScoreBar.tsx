import { cn } from "@/lib/utils";

interface ScoreBarProps {
  score: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const COLOR_MAP = [
  "bg-red-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-teal-400",
  "bg-emerald-500",
];

export function ScoreBar({ score, max = 5, className, showLabel = true, size = "md" }: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const colorClass = COLOR_MAP[Math.round(score) - 1] ?? "bg-muted";
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 bg-muted rounded-full overflow-hidden", height)}>
        <div className={cn("h-full rounded-full transition-all", colorClass)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground w-6 text-right">{score}/5</span>
      )}
    </div>
  );
}
