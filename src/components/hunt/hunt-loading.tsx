import { LoaderCircle } from "lucide-react";

export function ListingRowSkeleton() {
  return (
    <div className="hunt-skel-row" aria-hidden>
      <div className="hunt-skel-photo" />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <div className="hunt-skel-line is-lg" />
        <div className="hunt-skel-line w-40" />
        <div className="hunt-skel-line is-faint" />
      </div>
      <div className="hunt-skel-dot" />
    </div>
  );
}

export function ListingSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 p-3">
      {Array.from({ length: count }, (_, i) => (
        <ListingRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListenSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 md:px-6" aria-hidden>
      <div className="mb-4 flex gap-2">
        <div className="hunt-skel-line w-24" />
        <div className="hunt-skel-line w-16" />
        <div className="hunt-skel-line w-20" />
      </div>
      <div className="mb-6 flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="hunt-skel-block h-44 w-28 shrink-0 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="hunt-skel-block h-44 rounded-none" />
            <div className="space-y-2 p-3">
              <div className="hunt-skel-line w-24" />
              <div className="hunt-skel-line w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-bg px-3 pb-16" role="status" aria-live="polite" aria-label="Henter bolig">
      <div className="flex items-center justify-between py-2">
        <div className="hunt-skel-dot" />
        <div className="flex gap-2">
          <div className="hunt-skel-dot" />
          <div className="hunt-skel-dot" />
        </div>
      </div>
      <div className="hunt-skel-block hunt-skel-hero" />
      <div className="mt-4 space-y-3">
        <div className="hunt-skel-line is-lg w-36" />
        <div className="hunt-skel-line w-56" />
        <div className="hunt-skel-line is-faint w-44" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="hunt-skel-block h-16" />
        ))}
      </div>
    </div>
  );
}

export function HuntLoading({
  place,
  count = 6,
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
    <div className="hunt-loading" role="status" aria-live="polite" aria-label={`Henter boliger i ${place}`}>
      <div className="hunt-loading-banner">
        <LoaderCircle className="size-5 animate-spin text-primary" />
        <p className="text-sm text-muted">Søger live i {place}…</p>
      </div>
      <ListingSkeletonList count={count} />
    </div>
  );
}
