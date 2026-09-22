import { Heart, LayoutGrid, Map as MapIcon, Radio, ChevronDown, MapPin } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useState } from "react";
import { FilterSheet } from "@/components/listings/filter-sheet";
import { PlacePicker } from "@/components/listings/place-picker";
import { ShareButton } from "@/components/listings/share-button";
import { SortMenu } from "@/components/listings/sort-menu";
import { StreetSearch } from "@/components/listings/street-search";
import { moduleOn } from "@/lib/hunt/modules";
import type { District } from "@/lib/listings/districts";
import { placeLabel } from "@/lib/listings/place";
import { huntPath, type HuntView } from "@/lib/listings/share";
import type { SearchFilters } from "@/lib/listings/types";
import { cn } from "@/lib/utils";
import { ListenAllButton } from "./listen-view";
import { ViewTab } from "./view-tab";
import { WatchSearchButton } from "./watch-search";
import { ConnectionsSheet } from "./connections-sheet";

export function HuntHeader({
  view,
  filters,
  share,
  countLabel,
  extras,
  sources,
  catalog,
  listenMatched,
  listenFound,
  listenAll,
  resultHits,
  streetQuery,
  onApply,
  onView,
  onToggleListenAll,
  onStreetQuery,
  filtersOpen,
  onFiltersOpenChange,
  hiddenCount = 0,
  showHidden = false,
  onToggleHidden,
  onClearHidden,
  listingIds = [],
  onOpenWatched,
}: {
  view: HuntView;
  filters: SearchFilters;
  share: { title: string; text: string; url: string };
  countLabel: string;
  typeSummary: string;
  extras: string[];
  sources: string[];
  catalog: District[];
  listenMatched: number;
  listenFound: number;
  listenAll: boolean;
  resultHits: number;
  streetQuery: string;
  onApply: (next: SearchFilters) => void;
  onView: (next: HuntView) => void;
  onToggleListenAll: () => void;
  onStreetQuery: (next: string) => void;
  filtersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  hiddenCount?: number;
  showHidden?: boolean;
  onToggleHidden?: () => void;
  onClearHidden?: () => void;
  listingIds?: string[];
  onOpenWatched?: () => void;
}) {
  const [areaOpen, setAreaOpen] = useState(false);
  const areaBits = [placeLabel(filters), streetQuery || null, extras[0] ?? null].filter(Boolean);
  const areaLabel = areaBits.join(" · ");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 px-4 py-2.5 backdrop-blur md:px-6 md:py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Danmark</p>
          <h1 className="font-display text-3xl leading-none">Husjagt</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShareButton
            title={share.title}
            text={share.text}
            url={share.url}
            label="Del"
            className="h-9 flex-none px-3.5 text-sm"
          />
          <ConnectionsSheet />
          <UserButton />
          {view !== "listen" ? <SortMenu value={filters} onChange={onApply} /> : null}
          <FilterSheet
            value={filters}
            onChange={onApply}
            count={view === "listen" ? listenMatched : resultHits}
            catalog={catalog}
            open={filtersOpen}
            onOpenChange={onFiltersOpenChange}
          />
        </div>
      </div>

      {moduleOn("placePicker") || (moduleOn("streetSearch") && view !== "listen") ? (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={areaOpen}
            onClick={() => setAreaOpen((open) => !open)}
            className="flex h-11 w-full items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-left"
          >
            <MapPin className="size-4 shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{areaLabel}</span>
            {extras.length > 1 ? (
              <span className="rounded-full bg-sunken px-2 py-0.5 text-xs text-muted">+{extras.length - 1}</span>
            ) : null}
            <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", areaOpen && "rotate-180")} />
          </button>
          {areaOpen ? (
            <div className="mt-3 space-y-3">
              {moduleOn("placePicker") ? <PlacePicker value={filters} onChange={onApply} compact /> : null}
              {moduleOn("streetSearch") && view !== "listen" ? (
                <StreetSearch value={streetQuery} onChange={onStreetQuery} />
              ) : null}
              {extras.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {extras.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
              {sources.length ? <p className="truncate text-xs text-faint">{sources.join(" · ")}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-full border border-border bg-surface p-1">
          <ViewTab active={view === "list"} view="list" href={huntPath(filters, "list", { q: streetQuery })} onClick={() => onView("list")} icon={<LayoutGrid className="size-4" />} label="Liste" />
          <ViewTab active={view === "map"} view="map" href={huntPath(filters, "map", { q: streetQuery })} onClick={() => onView("map")} icon={<MapIcon className="size-4" />} label="Kort" />
          {moduleOn("listen") ? (
            <ViewTab active={view === "listen"} view="listen" href={huntPath(filters, "listen", { q: streetQuery })} onClick={() => onView("listen")} icon={<Radio className="size-4" />} label="Lyt" />
          ) : null}
          {moduleOn("saved") ? (
            <ViewTab active={view === "saved"} view="saved" href={huntPath(filters, "saved", { q: streetQuery })} onClick={() => onView("saved")} icon={<Heart className="size-4" />} label="Gemte" />
          ) : null}
        </div>
        <p className="text-sm tabular-nums text-muted">{countLabel}</p>
        {view !== "listen" && view !== "saved" ? (
          <WatchSearchButton filters={filters} ids={listingIds} onOpenWatched={onOpenWatched ?? (() => {})} />
        ) : null}
        {moduleOn("dismiss") && hiddenCount > 0 && view !== "listen" ? (
          <>
            <button
              type="button"
              onClick={onToggleHidden}
              className={cn(
                "h-8 rounded-full border px-3 text-xs font-medium",
                showHidden ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-fg",
              )}
            >
              {showHidden ? "Skjul igen" : `Vis skjulte (${hiddenCount})`}
            </button>
            {showHidden ? (
              <button
                type="button"
                onClick={onClearHidden}
                className="h-8 rounded-full border border-border bg-surface px-3 text-xs font-medium"
              >
                Gendan alle
              </button>
            ) : null}
          </>
        ) : null}
        {view === "listen" ? (
          <ListenAllButton
            showAll={listenAll}
            matched={listenMatched}
            found={listenFound}
            onToggle={onToggleListenAll}
          />
        ) : null}
      </div>
    </header>
  );
}
