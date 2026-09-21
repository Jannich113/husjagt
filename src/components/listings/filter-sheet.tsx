import { useState } from "react";
import { Drawer } from "vaul";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlacePicker } from "@/components/listings/place-picker";
import { FilterArea } from "@/components/listings/filter-area";
import { FilterChip as Chip } from "@/components/listings/filter-chip";
import { formatMio } from "@/lib/listings/format";
import type { District } from "@/lib/listings/districts";
import {
  DEFAULT_FILTERS,
  ENERGY_LABELS,
  PROPERTY_TYPES,
  SORT_OPTIONS,
  advancedFilterCount,
  type SearchFilters,
} from "@/lib/listings/types";
import { cn } from "@/lib/utils";

const PRICE_STEPS = [500_000, 1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000, 8_000_000];
const PRICE_MIN_STEPS = [250_000, 500_000, 750_000, 1_000_000, 1_500_000];
const YEAR_FROM = [1950, 1970, 1990, 2000, 2010];
const YEAR_TO = [1980, 2000, 2010, 2020];
const LOT_STEPS = [400, 600, 800, 1000];
const LOT_MAX_STEPS = [400, 600, 800, 1200];
const EXPENSE_STEPS = [2_000, 3_000, 4_000, 5_000];
const DAYS_STEPS = [7, 14, 30, 60, 90];
const M2_PRICE_STEPS = [10_000, 15_000, 20_000, 25_000];

type Props = {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  count: number;
  catalog?: District[];
};

