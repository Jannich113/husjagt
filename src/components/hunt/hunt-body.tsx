import { HouseCard } from "@/components/listings/house-card";
import { HouseDetail } from "@/components/listings/house-detail";
import { VideoRail } from "@/components/listings/reel-feed";
import type { District } from "@/lib/listings/districts";
import { HUNT_WIDE_PX, useMinWidth } from "@/lib/listings/layout";
import type { HuntView } from "@/lib/listings/share";
import type { SocialListenResult, SocialListing } from "@/lib/listings/social";
import type { GeoBounds, Listing, SearchFilters } from "@/lib/listings/types";
import { cn } from "@/lib/utils";
import { ClientMap } from "./client-map";
import { EmptyState } from "./empty-state";
import { ListenView } from "./listen-view";
import { LoadMore } from "./load-more";
import { forwardWheelToList } from "./wheel";

export function HuntBody({
  view,
  listings,
  openListing,
  filters,
  catalog,
  kommuneName,
  listenView,
  listenMatched,
  listenFound,
  listenAll,
  reelFocus,
  playableVideos,
  totalHits,
  hasMore,
  moreBusy,
  onOpenHouse,
  onOpenHouseId,
  onCloseHouse,
  onAreaChange,
  onView,
  onToggleListenAll,
  onLoadMore,
}: {
  view: HuntView;
  listings: Listing[];
  openListing: Listing | null;
  filters: SearchFilters;
  catalog: District[];
  kommuneName: string;
  listenView: SocialListenResult;
  listenMatched: number;
  listenFound: number;
  listenAll: boolean;
  reelFocus: string | null;
  playableVideos: SocialListing[];
  totalHits: number;
  hasMore: boolean;
  moreBusy: boolean;
  onOpenHouse: (listing: Listing) => void;
  onOpenHouseId: (id: string) => void;
  onCloseHouse: () => void;
  onAreaChange: (next: { boxes: GeoBounds[]; districts: string[] }) => void;
  onView: (next: HuntView, focus?: string | null) => void;
  onToggleListenAll: () => void;
  onLoadMore: () => void;
}) {
  const wide = useMinWidth(HUNT_WIDE_PX);

  if (view === "listen") {
    return (
      <ListenView
        kommuneName={kommuneName}
        result={listenView}
        matched={listenMatched}
        found={listenFound}
        showAll={listenAll}
        onShowAll={onToggleListenAll}
        startId={reelFocus}
      />
    );
  }

  if (view === "map") {
    return (
      <div className={cn("hunt-split", openListing && "is-open")} onWheel={forwardWheelToList}>
        <div className="hunt-map-pane">
          <ClientMap
            listings={listings}
            onSelect={onOpenHouseId}
            fill
            boxes={filters.boxes}
            districts={filters.districts}
            kommune={filters.municipality}
            catalog={catalog}
            onAreaChange={onAreaChange}
          />
        </div>
        <aside className="hunt-support-pane">
          {openListing ? (
            <HouseDetail listing={openListing} onBack={onCloseHouse} embedded={wide} />
          ) : listings.length === 0 ? (
            <div className="hunt-empty-pane">
              <p className="font-display text-xl text-fg">Ingen boliger i udsnittet</p>
              <p className="mt-2 text-sm">Tegn et andet område, eller ryd bydele og kortudsnit.</p>
            </div>
          ) : (
            <div className="hunt-empty-pane">
              <p className="font-display text-xl text-fg">Vælg et hus på kortet</p>
              <p className="mt-2 text-sm">Detaljerne åbner her ved siden af.</p>
            </div>
          )}
        </aside>
      </div>
    );
  }

  if (listings.length === 0) {
    return <EmptyState saved={view === "saved"} listen={false} />;
  }

  return (
    <div className={cn("hunt-split", openListing && "is-open")} onWheel={forwardWheelToList}>
      <div className="hunt-list-pane p-3">
        {view === "list" && playableVideos.length ? (
          <VideoRail
            listings={playableVideos}
            onOpenAll={() => onView("listen")}
            onSelect={(id) => onView("listen", id)}
          />
        ) : null}
        <div className="flex flex-col gap-2">
          {listings.map((listing) => (
            <HouseCard
              key={listing.id}
              listing={listing}
              onOpen={onOpenHouse}
              selected={openListing?.id === listing.id}
              layout="row"
            />
          ))}
        </div>
        {view !== "saved" ? (
          <LoadMore
            shown={listings.length}
            total={totalHits}
            hasMore={hasMore}
            busy={moreBusy}
            onMore={onLoadMore}
          />
        ) : null}
      </div>
      <div className="hunt-detail-pane">
        {openListing ? (
          <HouseDetail listing={openListing} onBack={onCloseHouse} embedded={wide} />
        ) : (
          <div className="hunt-empty-pane">
            <p className="font-display text-xl text-fg">Vælg et hus</p>
            <p className="mt-2 text-sm">Listen til venstre, boligen til højre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
