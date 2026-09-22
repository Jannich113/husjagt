import { useEffect, useRef, useState } from "react";
import { HouseCard } from "@/components/listings/house-card";
import { HouseDetail } from "@/components/listings/house-detail";
import { VideoRail } from "@/components/listings/reel-feed";
import type { District } from "@/lib/listings/districts";
import type { KommuneView } from "@/lib/listings/kommune-view";
import { HUNT_WIDE_PX, useMinWidth } from "@/lib/listings/layout";
import type { HuntView } from "@/lib/listings/share";
import type { SocialListenResult, SocialListing } from "@/lib/listings/social";
import type { GeoBounds, Listing, SearchFilters } from "@/lib/listings/types";
import { cn } from "@/lib/utils";
import { ClientMap } from "./client-map";
import { EmptyState } from "./empty-state";
import { HuntLoading, ListingRowSkeleton, ListenSkeleton } from "./hunt-loading";
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
  placeView,
  listenView,
  listenMatched,
  listenFound,
  listenAll,
  reelFocus,
  playableVideos,
  totalHits,
  hasMore,
  moreBusy,
  live,
  busy,
  onOpenHouse,
  onOpenHouseId,
  onCloseHouse,
  onAreaChange,
  onView,
  onToggleListenAll,
  onLoadMore,
  onAdjustFilters,
}: {
  view: HuntView;
  listings: Listing[];
  openListing: Listing | null;
  filters: SearchFilters;
  catalog: District[];
  kommuneName: string;
  placeView: KommuneView | null;
  listenView: SocialListenResult;
  listenMatched: number;
  listenFound: number;
  listenAll: boolean;
  reelFocus: string | null;
  playableVideos: SocialListing[];
  totalHits: number;
  hasMore: boolean;
  moreBusy: boolean;
  live: boolean;
  busy: boolean;
  onOpenHouse: (listing: Listing) => void;
  onOpenHouseId: (id: string) => void;
  onCloseHouse: () => void;
  onAreaChange: (next: { boxes: GeoBounds[]; districts: string[] }) => void;
  onView: (next: HuntView, focus?: string | null) => void;
  onToggleListenAll: () => void;
  onLoadMore: () => void;
  onAdjustFilters: () => void;
}) {
  const wide = useMinWidth(HUNT_WIDE_PX);
  const waiting = busy && listings.length < 4 && view !== "saved";
  const stamp = listings[0]?.id ?? "";
  const listPane = useRef<HTMLDivElement>(null);
  const [painted, setPainted] = useState(8);
  const paintedRef = useRef(painted);
  const loadedRef = useRef(listings.length);
  paintedRef.current = painted;
  loadedRef.current = listings.length;
  useEffect(() => {
    setPainted(8);
  }, [stamp]);
  useEffect(() => {
    if (painted >= listings.length) return;
    const el = listPane.current;
    if (el && el.scrollHeight > el.clientHeight + 48) return;
    const timer = window.setTimeout(() => {
      setPainted((count) => Math.min(listings.length, count + 8));
    }, 60);
    return () => window.clearTimeout(timer);
  }, [painted, listings.length]);
  useEffect(() => {
    const el = listPane.current;
    if (!el || (view !== "list" && view !== "saved")) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 240) return;
      if (paintedRef.current < loadedRef.current) {
        setPainted((count) => Math.min(loadedRef.current, count + 8));
        return;
      }
      if (hasMore && !moreBusy) onLoadMore();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [view, hasMore, moreBusy, onLoadMore, stamp]);
  const rows = view === "list" || view === "saved" ? listings.slice(0, painted) : listings;
  useEffect(() => {
    if (view !== "list" || painted < listings.length || !hasMore || moreBusy) return;
    const el = listPane.current;
    if (!el || el.scrollHeight > el.clientHeight + 48) return;
    onLoadMore();
  }, [view, painted, listings.length, hasMore, moreBusy, onLoadMore]);

  if (view === "listen") {
    if (busy && !listenView.listings.length) return <ListenSkeleton />;
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
      <div className={cn("hunt-split hunt-split-map", openListing && "is-open")} onWheel={forwardWheelToList}>
        <div className="hunt-map-pane">
          <ClientMap
            listings={listings}
            onSelect={onOpenHouseId}
            fill
            boxes={filters.boxes}
            districts={filters.districts}
            kommune={filters.municipality}
            focus={placeView}
            catalog={catalog}
            onAreaChange={onAreaChange}
          />
          {waiting ? (
            <div className="hunt-map-loading">
              <HuntLoading place={kommuneName} compact />
            </div>
          ) : null}
        </div>
        {openListing ? (
          <aside className="hunt-support-pane">
            <HouseDetail listing={openListing} onBack={onCloseHouse} embedded={wide} />
          </aside>
        ) : null}
      </div>
    );
  }

  if (waiting) {
    return <HuntLoading place={kommuneName} />;
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        saved={view === "saved"}
        listen={false}
        onAdjustFilters={onAdjustFilters}
        liveFailed={view !== "saved" && !live}
      />
    );
  }

  return (
    <div className={cn("hunt-split", openListing && "is-open")} onWheel={forwardWheelToList}>
      <div
        ref={listPane}
        className="hunt-list-pane p-3"
      >
        {view === "list" && playableVideos.length ? (
          <VideoRail
            listings={playableVideos}
            onOpenAll={() => onView("listen")}
            onSelect={(id) => onView("listen", id)}
          />
        ) : null}
        <div className="flex flex-col gap-2">
          {rows.map((listing) => (
            <HouseCard
              key={listing.id}
              listing={listing}
              onOpen={onOpenHouse}
              selected={openListing?.id === listing.id}
              layout="row"
            />
          ))}
          {view === "list" && painted < listings.length
            ? Array.from({ length: Math.min(4, listings.length - painted) }, (_, i) => (
                <ListingRowSkeleton key={`skel-${i}`} />
              ))
            : null}
          {moreBusy ? <ListingRowSkeleton /> : null}
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
