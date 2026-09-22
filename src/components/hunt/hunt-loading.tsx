import { LoaderCircle } from "lucide-react";

export function HuntLoading({
  place,
  count = 4,
  compact = false,
}: {
  place: string;
  count?: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="hunt-loading-banner hunt-loading-compact" role="status" aria-live="polite">
        <LoaderCircle className="size-5 animate-spin text-primary" />
        <p className="font-medium text-fg">Henter boliger i {place}…</p>
      </div>
    );
  }

  return (
    <div className="hunt-loading" role="status" aria-live="polite">
      <div className="hunt-loading-banner">
        <LoaderCircle className="size-7 animate-spin text-primary" />
        <div>
          <p className="font-display text-2xl text-fg">Henter boliger</p>
          <p className="mt-1 text-sm text-muted">Søger live i {place}…</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="hunt-skel-card" />
        ))}
      </div>
    </div>
  );
}
