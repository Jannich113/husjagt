import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/listings/types";
import { formatKr } from "@/lib/listings/format";
import { cn } from "@/lib/utils";

type Props = {
  listings: Listing[];
  onSelect: (id: string) => void;
  fill?: boolean;
};

export function ListingMap({ listings, onSelect, fill = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

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
    const pin = L.divIcon({
      className: "hus-pin",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const bounds: L.LatLngTuple[] = [];
    for (const listing of listings) {
      if (listing.lat == null || listing.lon == null) continue;
      const marker = L.marker([listing.lat, listing.lon], { icon: pin });
      marker.bindTooltip(`${listing.street} · ${formatKr(listing.price)}`, { direction: "top" });
      marker.on("click", () => onSelectRef.current(listing.id));
      marker.addTo(group);
      bounds.push([listing.lat, listing.lon]);
    }
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
    else if (bounds.length === 1) map.setView(bounds[0], 14);
    requestAnimationFrame(() => map.invalidateSize());
  }, [listings]);

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