export function FilterSheet({ value, onChange, count, catalog }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const extra = advancedFilterCount(value);
  const [advanced, setAdvanced] = useState(extra > 0);

  function openSheet() {
    setDraft(value);
    setAdvanced(advancedFilterCount(value) > 0);
    setOpen(true);
  }

  function apply() {
    const zip = draft.zipCode?.replace(/\D/g, "") ?? "";
    const city = draft.city?.trim() ?? "";
    onChange({
      ...draft,
      zipCode: zip.length === 4 ? zip : null,
      city: city || null,
      page: 1,
    });
    setOpen(false);
  }

  function toggleType(id: string) {
    setDraft((d) => {
      const has = d.types.includes(id);
      const types = has ? d.types.filter((t) => t !== id) : [...d.types, id];
      return { ...d, types: types.length ? types : d.types };
    });
  }

  function toggleEnergy(letter: string) {
    setDraft((d) => {
      const has = d.energyLabels.includes(letter);
      return {
        ...d,
        energyLabels: has ? d.energyLabels.filter((x) => x !== letter) : [...d.energyLabels, letter],
      };
    });
  }

  const draftExtra = advancedFilterCount(draft);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={openSheet} className="gap-2">
        <SlidersHorizontal className="size-4" />
        Filtre
        {extra > 0 ? (
          <span className="rounded-full bg-primary px-1.5 text-xs font-medium text-primary-fg">
            {extra}
          </span>
        ) : null}
      </Button>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-fg/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[88dvh] max-w-lg flex-col rounded-t-xl bg-bg outline-none">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border-strong" />
          <div className="flex items-center justify-between px-5 py-3">
            <Drawer.Title className="font-display text-2xl">Søgning</Drawer.Title>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full hover:bg-sunken"
              onClick={() => setOpen(false)}
              aria-label="Luk"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-4">
            <section>
              <PlacePicker value={draft} onChange={setDraft} />
            </section>

            <section>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Boligtype</p>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <Chip key={t.id} active={draft.types.includes(t.id)} onClick={() => toggleType(t.id)}>
                    {t.label}
                  </Chip>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                Makspris · {formatMio(draft.priceMax)}
              </p>
              <div className="flex flex-wrap gap-2">
                {PRICE_STEPS.map((n) => (
                  <Chip key={n} active={draft.priceMax === n} onClick={() => setDraft((d) => ({ ...d, priceMax: n }))}>
                    {formatMio(n)}
                  </Chip>
                ))}
                <Chip active={draft.priceMax == null} onClick={() => setDraft((d) => ({ ...d, priceMax: null }))}>
                  Ingen grænse
                </Chip>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Min. værelser</p>
                <div className="flex flex-wrap gap-2">
                  {[null, 3, 4, 5].map((n) => (
                    <Chip
                      key={String(n)}
                      active={draft.roomsMin === n}
                      onClick={() => setDraft((d) => ({ ...d, roomsMin: n }))}
                    >
                      {n == null ? "Alle" : `${n}+`}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Min. m²</p>
                <div className="flex flex-wrap gap-2">
                  {[null, 80, 120, 150].map((n) => (
                    <Chip
                      key={String(n)}
                      active={draft.areaMin === n}
                      onClick={() => setDraft((d) => ({ ...d, areaMin: n }))}
                    >
                      {n == null ? "Alle" : `${n}+`}
                    </Chip>
                  ))}
                </div>
              </div>
            </section>

            <FilterArea draft={draft} onDraft={setDraft} catalog={catalog} />

            <section>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Nye boliger</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={!draft.freshOnly} onClick={() => setDraft((d) => ({ ...d, freshOnly: false }))}>
                  Alle
                </Chip>
                <Chip active={draft.freshOnly} onClick={() => setDraft((d) => ({ ...d, freshOnly: true }))}>
                  Kun nye
                </Chip>
              </div>
              <p className="mt-1.5 text-xs text-faint">Ny i dag og inden for 7 dage på markedet — ikke det samme som uåbnede.</p>
            </section>

            <section className="rounded-xl border border-border bg-surface">
              <button
                type="button"
                className="flex h-12 w-full items-center justify-between px-4 text-left"
                onClick={() => setAdvanced((v) => !v)}
                aria-expanded={advanced}
              >
                <span className="text-sm font-medium">
                  Avanceret
                  {draftExtra > 0 ? (
                    <span className="ml-2 text-muted">({draftExtra})</span>
                  ) : null}
                </span>
                <ChevronDown className={cn("size-4 text-muted transition-transform", advanced && "rotate-180")} />
              </button>
              {advanced ? (
                <div className="space-y-5 border-t border-border px-4 py-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Min. pris</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip active={draft.priceMin == null} onClick={() => setDraft((d) => ({ ...d, priceMin: null }))}>
                        Alle
                      </Chip>
                      {PRICE_MIN_STEPS.map((n) => (
                        <Chip
                          key={n}
                          active={draft.priceMin === n}
                          onClick={() => setDraft((d) => ({ ...d, priceMin: n }))}
                        >
                          {formatMio(n)}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Energimærke</p>
                    <div className="flex flex-wrap gap-2">
                      {ENERGY_LABELS.map((letter) => (
                        <Chip
                          key={letter}
                          active={draft.energyLabels.includes(letter)}
                          onClick={() => toggleEnergy(letter)}
                        >
                          {letter}
                        </Chip>
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-faint">A2010/A2015 tæller som A. Vælg ét eller flere.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Bygget efter</p>
                      <div className="flex flex-wrap gap-2">
                        <Chip active={draft.yearFrom == null} onClick={() => setDraft((d) => ({ ...d, yearFrom: null }))}>
                          Alle
                        </Chip>
                        {YEAR_FROM.map((n) => (
                          <Chip
                            key={n}
                            active={draft.yearFrom === n}
                            onClick={() => setDraft((d) => ({ ...d, yearFrom: n }))}
                          >
                            {n}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Bygget før</p>
                      <div className="flex flex-wrap gap-2">
                        <Chip active={draft.yearTo == null} onClick={() => setDraft((d) => ({ ...d, yearTo: null }))}>
                          Alle
                        </Chip>
                        {YEAR_TO.map((n) => (
                          <Chip
                            key={n}
                            active={draft.yearTo === n}
                            onClick={() => setDraft((d) => ({ ...d, yearTo: n }))}
                          >
                            {n}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Maks. værelser</p>
                      <div className="flex flex-wrap gap-2">
                        {[null, 4, 5, 6].map((n) => (
                          <Chip
                            key={String(n)}
                            active={draft.roomsMax === n}
                            onClick={() => setDraft((d) => ({ ...d, roomsMax: n }))}
                          >
                            {n == null ? "Alle" : `${n}`}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Maks. m²</p>
                      <div className="flex flex-wrap gap-2">
                        {[null, 100, 150, 200].map((n) => (
                          <Chip
                            key={String(n)}
                            active={draft.areaMax === n}
                            onClick={() => setDraft((d) => ({ ...d, areaMax: n }))}
                          >
                            {n == null ? "Alle" : `${n}`}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Min. grund</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip active={draft.lotMin == null} onClick={() => setDraft((d) => ({ ...d, lotMin: null }))}>
                        Alle
                      </Chip>
                      {LOT_STEPS.map((n) => (
                        <Chip
                          key={n}
                          active={draft.lotMin === n}
                          onClick={() => setDraft((d) => ({ ...d, lotMin: n }))}
                        >
                          {n}+ m²
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Maks. grund</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip active={draft.lotMax == null} onClick={() => setDraft((d) => ({ ...d, lotMax: null }))}>
                        Alle
                      </Chip>
                      {LOT_MAX_STEPS.map((n) => (
                        <Chip
                          key={n}
                          active={draft.lotMax === n}
                          onClick={() => setDraft((d) => ({ ...d, lotMax: n }))}
                        >
                          {n} m²
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Maks. ejerudgift / md</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        active={draft.expenseMax == null}
                        onClick={() => setDraft((d) => ({ ...d, expenseMax: null }))}
                      >
                        Alle
                      </Chip>
                      {EXPENSE_STEPS.map((n) => (
                        <Chip
                          key={n}
                          active={draft.expenseMax === n}
                          onClick={() => setDraft((d) => ({ ...d, expenseMax: n }))}
                        >
                          {n.toLocaleString("da-DK")} kr
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Maks. m²-pris</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        active={draft.m2PriceMax == null}
                        onClick={() => setDraft((d) => ({ ...d, m2PriceMax: null }))}
                      >
                        Alle
                      </Chip>
                      {M2_PRICE_STEPS.map((n) => (
                        <Chip
                          key={n}
                          active={draft.m2PriceMax === n}
                          onClick={() => setDraft((d) => ({ ...d, m2PriceMax: n }))}
                        >
                          {n.toLocaleString("da-DK")} kr
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Maks. liggetid</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip active={draft.daysMax == null} onClick={() => setDraft((d) => ({ ...d, daysMax: null }))}>
                        Alle
                      </Chip>
                      {DAYS_STEPS.map((n) => (
                        <Chip
                          key={n}
                          active={draft.daysMax === n}
                          onClick={() => setDraft((d) => ({ ...d, daysMax: n }))}
                        >
                          {n} dage
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Postnr.</p>
                      <input
                        inputMode="numeric"
                        maxLength={4}
                        value={draft.zipCode ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, zipCode: e.target.value.replace(/\D/g, "").slice(0, 4) || null }))
                        }
                        placeholder="fx 5000"
                        className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">By</p>
                      <input
                        value={draft.city ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value || null }))}
                        placeholder="fx Odense C"
                        className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Faciliteter</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        active={draft.basement}
                        onClick={() => setDraft((d) => ({ ...d, basement: !d.basement }))}
                      >
                        Kælder
                      </Chip>
                      <Chip
                        active={draft.balcony}
                        onClick={() => setDraft((d) => ({ ...d, balcony: !d.balcony }))}
                      >
                        Altan
                      </Chip>
                      <Chip
                        active={draft.terrace}
                        onClick={() => setDraft((d) => ({ ...d, terrace: !d.terrace }))}
                      >
                        Terrasse
                      </Chip>
                      <Chip
                        active={draft.elevator}
                        onClick={() => setDraft((d) => ({ ...d, elevator: !d.elevator }))}
                      >
                        Elevator
                      </Chip>
                      <Chip
                        active={draft.priceDropOnly}
                        onClick={() => setDraft((d) => ({ ...d, priceDropOnly: !d.priceDropOnly }))}
                      >
                        Kun prisfald
                      </Chip>
                    </div>
                    <p className="mt-1.5 text-xs text-faint">
                      Altan, terrasse og elevator rammer især lejligheder. Kælder virker på huse.
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Sortér</p>
                    <div className="flex flex-wrap gap-2">
                      {SORT_OPTIONS.map((opt) => {
                        const active = draft.sortBy === opt.id && draft.sortAscending === opt.ascending;
                        return (
                          <Chip
                            key={`${opt.id}-${opt.ascending}`}
                            active={active}
                            onClick={() =>
                              setDraft((d) => ({ ...d, sortBy: opt.id, sortAscending: opt.ascending }))
                            }
                          >
                            {opt.label}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
          <div className="flex gap-2 border-t border-border px-5 py-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setDraft({ ...DEFAULT_FILTERS })}
            >
              Nulstil
            </Button>
            <Button className="flex-[2]" onClick={apply}>
              Vis {count > 0 ? "boliger" : "resultater"}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
