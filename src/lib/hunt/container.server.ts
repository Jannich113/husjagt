import { searchBoliga } from "@/lib/listings/boliga.server";
import { getBoligsidenCase, searchBoligsiden, snapshotSearch } from "@/lib/listings/boligsiden.server";
import { fetchKommuneDistricts, suggestPlaces, suggestPostnumre } from "@/lib/listings/dawa.server";
import { rememberDistricts } from "@/lib/listings/districts";
import { HUNT_SOURCES, sourceEnabled } from "@/lib/listings/sources";
import { listenPrivateAds, listenSocial } from "@/lib/listings/social.server";
import { EMPTY_SEARCH, type HuntServices, type ListingCatalogPort } from "./ports";

function liveCatalogs(): ListingCatalogPort[] {
  const catalogs: ListingCatalogPort[] = [];
  if (sourceEnabled("boligsiden")) {
    catalogs.push({
      id: "boligsiden",
      timeoutMs: HUNT_SOURCES.boligsiden.timeoutMs,
      search: searchBoligsiden,
      getById: getBoligsidenCase,
    });
  }
  if (sourceEnabled("boliga")) {
    catalogs.push({
      id: "boliga",
      timeoutMs: HUNT_SOURCES.boliga.timeoutMs,
      search: searchBoliga,
    });
  }
  return catalogs;
}

/** Production composition root — the only place live adapters are wired. */
export function liveHuntServices(): HuntServices {
  return {
    catalogs: liveCatalogs(),
    classifieds: sourceEnabled("classifieds")
      ? { timeoutMs: HUNT_SOURCES.classifieds.timeoutMs, search: listenPrivateAds }
      : null,
    places: {
      districts: fetchKommuneDistricts,
      remember: rememberDistricts,
      suggestPlaces,
      suggestPostnumre,
    },
    social: { listen: listenSocial },
    snapshot: snapshotSearch,
  };
}

export function disabledCatalogFallback(): typeof EMPTY_SEARCH {
  return EMPTY_SEARCH;
}
