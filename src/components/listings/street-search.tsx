import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function StreetSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft === value) return;
    const id = window.setTimeout(() => onChange(draft), 220);
    return () => window.clearTimeout(id);
  }, [draft, value, onChange]);

  return (
    <label className="relative mt-2 block">
      <span className="sr-only">Søg på vej eller adresse</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Søg vej eller adresse"
        className={cn(
          "h-11 w-full rounded-full border border-border bg-surface pl-9 pr-10 text-sm text-fg",
          "placeholder:text-faint outline-none focus:border-primary",
        )}
      />
      {draft ? (
        <button
          type="button"
          aria-label="Ryd søgning"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-sunken"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </label>
  );
}
