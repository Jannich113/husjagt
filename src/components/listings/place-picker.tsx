import { MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { suggestHuntPlaces } from "@/lib/listings/search";
import { applyPlace, localPlaceHits, placeLabel, type HuntPlace } from "@/lib/listings/place";
import type { SearchFilters } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

type Props = {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  compact?: boolean;
};

export function PlacePicker({ value, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<HuntPlace[]>(() => localPlaceHits(""));
  const box = useRef<HTMLDivElement>(null);
  const label = placeLabel(value);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hits;
    return hits;
  }, [hits, query]);

  useEffect(() => {
    const q = query.trim();
    const timer = window.setTimeout(() => {
      void suggestHuntPlaces({ data: { q } })
        .then(setHits)
        .catch(() => setHits(localPlaceHits(q)));
    }, q.length < 2 ? 0 : 160);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(place: HuntPlace) {
    onChange(applyPlace(value, place));
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={box} className={cn("relative", compact ? "min-w-0 flex-1" : "w-full")}>
      <label className={cn("mb-2 block text-xs font-medium uppercase tracking-wider text-muted", compact && "sr-only")}>
        By i Danmark
      </label>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setQuery("");
          setHits(localPlaceHits(""));
        }}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 text-left text-sm",
          compact && "h-9 rounded-full px-3",
          open && "ring-2 ring-primary/30",
        )}
      >
        <MapPin className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        <span className="text-xs text-faint">{value.city ? "by" : "kommune"}</span>
      </button>
      {open ? (
        <div className="absolute z-[60] mt-1 w-full min-w-[16rem] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søg by, postnr eller kommune"
              className="h-11 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {shown.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted">Ingen steder matcher. Prøv et postnr eller bynavn.</p>
            ) : (
              shown.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => pick(row)}
                  className="flex h-11 w-full items-center justify-between gap-3 px-3 text-left text-sm hover:bg-sunken"
                >
                  <span className="truncate font-medium">{row.label}</span>
                  <span className="shrink-0 text-xs text-faint">{row.detail}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
