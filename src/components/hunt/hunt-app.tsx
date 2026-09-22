import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { appendSearchPage } from "@/lib/listings/aggregate";
import { visibleListings } from "@/lib/hunt/visible";
import { useFavorites } from "@/lib/listings/favorites";
import { useFirstSeen } from "@/lib/listings/fresh";
import { useKeywords } from "@/lib/listings/keywords";
import { placeLabel } from "@/lib/listings/place";
import { districtsForKommune, rememberDistricts, type District } from "@/lib/listings/districts";
import { extraFilterLabels, typeLabel } from "@/lib/listings/format";
import { listenSocial, loadKommuneDistricts, searchHouses } from "@/lib/listings/search";
import { loadOfflineSearch, saveOfflineSearch } from "@/lib/listings/offline-cache";
import {
  filtersFromHunt,
  huntFromFilters,
  huntShareCopy,
  rememberHunt,
  viewFromHunt,
  type HuntSearch,
  type HuntView,
} from "@/lib/listings/share";
import { useSeen } from "@/lib/listings/seen";
import {
  displayedListenListings,
  isPlayableVideo,
  listenCountLabel,
  withLocalVideos,
  type SocialListenResult,
} from "@/lib/listings/social";
import { useSocialWatch } from "@/lib/listings/social-watch";
import type { Listing, SearchFilters, SearchResult } from "@/lib/listings/types";
import { HuntBody } from "./hunt-body";
import { HuntHeader } from "./hunt-header";

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

