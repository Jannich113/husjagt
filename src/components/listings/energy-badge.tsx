import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  A: "bg-good text-primary-fg",
  B: "bg-good/80 text-primary-fg",
  C: "bg-primary text-primary-fg",
  D: "bg-warn text-primary-fg",
  E: "bg-warn text-primary-fg",
  F: "bg-danger/80 text-primary-fg",
  G: "bg-danger text-primary-fg",
};

export function EnergyBadge({ label }: { label: string | null }) {
  if (!label) return null;
  const key = label.trim().charAt(0).toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1.5 text-xs font-semibold tracking-wide",
        TONE[key] ?? "bg-sunken text-fg",
      )}
    >
      {key}
    </span>
  );
}
