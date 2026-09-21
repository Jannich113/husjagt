import { HouseCard } from "@/components/listings/house-card";
import { HouseDetail } from "@/components/listings/house-detail";
import { VideoRail } from "@/components/listings/reel-feed";
import type { District } from "@/lib/listings/districts";
import type { HuntView } from "@/lib/listings/share";
import type { SocialListenResult, SocialListing } from "@/lib/listings/social";
import type { GeoBounds, Listing, SearchFilters } from "@/lib/listings/types";
import { ClientMap } from "./client-map";
import { EmptyState } from "./empty-state";
import { ListenView } from "./listen-view";
import { forwardWheelToList } from "./wheel";

export function HuntBody({
  view,
  split,
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
  onOpenHouse,
  onOpenHouseId,
  onCloseHouse,
  onAreaChange,
  onView,
  onToggleListenAll,
}: {
  view: HuntView;
  split: boolean;
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
  onOpenHouse: (listing: Listing) => void;
  onOpenHouseId: (id: string) => void;
  onCloseHouse: () => void;
  onAreaChange: (next: { boxes: GeoBounds[]; districts: string[] }) => void;
  onView: (next: HuntView, focus?: string | null) => void;
  onToggleListenAll: () => void;
}) {
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
        split={split}
      />
    );
  }

  if (view === "map") {
    if (split) {
      return (
        <div className="hunt-split" onWheel={forwardWheelToList}>
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
              <HouseDetail listing={openListing} onBack={onCloseHouse} embedded />
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
    return (
      <div className="px-4 pb-8 md:px-6">
        <div className="relative isolate h-[min(32rem,62dvh)] overflow-hidden">
          <ClientMap
            listings={listings}
            onSelect={onOpenHouseId}
            boxes={filters.boxes}
            districts={filters.districts}
            kommune={filters.municipality}
            catalog={catalog}
            onAreaChange={onAreaChange}
          />
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return <EmptyState saved={view === "saved"} listen={false} />;
  }

  if (split) {
    return (
      <div className="hunt-split" onWheel={forwardWheelToList}>
        <div className="hunt-list-pane p-3">
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
        </div>
        <div className="hunt-detail-pane">
          {openListing ? (
            <HouseDetail listing={openListing} onBack={onCloseHouse} embedded />
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

  return (
    <div className="px-4 pb-24 md:px-6">
      {view === "list" && playableVideos.length ? (
        <VideoRail
          listings={playableVideos}
          onOpenAll={() => onView("listen")}
          onSelect={(id) => onView("listen", id)}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <HouseCard key={listing.id} listing={listing} onOpen={onOpenHouse} />
        ))}
      </div>
    </div>
  );
}
