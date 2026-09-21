import { useState } from "react";
import { Drawer } from "vaul";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlacePicker } from "@/components/listings/place-picker";
import { FilterArea } from "@/components/listings/filter-area";
import { FilterChip as Chip } from "@/components/listings/filter-chip";
import { BoundPair, FilterSection, MaxRange, QuickPicks } from "@/components/listings/filter-range";
import { KeywordWatch } from "@/components/listings/keyword-watch";
import { formatKr, formatMio } from "@/lib/listings/format";
import { moduleOn } from "@/lib/hunt/modules";
import {
  AREA_BOUND,
  DAYS_BOUND,
  EXPENSE_BOUND,
  LOT_BOUND,
  M2_PRICE_BOUND,
  PRICE_BOUND,
  ROOM_BOUND,
  YEAR_BOUND,
} from "@/lib/listings/filter-range";
import type { District } from "@/lib/listings/districts";
import {
  DEFAULT_FILTERS,
  ENERGY_LABELS,
  PROPERTY_TYPES,
  advancedFilterCount,
  type SearchFilters,
} from "@/lib/listings/types";
import { cn } from "@/lib/utils";

const PRICE_PRESETS = [1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000, 8_000_000, 10_000_000];

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
          <span className="rounded-full bg-primary px-1.5 text-xs font-medium text-primary-fg">{extra}</span>
        ) : null}
      </Button>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-fg/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-xl bg-bg outline-none">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border-strong" />
          <div className="flex items-center justify-between px-6 py-3">
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
          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 pb-6">
            <FilterSection title="Område">
              <PlacePicker value={draft} onChange={setDraft} />
            </FilterSection>

            <FilterSection title="Boligtype">
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <Chip key={t.id} active={draft.types.includes(t.id)} onClick={() => toggleType(t.id)}>
                    {t.label}
                  </Chip>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Pris" hint="Træk eller skriv beløbet. Tomt felt = ingen grænse.">
              <BoundPair
                minValue={draft.priceMin}
                maxValue={draft.priceMax}
                bound={PRICE_BOUND}
                onMin={(priceMin) => setDraft((d) => ({ ...d, priceMin }))}
                onMax={(priceMax) => setDraft((d) => ({ ...d, priceMax }))}
                minLabel="Min. pris"
                maxLabel="Maks. pris"
                emptyMin="0 kr"
                emptyMax="Ingen grænse"
                suffix="kr"
                formatMax={formatMio}
              />
              <QuickPicks
                values={PRICE_PRESETS}
                active={draft.priceMax}
                onPick={(priceMax) => setDraft((d) => ({ ...d, priceMax }))}
                format={formatMio}
                noneLabel="Ingen grænse"
                noneActive={draft.priceMax == null}
                onNone={() => setDraft((d) => ({ ...d, priceMax: null }))}
              />
            </FilterSection>

            <FilterSection title="Værelser">
              <BoundPair
                minValue={draft.roomsMin}
                maxValue={draft.roomsMax}
                bound={ROOM_BOUND}
                onMin={(roomsMin) => setDraft((d) => ({ ...d, roomsMin }))}
                onMax={(roomsMax) => setDraft((d) => ({ ...d, roomsMax }))}
                minLabel="Mindst"
                maxLabel="Højst"
                emptyMin="Alle"
                emptyMax="Ingen grænse"
              />
            </FilterSection>

            <FilterSection title="Boligareal">
              <BoundPair
                minValue={draft.areaMin}
                maxValue={draft.areaMax}
                bound={AREA_BOUND}
                onMin={(areaMin) => setDraft((d) => ({ ...d, areaMin }))}
                onMax={(areaMax) => setDraft((d) => ({ ...d, areaMax }))}
                minLabel="Mindst"
                maxLabel="Højst"
                emptyMin="Alle"
                emptyMax="Ingen grænse"
                suffix="m²"
              />
            </FilterSection>

            <FilterArea draft={draft} onDraft={setDraft} catalog={catalog} />

            <FilterSection title="Nye boliger" hint="Ny i dag og inden for 7 dage på markedet — ikke det samme som uåbnede.">
              <div className="flex flex-wrap gap-2">
                <Chip active={!draft.freshOnly} onClick={() => setDraft((d) => ({ ...d, freshOnly: false }))}>
                  Alle
                </Chip>
                <Chip active={draft.freshOnly} onClick={() => setDraft((d) => ({ ...d, freshOnly: true }))}>
                  Kun nye
                </Chip>
              </div>
            </FilterSection>

            {moduleOn("keywords") ? <KeywordWatch /> : null}

            <section className="rounded-xl border border-border bg-surface">
              <button
                type="button"
                className="flex h-14 w-full items-center justify-between px-4 text-left"
                onClick={() => setAdvanced((v) => !v)}
                aria-expanded={advanced}
              >
                <span className="text-sm font-medium">
                  Avanceret
                  {draftExtra > 0 ? <span className="ml-2 text-muted">({draftExtra})</span> : null}
                </span>
                <ChevronDown className={cn("size-4 text-muted transition-transform", advanced && "rotate-180")} />
              </button>
              {advanced ? (
                <div className="space-y-8 border-t border-border px-4 py-6">
                  <FilterSection title="Energimærke" hint="A2010/A2015 tæller som A. Vælg ét eller flere.">
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
                  </FilterSection>

                  <FilterSection title="Byggeår">
                    <BoundPair
                      minValue={draft.yearFrom}
                      maxValue={draft.yearTo}
                      bound={YEAR_BOUND}
                      onMin={(yearFrom) => setDraft((d) => ({ ...d, yearFrom }))}
                      onMax={(yearTo) => setDraft((d) => ({ ...d, yearTo }))}
                      minLabel="Efter"
                      maxLabel="Før"
                      emptyMin="Alle"
                      emptyMax="Nu"
                    />
                  </FilterSection>

                  <FilterSection title="Grund">
                    <BoundPair
                      minValue={draft.lotMin}
                      maxValue={draft.lotMax}
                      bound={LOT_BOUND}
                      onMin={(lotMin) => setDraft((d) => ({ ...d, lotMin }))}
                      onMax={(lotMax) => setDraft((d) => ({ ...d, lotMax }))}
                      minLabel="Mindst"
                      maxLabel="Højst"
                      emptyMin="Alle"
                      emptyMax="Ingen grænse"
                      suffix="m²"
                    />
                  </FilterSection>

                  <FilterSection title="Ejerudgift / md">
                    <MaxRange
                      value={draft.expenseMax}
                      bound={EXPENSE_BOUND}
                      onChange={(expenseMax) => setDraft((d) => ({ ...d, expenseMax }))}
                      label="Maks. pr. måned"
                      suffix="kr"
                      format={(v) => (v == null ? "Ingen grænse" : `${formatKr(v)}/md`)}
                    />
                  </FilterSection>

                  <FilterSection title="m²-pris">
                    <MaxRange
                      value={draft.m2PriceMax}
                      bound={M2_PRICE_BOUND}
                      onChange={(m2PriceMax) => setDraft((d) => ({ ...d, m2PriceMax }))}
                      label="Maks. kr pr. m²"
                      suffix="kr"
                    />
                  </FilterSection>

                  <FilterSection title="Liggetid">
                    <MaxRange
                      value={draft.daysMax}
                      bound={DAYS_BOUND}
                      onChange={(daysMax) => setDraft((d) => ({ ...d, daysMax }))}
                      label="Maks. dage"
                      suffix="dage"
                    />
                  </FilterSection>

                  <FilterSection title="Postnr. og by">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label>
                        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Postnr.</span>
                        <input
                          inputMode="numeric"
                          maxLength={4}
                          value={draft.zipCode ?? ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, zipCode: e.target.value.replace(/\D/g, "").slice(0, 4) || null }))
                          }
                          placeholder="fx 5000"
                          className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-primary"
                        />
                      </label>
                      <label>
                        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">By</span>
                        <input
                          value={draft.city ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value || null }))}
                          placeholder="fx Odense C"
                          className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-primary"
                        />
                      </label>
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Faciliteter"
                    hint="Altan, terrasse og elevator rammer især lejligheder. Kælder virker på huse."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Chip active={draft.basement} onClick={() => setDraft((d) => ({ ...d, basement: !d.basement }))}>
                        Kælder
                      </Chip>
                      <Chip active={draft.balcony} onClick={() => setDraft((d) => ({ ...d, balcony: !d.balcony }))}>
                        Altan
                      </Chip>
                      <Chip active={draft.terrace} onClick={() => setDraft((d) => ({ ...d, terrace: !d.terrace }))}>
                        Terrasse
                      </Chip>
                      <Chip active={draft.elevator} onClick={() => setDraft((d) => ({ ...d, elevator: !d.elevator }))}>
                        Elevator
                      </Chip>
                      <Chip
                        active={draft.priceDropOnly}
                        onClick={() => setDraft((d) => ({ ...d, priceDropOnly: !d.priceDropOnly }))}
                      >
                        Kun prisfald
                      </Chip>
                    </div>
                  </FilterSection>
                </div>
              ) : null}
            </section>
          </div>
          <div className="flex gap-2 border-t border-border px-6 py-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() =>
                setDraft({
                  ...DEFAULT_FILTERS,
                  sortBy: draft.sortBy,
                  sortAscending: draft.sortAscending,
                })
              }
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
