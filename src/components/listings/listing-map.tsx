import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/listings/types";
import { formatKr } from "@/lib/listings/format";
import { useFavorites } from "@/lib/listings/favorites";
import { listingFreshness, useFirstSeen, type Freshness } from "@/lib/listings/fresh";
import { useSeen } from "@/lib/listings/seen";
import { cn } from "@/lib/utils";

type Props = {
  listings: Listing[];
  onSelect: (id: string) => void;
  fill?: boolean;
};

type PinKind = "liked" | "seen" | "unseen";

function pinKind(id: string, liked: Set<string>, seen: Set<string>): PinKind {
  if (liked.has(id)) return "liked";
  if (seen.has(id)) return "seen";
  return "unseen";
}

function pinIcon(kind: PinKind, fresh: Freshness) {
  const pin =
    kind === "liked" ? "hus-pin hus-pin-liked" : kind === "seen" ? "hus-pin hus-pin-seen" : "hus-pin";
  const wrap =
    fresh === "today"
      ? "hus-pin-wrap hus-pin-fresh-today"
      : fresh === "week"
        ? "hus-pin-wrap hus-pin-fresh-week"
        : "hus-pin-wrap";
  return L.divIcon({
    className: wrap,
    html: `<span class="${pin}"></span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export function ListingMap({ listings, onSelect, fill = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fittedKey = useRef("");
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const seenIds = useSeen((s) => s.ids);
  const likedIds = useFavorites((s) => s.ids);
  const firstSeen = useFirstSeen((s) => s.seenAt);
  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);
  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);
  const listingKey = useMemo(() => listings.map((row) => row.id).join("|"), [listings]);

  useEffect(() => {
    if (!host.current || mapRef.current) return;
    const map = L.map(host.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    }).setView([55.3959, 10.3883], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const invalidate = () => map.invalidateSize();
    const ro = new ResizeObserver(invalidate);
    ro.observe(host.current);
    requestAnimationFrame(invalidate);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const bounds: L.LatLngTuple[] = [];
    for (const listing of listings) {
      if (listing.lat == null || listing.lon == null) continue;
      const kind = pinKind(listing.id, likedSet, seenSet);
      const fresh = listingFreshness(listing, firstSeen[listing.id]);
      const marker = L.marker([listing.lat, listing.lon], {
        icon: pinIcon(kind, fresh),
        zIndexOffset: (kind === "liked" ? 400 : 0) + (fresh === "today" ? 200 : fresh === "week" ? 100 : 0),
      });
      marker.bindTooltip(`${listing.street} · ${formatKr(listing.price)}`, { direction: "top" });
      marker.on("click", () => onSelectRef.current(listing.id));
      marker.addTo(group);
      bounds.push([listing.lat, listing.lon]);
    }
    if (fittedKey.current !== listingKey) {
      fittedKey.current = listingKey;
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
      else if (bounds.length === 1) map.setView(bounds[0], 14);
    }
    requestAnimationFrame(() => map.invalidateSize());
  }, [listings, listingKey, seenSet, likedSet, firstSeen]);

  return (
    <div
      ref={host}
      className={cn(
        "leaflet-container h-full w-full overflow-hidden bg-sunken",
        fill ? "absolute inset-0" : "min-h-[420px] rounded-xl border border-border",
      )}
    />
  );
}
