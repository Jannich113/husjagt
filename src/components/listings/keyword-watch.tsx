import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { FilterChip as Chip } from "@/components/listings/filter-chip";
import { MAX_KEYWORDS, useKeywords } from "@/lib/listings/keywords";

export function KeywordWatch() {
  const hydrate = useKeywords((s) => s.hydrate);
  const words = useKeywords((s) => s.words);
  const mode = useKeywords((s) => s.mode);
  const add = useKeywords((s) => s.add);
  const remove = useKeywords((s) => s.remove);
  const setMode = useKeywords((s) => s.setMode);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function submit() {
    if (add(draft)) setDraft("");
  }

  return (
    <section>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Nøgleord i teksten</p>
      <div className="flex flex-wrap gap-2">
        <Chip active={mode === "any"} onClick={() => setMode("any")}>
          Ét af dem
        </Chip>
        <Chip active={mode === "all"} onClick={() => setMode("all")}>
          Alle
        </Chip>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {words.map((word) => (
          <span
            key={word}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-primary bg-primary/10 pl-3 pr-1 text-xs font-medium text-fg"
          >
            {word}
            <button
              type="button"
              aria-label={`Fjern ${word}`}
              onClick={() => remove(word)}
              className="flex size-7 items-center justify-center rounded-full text-muted hover:bg-sunken"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      {words.length < MAX_KEYWORDS ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="have, udestue, kælder…"
            className="h-11 min-w-0 flex-1 rounded-full border border-border bg-bg px-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full border border-border bg-surface px-4 text-sm font-medium"
          >
            Tilføj
          </button>
        </form>
      ) : null}
      <p className="mt-1.5 text-xs text-faint">
        Tom liste filtrerer ikke. Matches vises på kortet og i teksten.
      </p>
    </section>
  );
}
