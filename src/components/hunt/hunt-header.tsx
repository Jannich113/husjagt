import { Heart, LayoutGrid, Map as MapIcon, Radio } from "lucide-react";
import { FilterSheet } from "@/components/listings/filter-sheet";
import { PlacePicker } from "@/components/listings/place-picker";
import { ShareButton } from "@/components/listings/share-button";
import { SortMenu } from "@/components/listings/sort-menu";
import { StreetSearch } from "@/components/listings/street-search";
import { moduleOn } from "@/lib/hunt/modules";
import type { District } from "@/lib/listings/districts";
import { placeLabel } from "@/lib/listings/place";
import { formatMio } from "@/lib/listings/format";
import type { HuntView } from "@/lib/listings/share";
import type { SearchFilters } from "@/lib/listings/types";
import { ListenAllButton } from "./listen-view";
import { ViewTab } from "./view-tab";

export function HuntHeader({
  view,
  filters,
  share,
  countLabel,
  typeSummary,
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
}) {
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
          {view !== "listen" ? <SortMenu value={filters} onChange={onApply} /> : null}
          <FilterSheet
            value={filters}
            onChange={onApply}
            count={view === "listen" ? listenMatched : resultHits}
            catalog={catalog}
          />
        </div>
      </div>
      {moduleOn("placePicker") ? (
        <div className="mt-3">
          <PlacePicker value={filters} onChange={onApply} />
        </div>
      ) : null}
      {moduleOn("streetSearch") && view !== "listen" ? (
        <StreetSearch value={streetQuery} onChange={onStreetQuery} />
      ) : null}
      <p className="mt-2 text-sm text-muted">
        {placeLabel(filters)} · {typeSummary} · max {formatMio(filters.priceMax)}
      </p>
      {sources.length ? <p className="mt-1 truncate text-xs text-faint">{sources.join(" · ")}</p> : null}
      {extras.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {extras.map((label) => (
            <span key={label} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted">
              {label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-full border border-border bg-surface p-1">
          <ViewTab active={view === "list"} onClick={() => onView("list")} icon={<LayoutGrid className="size-4" />} label="Liste" />
          <ViewTab active={view === "map"} onClick={() => onView("map")} icon={<MapIcon className="size-4" />} label="Kort" />
          {moduleOn("listen") ? (
            <ViewTab active={view === "listen"} onClick={() => onView("listen")} icon={<Radio className="size-4" />} label="Lyt" />
          ) : null}
          {moduleOn("saved") ? (
            <ViewTab active={view === "saved"} onClick={() => onView("saved")} icon={<Heart className="size-4" />} label="Gemte" />
          ) : null}
        </div>
        <p className="text-sm tabular-nums text-muted">{countLabel}</p>
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