export function HuntApp({ hunt, initial }: { hunt: HuntSearch; initial: SearchResult }) {
  const filterHunt = { ...hunt, q: undefined, view: undefined };
  const huntKey = JSON.stringify(filterHunt);
  const navigate = useNavigate({ from: "/" });
  const filters = useMemo(() => filtersFromHunt(JSON.parse(huntKey) as HuntSearch), [huntKey]);
  const streetQuery = hunt.q ?? "";
  const [view, setView] = useState<HuntView>(() => storedView(viewFromHunt(hunt)));
  const [openListing, setOpenListing] = useState<Listing | null>(null);
  const [result, setResult] = useState<SearchResult>(initial);
  const [social, setSocial] = useState<SocialListenResult>({ listings: [], all: [], found: 0, live: false, sources: [] });
  const [socialReady, setSocialReady] = useState(false);
  const [listenAll, setListenAll] = useState(false);
  const [busy, setBusy] = useState(true);
  const [moreBusy, setMoreBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [areaDistricts, setAreaDistricts] = useState<District[]>(() => districtsForKommune("odense"));
  const [reelFocus, setReelFocus] = useState<string | null>(null);
  const savedIds = useFavorites((s) => s.ids);
  const savedMap = useFavorites((s) => s.items);
  const hydrate = useFavorites((s) => s.hydrate);
  const hydrateSeen = useSeen((s) => s.hydrate);
  const markSeen = useSeen((s) => s.mark);
  const hydrateFirstSeen = useFirstSeen((s) => s.hydrate);
  const rememberFirstSeen = useFirstSeen((s) => s.remember);
  const firstSeenAt = useFirstSeen((s) => s.seenAt);
  const hydrateWatch = useSocialWatch((s) => s.hydrate);
  const watchReady = useSocialWatch((s) => s.ready);
  const socialAccounts = useSocialWatch((s) => s.accounts);
  const socialTags = useSocialWatch((s) => s.tags);
  const hydrateKeywords = useKeywords((s) => s.hydrate);
  const keywordWords = useKeywords((s) => s.words);
  const keywordMode = useKeywords((s) => s.mode);
  const savedItems = useMemo(
    () => savedIds.map((id) => savedMap[id]).filter((row): row is Listing => Boolean(row)),
    [savedIds, savedMap],
  );
  const share = useMemo(() => huntShareCopy(filters, view, { q: streetQuery }), [filters, view, streetQuery]);

  useEffect(() => {
    hydrate();
    hydrateSeen();
    hydrateFirstSeen();
    hydrateWatch();
    hydrateKeywords();
    document.body.style.removeProperty("pointer-events");
    document.body.style.removeProperty("overflow");
  }, [hydrate, hydrateSeen, hydrateFirstSeen, hydrateWatch, hydrateKeywords]);

  useEffect(() => {
    rememberHunt(hunt);
  }, [hunt]);

  useEffect(() => {
    let alive = true;
    setAreaDistricts(districtsForKommune(filters.municipality));
    void loadKommuneDistricts({ data: { municipality: filters.municipality } })
      .then((rows) => {
        if (!alive || !rows.length) return;
        rememberDistricts(filters.municipality, rows);
        setAreaDistricts(rows);
      })
      .catch(() => {
        /* baked Odense polygons stay as fallback */
      });
    return () => {
      alive = false;
    };
  }, [filters.municipality]);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    setPage(1);
    void searchHouses({ data: { ...filters, page: 1 } })
      .then((houses) => {
        if (!alive) return;
        setResult(houses);
        saveOfflineSearch(filters, houses);
        setHasMore(houses.listings.length >= filters.perPage || houses.totalHits > houses.listings.length);
      })
      .catch(() => {
        if (!alive) return;
        const cached = loadOfflineSearch();
        if (cached) setResult(cached.result);
        setHasMore(false);
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [filters]);

  function loadMore() {
    if (moreBusy || !hasMore) return;
    const next = page + 1;
    setMoreBusy(true);
    void searchHouses({ data: { ...filters, page: next } })
      .then((extra) => {
        setResult((current) => appendSearchPage(current, extra));
        setPage(next);
        setHasMore(extra.listings.length >= filters.perPage);
      })
      .finally(() => setMoreBusy(false));
  }

  useEffect(() => {
    if (!watchReady) return;
    let alive = true;
    setSocialReady(false);
    void listenSocial({
      data: { ...filters, socialAccounts, socialTags },
    })
      .then((posts) => {
        if (!alive) return;
        setSocial({
          live: posts.live ?? false,
          sources: posts.sources ?? [],
          listings: posts.listings ?? [],
          all: posts.all ?? posts.listings ?? [],
          found: posts.found ?? posts.listings?.length ?? 0,
        });
        setSocialReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setSocialReady(true);
      });
    return () => {
      alive = false;
    };
  }, [filters, watchReady, socialAccounts, socialTags]);

  function apply(next: SearchFilters) {
    void navigate({ search: huntFromFilters(next, view, { q: streetQuery }) });
  }

  function applyArea(next: { boxes: SearchFilters["boxes"]; districts: SearchFilters["districts"] }) {
    void navigate({ search: huntFromFilters({ ...filters, ...next, page: 1 }, "map", { q: streetQuery }) });
    goView("map");
  }

  const applyStreet = useCallback(
    (next: string) => {
      void navigate({ search: huntFromFilters(filters, view, { q: next }) });
    },
    [filters, view, navigate],
  );

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
    markSeen(listing.id);
    setOpenListing(listing);
  }

  const pool = view === "saved" ? savedItems : result.listings;
  const listings = useMemo(
    () =>
      visibleListings({
        pool,
        freshOnly: filters.freshOnly,
        firstSeenAt,
        streetQuery,
        keywords: keywordWords,
        keywordMode,
        sortBy: filters.sortBy,
        sortAscending: filters.sortAscending,
      }),
    [pool, filters.freshOnly, filters.sortBy, filters.sortAscending, firstSeenAt, streetQuery, keywordWords, keywordMode],
  );
  const typeSummary = useMemo(() => filters.types.map(typeLabel).join(", "), [filters.types]);
  const extras = useMemo(() => extraFilterLabels(filters), [filters]);
  const listen = useMemo(() => withLocalVideos(social, filters), [social, filters]);
  const listenMatched = listen.listings;
  const listenFound = Math.max(listen.found, listen.all?.length ?? 0, listenMatched.length);
  const listenShown = useMemo(() => displayedListenListings(listen, listenAll), [listen, listenAll]);
  const listenView = useMemo(() => ({ ...listen, listings: listenShown }), [listen, listenShown]);
  const playableVideos = useMemo(() => listenView.listings.filter(isPlayableVideo), [listenView.listings]);
  const countLabel =
    view === "saved"
      ? `${listings.length} boliger`
      : view === "listen"
        ? listenAll
          ? `${listenShown.length} opslag`
          : listenCountLabel(listenMatched.length, listenFound)
        : listings.length !== (filters.freshOnly ? pool.length : result.totalHits) || streetQuery || keywordWords.length
          ? `${listings.length} af ${filters.freshOnly ? pool.length : result.totalHits} boliger`
          : `${filters.freshOnly ? listings.length : result.totalHits} boliger`;

  useEffect(() => {
    const missing = result.listings.filter((row) => row.days == null).map((row) => row.id);
    if (missing.length) rememberFirstSeen(missing);
  }, [result.listings, rememberFirstSeen]);

  useEffect(() => {
    setListenAll(false);
  }, [filters.municipality]);

  function openHouseId(id: string) {
    const found = listings.find((row) => row.id === id) ?? savedItems.find((row) => row.id === id);
    if (found) {
      markSeen(found.id);
      setOpenListing(found);
    }
  }

  return (
    <div className="hunt-shell">
      <HuntHeader
        view={view}
        filters={filters}
        share={share}
        countLabel={countLabel}
        typeSummary={typeSummary}
        extras={extras}
        sources={result.sources}
        catalog={areaDistricts}
        listenMatched={listenMatched.length}
        listenFound={listenFound}
        listenAll={listenAll}
        resultHits={result.totalHits}
        streetQuery={streetQuery}
        onApply={apply}
        onView={goView}
        onToggleListenAll={() => setListenAll((value) => !value)}
        onStreetQuery={applyStreet}
      />

      {busy || (view === "listen" && !socialReady && !playableVideos.length) ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
          <LoaderCircle className="size-4 animate-spin" />
          {view === "listen" ? "Lytter efter opslag…" : "Henter boliger…"}
        </div>
      ) : null}

      <div className="hunt-body">
        <HuntBody
          view={view}
          listings={listings}
          openListing={openListing}
          filters={filters}
          catalog={areaDistricts}
          kommuneName={placeLabel(filters)}
          listenView={listenView}
          listenMatched={listenMatched.length}
          listenFound={listenFound}
          listenAll={listenAll}
          reelFocus={reelFocus}
          playableVideos={playableVideos}
          totalHits={result.totalHits}
          hasMore={view !== "saved" && view !== "listen" && hasMore}
          moreBusy={moreBusy}
          onOpenHouse={openHouse}
          onOpenHouseId={openHouseId}
          onCloseHouse={() => setOpenListing(null)}
          onAreaChange={applyArea}
          onView={goView}
          onToggleListenAll={() => setListenAll((value) => !value)}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  );
}
