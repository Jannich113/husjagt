import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heart, LayoutGrid, Map as MapIcon, LoaderCircle, Radio } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FilterSheet } from "@/components/listings/filter-sheet";
import { HouseCard } from "@/components/listings/house-card";
import { HouseDetail } from "@/components/listings/house-detail";
import { NavRail } from "@/components/listings/nav-rail";
import { ReelFeed, VideoRail } from "@/components/listings/reel-feed";
import { ShareButton } from "@/components/listings/share-button";
import { SocialCard } from "@/components/listings/social-card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/listings/favorites";
import { kommuneBySlug } from "@/lib/listings/kommuner";
import { extraFilterLabels, formatKr, formatMio, typeLabel } from "@/lib/listings/format";
import { useSizeClass } from "@/lib/listings/layout";
import { listenSocial, searchHouses, searchHousesFast } from "@/lib/listings/search";
import {
  filtersFromHunt,
  huntDocumentTitle,
  huntFromFilters,
  huntShareCopy,
  parseHuntSearch,
  rememberHunt,
  viewFromHunt,
  appShareCopy,
  type HuntSearch,
  type HuntView,
} from "@/lib/listings/share";
import { isPlayableVideo, isVideoPost, withLocalVideos, type SocialListenResult } from "@/lib/listings/social";
import type { Listing, SearchFilters, SearchResult } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HuntSearch => parseHuntSearch(search),
  loaderDeps: ({ search }: { search: HuntSearch }) => search,
  loader: ({ deps }) => searchHousesFast({ data: filtersFromHunt(deps ?? {}) }),
  head: ({ match }) => {
    const filters = filtersFromHunt(match.search);
    const share = huntShareCopy(filters);
    return {
      meta: [
        { title: huntDocumentTitle(filters) },
        { name: "description", content: share.text },
      ],
    };
  },
  component: Home,
});

type ListenTab = "all" | "video" | "posts";

const VIEW_KEY = "husjagt:view";

function storedView(fallback: HuntView): HuntView {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(VIEW_KEY);
    if (raw === "list" || raw === "map" || raw === "listen" || raw === "saved") return raw;
  } catch {
    /* ignore */
  }
  return fallback;
}

