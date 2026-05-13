import { cn, getFitColor } from "@/lib/utils";

interface FitBadgeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

export function FitBadge({ score, label, size = "md" }: FitBadgeProps) {
  const colorClass = getFitColor(score);
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-sm px-3 py-1.5 font-bold" : "text-xs px-2.5 py-1";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border font-semibold", colorClass, sizeClass)}>
      <span className="font-black">{score}%</span>
      <span className="font-normal opacity-80">{label}</span>
    </span>
  );
}
