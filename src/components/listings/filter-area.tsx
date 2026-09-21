import { useEffect, useState } from "react";
import { FilterChip } from "@/components/listings/filter-chip";
import { districtsForKommune, districtIdFor, type District } from "@/lib/listings/districts";
import { hasBox, toggleBox } from "@/lib/listings/map-listing";
import { moduleOn } from "@/lib/hunt/modules";
import type { DawaPostHint } from "@/lib/listings/dawa";
import { suggestDawaPostnumre } from "@/lib/listings/search";
import { LINK_BOUNDS, type SearchFilters } from "@/lib/listings/types";

export function FilterArea({
  draft,
  onDraft,
  catalog,
}: {
  draft: SearchFilters;
  onDraft: (next: SearchFilters | ((current: SearchFilters) => SearchFilters)) => void;
  catalog?: District[];
}) {
  const [placeQ, setPlaceQ] = useState("");
  const [hints, setHints] = useState<DawaPostHint[]>([]);
  const bydele = catalog?.length ? catalog : districtsForKommune(draft.municipality);

  useEffect(() => {
    const q = placeQ.trim();
    if (q.length < 2) {
      setHints([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void suggestDawaPostnumre({ data: { q, municipality: draft.municipality } })
        .then(setHints)
        .catch(() => setHints([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [placeQ, draft.municipality]);

  if (!moduleOn("districts") && !moduleOn("mapDraw") && !moduleOn("odenseSnippet")) return null;

  return (
    <section>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Bydel og kortudsnit</p>
      {moduleOn("districts") ? (
        <>
          <input
            value={placeQ}
            onChange={(e) => setPlaceQ(e.target.value)}
            placeholder="Søg postnr eller bydel"
            className="mb-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          {hints.length ? (
            <div className="mb-3 max-h-36 overflow-y-auto rounded-lg border border-border bg-surface">
              {hints.map((hint) => (
                <button
                  key={`${hint.nr}-${hint.navn}`}
                  type="button"
                  onClick={() => {
                    const id = districtIdFor(hint.nr, hint.navn);
                    onDraft((d) => ({
                      ...d,
                      zipCode: hint.nr,
                      city: hint.navn,
                      districts: bydele.some((row) => row.id === id)
                        ? d.districts.includes(id)
                          ? d.districts
                          : [...d.districts, id]
                        : d.districts,
                    }));
                    setPlaceQ(hint.tekst);
                    setHints([]);
                  }}
                  className="flex h-11 w-full items-center px-3 text-left text-sm hover:bg-sunken"
                >
                  {hint.tekst}
                </button>
              ))}
            </div>
          ) : null}
          {bydele.length ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {bydele.map((row) => {
                const on = draft.districts.includes(row.id);
                return (
                  <FilterChip
                    key={row.id}
                    active={on}
                    onClick={() =>
                      onDraft((d) => ({
                        ...d,
                        districts: on ? d.districts.filter((id) => id !== row.id) : [...d.districts, row.id],
                      }))
                    }
                  >
                    {row.label}
                  </FilterChip>
                );
              })}
            </div>
          ) : (
            <p className="mb-3 text-xs text-faint">Ingen faste bydele her endnu. Søg et postnr, eller tegn på kortet.</p>
          )}
        </>
      ) : null}
      {moduleOn("odenseSnippet") && draft.municipality === "odense" ? (
        <button
          type="button"
          data-active={hasBox(draft.boxes, LINK_BOUNDS)}
          onClick={() => onDraft((d) => ({ ...d, boxes: toggleBox(d.boxes, LINK_BOUNDS) }))}
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-left text-sm data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-fg"
        >
          Originalt Odense-link (ca. 400 × 700 m)
        </button>
      ) : null}
      {draft.boxes.length ? (
        <button
          type="button"
          onClick={() => onDraft((d) => ({ ...d, boxes: [] }))}
          className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-left text-sm"
        >
          Fjern {draft.boxes.length === 1 ? "det tegnede område" : `${draft.boxes.length} tegnede områder`}
        </button>
      ) : null}
      <p className="mt-1.5 text-xs text-faint">
        Vælg bydele her, eller tegn ét eller flere rektangler under Kort. Ryd for hele kommunen.
      </p>
    </section>
  );
}