function Home() {
  const hunt = Route.useSearch() ?? {};
  const huntKey = JSON.stringify(hunt);
  const initial = Route.useLoaderData();
  const navigate = useNavigate({ from: "/" });
  const filters = useMemo(() => filtersFromHunt(JSON.parse(huntKey) as HuntSearch), [huntKey]);
  const [view, setView] = useState<HuntView>(() => storedView(viewFromHunt(hunt)));
  const [openListing, setOpenListing] = useState<Listing | null>(null);
  const [result, setResult] = useState<SearchResult>(initial);
  const [social, setSocial] = useState<SocialListenResult>({ listings: [], live: false, sources: [] });
  const [socialReady, setSocialReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [reelFocus, setReelFocus] = useState<string | null>(null);
  const savedIds = useFavorites((s) => s.ids);
  const savedMap = useFavorites((s) => s.items);
  const hydrate = useFavorites((s) => s.hydrate);
  const savedItems = useMemo(
    () => savedIds.map((id) => savedMap[id]).filter((row): row is Listing => Boolean(row)),
    [savedIds, savedMap],
  );
  const share = useMemo(() => appShareCopy(), []);
  const size = useSizeClass();
  const split = size !== "compact";

  useEffect(() => {
    hydrate();
    document.body.style.removeProperty("pointer-events");
    document.body.style.removeProperty("overflow");
  }, [hydrate]);

  useEffect(() => {
    rememberHunt(hunt);
  }, [hunt]);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    void searchHouses({ data: filters })
      .then((houses) => {
        if (!alive) return;
        setResult(houses);
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [filters]);

  useEffect(() => {
    let alive = true;
    setSocialReady(false);
    void listenSocial({ data: filters })
      .then((posts) => {
        if (!alive) return;
        setSocial(posts);
        setSocialReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setSocialReady(true);
      });
    return () => {
      alive = false;
    };
  }, [filters]);

  function apply(next: SearchFilters) {
    void navigate({
      search: huntFromFilters(next, "list"),
    });
  }

  function goView(next: HuntView, focus: string | null = null) {
    setReelFocus(focus);
    setView(next);
    try {
      window.sessionStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function openHouse(listing: Listing) {
    setOpenListing(listing);
  }

  const listings = view === "saved" ? savedItems : result.listings;
  const kommune = kommuneBySlug(filters.municipality);
  const typeSummary = useMemo(
    () => filters.types.map(typeLabel).join(", "),
    [filters.types],
  );
  const extras = useMemo(() => extraFilterLabels(filters), [filters]);
  const listen = useMemo(
    () => withLocalVideos(social, filters),
    [social, filters],
  );
  const listenCount = listen.listings.length;
  const videoCount = listen.listings.filter(isVideoPost).length;
  const playableVideos = useMemo(() => listen.listings.filter(isPlayableVideo), [listen.listings]);
  const countLabel =
    view === "saved"
      ? `${savedItems.length} boliger`
      : view === "listen"
        ? `${listenCount} opslag`
        : `${result.totalHits} boliger`;

  useEffect(() => {
    if (!split || (view !== "list" && view !== "saved" && view !== "map")) return;
    const pool = view === "saved" ? savedItems : result.listings;
    setOpenListing((current) => {
      if (current && pool.some((row) => row.id === current.id)) return current;
      return pool[0] ?? null;
    });
  }, [split, view, result.listings, savedItems]);

  function openHouseId(id: string) {
    const found = result.listings.find((row) => row.id === id) ?? savedItems.find((row) => row.id === id);
    if (found) setOpenListing(found);
  }

  return (
    <div
      className={cn(split ? "hunt-app-split" : "mx-auto min-h-dvh max-w-6xl")}
      data-size={size}
    >
      {split ? (
        <NavRail view={view} savedCount={savedItems.length} onView={goView} />
      ) : null}
      {!split && openListing ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-bg">
          <HouseDetail listing={openListing} onBack={() => setOpenListing(null)} />
        </div>
      ) : null}
      <div className={split ? "hunt-main" : undefined}>
        <header className={cn("border-b border-border bg-bg px-4 py-2.5", !split && "sticky top-0 z-50 bg-bg/95 backdrop-blur md:px-6 md:py-3")}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {split ? null : (
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Danmark</p>
              )}
              <h1 className={cn("font-display leading-none", split ? "text-2xl" : "text-3xl")}>Husjagt</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ShareButton
                title={share.title}
                text={share.text}
                url="/"
                label="Del"
                className="h-9 flex-none px-3.5 text-sm"
              />
              <FilterSheet
                value={filters}
                onChange={apply}
                count={view === "listen" ? listenCount : result.totalHits}
              />
            </div>
          </div>
          <p className="mt-2 truncate text-sm text-muted">
            {kommune?.name ?? "Hele landet"} · {typeSummary} · max {formatMio(filters.priceMax)}
            {split ? ` · ${countLabel}` : ""}
          </p>
          {split && result.sources.length ? (
            <p className="mt-1 truncate text-xs text-faint">{result.sources.join(" · ")}</p>
          ) : null}
          {extras.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
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
          {split ? null : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex overflow-x-auto rounded-full border border-border bg-surface p-1">
                <ViewTab active={view === "list"} onClick={() => goView("list")} icon={<LayoutGrid className="size-4" />} label="Liste" />
                <ViewTab active={view === "map"} onClick={() => goView("map")} icon={<MapIcon className="size-4" />} label="Kort" />
                <ViewTab active={view === "listen"} onClick={() => goView("listen")} icon={<Radio className="size-4" />} label="Lyt" />
                <ViewTab active={view === "saved"} onClick={() => goView("saved")} icon={<Heart className="size-4" />} label="Gemte" />
              </div>
              <p className="ml-auto text-sm tabular-nums text-muted">{countLabel}</p>
            </div>
          )}
        </header>

        {split ? null : (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs text-faint md:px-6">
          {view === "listen" ? (
            <>
              <span className="rounded-full border border-border bg-surface px-2.5 py-1">
                {listen.live ? "Live lyt i området" : listen.sources[0] ?? "Ingen kilder"}
              </span>
              <span>
                {listen.sources.length
                  ? listen.sources.join(" · ")
                  : "Instagram · TikTok · GulogGratis · DBA"}
              </span>
              {videoCount ? <span>{videoCount} videoer</span> : null}
            </>
          ) : (
            <>
              <span className="rounded-full border border-border bg-surface px-2.5 py-1">
                {result.live ? `Live fra ${result.sources.length || 1} kilder` : result.source}
              </span>
              <span>
                {result.sources.length
                  ? result.sources.join(" · ")
                  : "Boligsiden · Boliga · GulogGratis · DBA"}
              </span>
              {playableVideos.length ? (
                <button
                  type="button"
                  onClick={() => goView("listen")}
                  className="rounded-full border border-border bg-surface px-2.5 py-1"
                >
                  {playableVideos.length} {playableVideos.length === 1 ? "video" : "videoer"} på Instagram og TikTok
                </button>
              ) : null}
            </>
          )}
        </div>
        )}

        {busy || (view === "listen" && !socialReady && !playableVideos.length) ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
            <LoaderCircle className="size-4 animate-spin" />
            {view === "listen" ? "Lytter efter opslag…" : "Henter boliger…"}
          </div>
        ) : null}

        <div className={split ? "hunt-body" : undefined}>
          {view === "listen" ? (
            <ListenView
              kommuneName={kommune?.name ?? "området"}
              result={listen}
              startId={reelFocus}
              split={split}
            />
          ) : view === "map" ? (
            listings.length === 0 ? (
              <EmptyState saved={false} listen={false} />
            ) : split ? (
              <div className="hunt-split">
                <div className="hunt-map-pane">
                  <ClientMap listings={listings} onSelect={openHouseId} fill />
                </div>
                <aside className="hunt-support-pane">
                  {openListing ? (
                    <HouseDetail listing={openListing} onBack={() => setOpenListing(null)} embedded />
                  ) : (
                    <div className="hunt-empty-pane">
                      <p className="font-display text-xl text-fg">Vælg et hus på kortet</p>
                      <p className="mt-2 text-sm">Detaljerne åbner her ved siden af.</p>
                    </div>
                  )}
                </aside>
              </div>
            ) : (
              <div className="px-4 pb-8 md:px-6">
                <div className="relative z-0 isolate h-[min(70dvh,720px)] overflow-hidden">
                  <ClientMap listings={listings} onSelect={openHouseId} />
                </div>
              </div>
            )
          ) : listings.length === 0 ? (
            <EmptyState saved={view === "saved"} listen={false} />
          ) : split ? (
            <div className="hunt-split">
              <div className="hunt-list-pane p-3">
                <div className="flex flex-col gap-2">
                  {listings.map((listing) => (
                    <HouseCard
                      key={listing.id}
                      listing={listing}
                      onOpen={openHouse}
                      selected={openListing?.id === listing.id}
                      layout="row"
                    />
                  ))}
                </div>
              </div>
              <div className="hunt-detail-pane">
                {openListing ? (
                  <HouseDetail listing={openListing} onBack={() => setOpenListing(null)} embedded />
                ) : (
                  <div className="hunt-empty-pane">
                    <p className="font-display text-xl text-fg">Vælg et hus</p>
                    <p className="mt-2 text-sm">Listen til venstre, boligen til højre.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 pb-24 md:px-6">
              {view === "list" && playableVideos.length ? (
                <VideoRail
                  listings={playableVideos}
                  onOpenAll={() => goView("listen")}
                  onSelect={(id) => goView("listen", id)}
                />
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <HouseCard key={listing.id} listing={listing} onOpen={openHouse} />
                ))}
              </div>
            </div>
          )}
        </div>

        {!split && view === "list" && result.listings[0] ? (
          <p className="px-4 pb-10 text-xs text-faint md:px-6">
            Laveste pris i udsnittet: {formatKr(result.listings[0].price)}. Data aggregeres fra Boligsiden, som samler
            salgsopstillinger fra de danske mæglerkæder.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ListenView({
  kommuneName,
  result,
  startId,
  split = false,
}: {
  kommuneName: string;
  result: SocialListenResult;
  startId?: string | null;
  split?: boolean;
}) {
  const [tab, setTab] = useState<ListenTab>("all");
  const playable = result.listings.filter(isPlayableVideo);
  const linkedVideos = result.listings.filter((item) => isVideoPost(item) && !item.video);
  const posts = result.listings.filter((item) => !isVideoPost(item));

  if (!result.listings.length) {
    return <EmptyState saved={false} listen />;
  }

  const showVideo = tab !== "posts" && (playable.length > 0 || linkedVideos.length > 0);
  const showPosts = tab !== "video" && posts.length > 0;
  const videoCount = playable.length + linkedVideos.length;

  if (split) {
    return (
      <div className="hunt-split">
        <div className="hunt-detail-pane p-4">
          {playable.length ? <ReelFeed listings={playable} startId={startId} /> : null}
          {!playable.length && linkedVideos.length ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {linkedVideos.map((listing) => (
                <SocialCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : null}
          {!playable.length && !linkedVideos.length ? (
            <div className="hunt-empty-pane">
              <p className="font-display text-xl text-fg">Ingen videoer i udsnittet</p>
              <p className="mt-2 text-sm">Private opslag ligger i ruden til højre.</p>
            </div>
          ) : null}
        </div>
        <div className="hunt-list-pane p-3">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Private opslag</p>
          {posts.length ? (
            <div className="flex flex-col gap-3">
              {posts.map((listing) => (
                <SocialCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Ingen tekstopslag i området.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 md:px-6">
      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted">
        Boligvideoer fra Instagram og TikTok i {kommuneName}, plus private opslag på GulogGratis, DBA og selvsalg.
      </p>
      <div className="mb-5 flex overflow-x-auto rounded-full border border-border bg-surface p-1">
        <ViewTab active={tab === "all"} onClick={() => setTab("all")} icon={null} label="Alle" />
        <ViewTab
          active={tab === "video"}
          onClick={() => setTab("video")}
          icon={null}
          label={`Video ${videoCount}`}
        />
        <ViewTab
          active={tab === "posts"}
          onClick={() => setTab("posts")}
          icon={null}
          label={`Opslag ${posts.length}`}
        />
      </div>
      {showVideo && playable.length ? <ReelFeed listings={playable} startId={startId} /> : null}
      {showVideo && linkedVideos.length ? (
        <div className="mb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Flere videoopslag</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {linkedVideos.map((listing) => (
              <SocialCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      ) : null}
      {showPosts ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((listing) => (
            <SocialCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
      {tab === "video" && !playable.length && !linkedVideos.length ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center text-sm text-muted">
          Ingen Instagram- eller TikTok-videoer i den valgte kommune endnu.
        </p>
      ) : null}
    </div>
  );
}

function ClientMap({
  listings,
  onSelect,
  fill = false,
}: {
  listings: Listing[];
  onSelect: (id: string) => void;
  fill?: boolean;
}) {
  const [MapCmp, setMapCmp] = useState<null | typeof import("@/components/listings/listing-map").ListingMap>(null);
  useEffect(() => {
    let alive = true;
    void import("@/components/listings/listing-map").then((mod) => {
      if (alive) setMapCmp(() => mod.ListingMap);
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!MapCmp) {
    return <div className={fill ? "size-full bg-sunken" : "h-full min-h-[420px] rounded-xl border border-border bg-sunken"} />;
  }
  return <MapCmp listings={listings} onSelect={onSelect} fill={fill} />;
}

function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex h-9 items-center gap-1.5 rounded-full px-3 text-sm " +
        (active ? "bg-primary text-primary-fg" : "text-muted")
      }
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ saved, listen }: { saved: boolean; listen: boolean }) {
  return (
    <div className="mx-4 my-8 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center md:mx-6">
      <p className="font-display text-2xl">
        {saved ? "Ingen gemte boliger endnu" : listen ? "Ingen sociale opslag i området" : "Ingen boliger matcher"}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        {saved
          ? "Tryk på hjertet på et hus for at lægge det her."
          : listen
            ? "Lyt kigger Instagram, TikTok, GulogGratis, DBA og privat selvsalg efter huse i den valgte kommune."
            : "Prøv at hæve maksprisen, slå kortudsnittet fra, eller vælg en anden kommune."}
      </p>
      {!saved ? (
        <Button
          className="mt-6"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Justér filtre
        </Button>
      ) : null}
    </div>
  );
}
