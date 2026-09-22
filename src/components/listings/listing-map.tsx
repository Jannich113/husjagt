import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoBounds, Listing } from "@/lib/listings/types";
import { huntMapCamera, unionGeoBounds, type KommuneView } from "@/lib/listings/kommune-view";
import { formatKr } from "@/lib/listings/format";
import { useFavorites } from "@/lib/listings/favorites";
import { listingFreshness, useFirstSeen, type Freshness } from "@/lib/listings/fresh";
import { useSeen } from "@/lib/listings/seen";
import { districtsForKommune, geometryCentroid, type District } from "@/lib/listings/districts";
import { boxesEqual, normalizeBox } from "@/lib/listings/map-listing";
import { moduleOn } from "@/lib/hunt/modules";
import { cn } from "@/lib/utils";
import { MapDrawOverlay } from "./map-draw-overlay";

type Props = {
  listings: Listing[];
  onSelect: (id: string) => void;
  fill?: boolean;
  boxes?: GeoBounds[];
  districts?: string[];
  kommune?: string;
  focus?: KommuneView | null;
  catalog?: District[];
  onAreaChange?: (next: { boxes: GeoBounds[]; districts: string[] }) => void;
};

type PinKind = "liked" | "seen" | "unseen";

const KOMMUNE_STYLE: L.PathOptions = {
  color: "#2c4a3e",
  weight: 2.5,
  fillColor: "#2c4a3e",
  fillOpacity: 0.07,
};
const BOX_STYLE: L.PolylineOptions = {
  color: "#2c4a3e",
  weight: 2,
  fillColor: "#2c4a3e",
  fillOpacity: 0.12,
};
const DISTRICT_ON: L.PathOptions = {
  color: "#2c4a3e",
  weight: 2,
  fillColor: "#2c4a3e",
  fillOpacity: 0.22,
};
const DISTRICT_OFF: L.PathOptions = {
  color: "#8a8276",
  weight: 1.25,
  dashArray: "5 4",
  fillColor: "#c4baac",
  fillOpacity: 0.08,
};

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

function leafletBox(box: GeoBounds): L.LatLngBounds {
  return L.latLngBounds([box.maxLat, box.minLon], [box.minLat, box.maxLon]);
}

export function ListingMap({
  listings,
  onSelect,
  fill = false,
  boxes = [],
  districts = [],
  kommune = "odense",
  focus = null,
  catalog,
  onAreaChange,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const areaRef = useRef<L.LayerGroup | null>(null);
  const fittedKey = useRef("");
  const [mapReady, setMapReady] = useState(0);
  const onSelectRef = useRef(onSelect);
  const areaChangeRef = useRef(onAreaChange);
  const boxesRef = useRef(boxes);
  const districtsRef = useRef(districts);
  onSelectRef.current = onSelect;
  areaChangeRef.current = onAreaChange;
  boxesRef.current = boxes;
  districtsRef.current = districts;
  const [drawMode, setDrawMode] = useState(false);
  const [pickDistricts, setPickDistricts] = useState(false);
  const seenIds = useSeen((s) => s.ids);
  const likedIds = useFavorites((s) => s.ids);
  const firstSeen = useFirstSeen((s) => s.seenAt);
  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);
  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);
  const listingKey = useMemo(() => listings.map((row) => row.id).join("|"), [listings]);
  const named = catalog?.length ? catalog : districtsForKommune(kommune);

  useEffect(() => {
    if (!host.current || mapRef.current) return;
    const map = L.map(host.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      boxZoom: false,
      tapHold: false,
    }).setView([56.12, 10.39], 7);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    areaRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady((n) => n + 1);
    const invalidate = () => map.invalidateSize();
    const ro = new ResizeObserver(invalidate);
    ro.observe(host.current);
    requestAnimationFrame(invalidate);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      areaRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const pins: Array<{ lat: number; lon: number }> = [];
    for (const listing of listings) {
      if (listing.lat == null || listing.lon == null) continue;
      const kind = pinKind(listing.id, likedSet, seenSet);
      const fresh = listingFreshness(listing, firstSeen[listing.id]);
      const marker = L.marker([listing.lat, listing.lon], {
        icon: pinIcon(kind, fresh),
        interactive: !drawMode,
        zIndexOffset: (kind === "liked" ? 400 : 0) + (fresh === "today" ? 200 : fresh === "week" ? 100 : 0),
      });
      marker.bindTooltip(`${listing.street} · ${formatKr(listing.price)}`, { direction: "top" });
      marker.on("click", () => onSelectRef.current(listing.id));
      marker.addTo(group);
      pins.push({ lat: listing.lat, lon: listing.lon });
    }
    const areaKey = `${kommune}|${listingKey}|${boxes.map((b) => `${b.minLon}`).join()}|${districts.join(",")}|${focus?.lat ?? ""}|${mapReady}`;
    if (fittedKey.current !== areaKey && !drawMode && mapReady) {
      fittedKey.current = areaKey;
      const selectedDistrictBounds = districts
        .map((id) => named.find((row) => row.id === id)?.bounds)
        .filter((row): row is NonNullable<typeof row> => Boolean(row));
      const camera = huntMapCamera({
        boxes,
        selectedDistrictBounds,
        kommuneBounds: focus?.bounds ?? unionGeoBounds(named.map((row) => row.bounds)),
        kommuneCenter: focus ? { lat: focus.lat, lon: focus.lon } : null,
        pins,
      });
      map.invalidateSize();
      if (camera?.kind === "bounds") {
        map.fitBounds(leafletBox(camera.bounds).pad(0.08), { padding: [28, 28], maxZoom: camera.maxZoom });
      } else if (camera?.kind === "point") {
        map.setView([camera.lat, camera.lon], camera.zoom);
      }
    }
    requestAnimationFrame(() => map.invalidateSize());
  }, [listings, listingKey, seenSet, likedSet, firstSeen, boxes, districts, named, drawMode, kommune, focus, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const group = areaRef.current;
    if (!map || !group) return;
    group.clearLayers();
    if (focus?.geometry) {
      L.geoJSON(focus.geometry as GeoJSON.GeoJsonObject, {
        style: KOMMUNE_STYLE,
        interactive: false,
      }).addTo(group);
    }
    boxes.forEach((box, index) => {
      const rect = L.rectangle(leafletBox(box), { ...BOX_STYLE, interactive: !drawMode });
      rect.bindTooltip(`Område ${index + 1} · tryk for at fjerne`, { sticky: true });
      rect.on("click", (event) => {
        L.DomEvent.stop(event);
        areaChangeRef.current?.({
          boxes: boxesRef.current.filter((_, i) => i !== index),
          districts: districtsRef.current,
        });
      });
      rect.addTo(group);
    });
    const show = pickDistricts || districts.length > 0;
    if (show) {
      for (const row of named) {
        const on = districts.includes(row.id);
        if (!pickDistricts && !on) continue;
        const poly = L.geoJSON(row.geometry as GeoJSON.Polygon, {
          style: on ? DISTRICT_ON : DISTRICT_OFF,
          interactive: !drawMode,
        });
        poly.bindTooltip(row.label, { sticky: true });
        poly.on("click", (event) => {
          L.DomEvent.stop(event);
          const current = districtsRef.current;
          const next = current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id];
          areaChangeRef.current?.({ boxes: boxesRef.current, districts: next });
        });
        poly.addTo(group);
        const center = geometryCentroid(row.geometry);
        const label = L.marker([center.lat, center.lon], {
          interactive: false,
          keyboard: false,
          zIndexOffset: 200,
          icon: L.divIcon({
            className: on ? "hunt-district-label hunt-district-label-on" : "hunt-district-label",
            html: `<span>${row.label}</span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
        });
        label.addTo(group);
      }
    }
  }, [boxes, districts, named, pickDistricts, drawMode, focus, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (drawMode) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
      map.keyboard.disable();
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
      map.keyboard.enable();
    }
  }, [drawMode]);

  function commitDraw(start: { x: number; y: number }, end: { x: number; y: number }) {
    const map = mapRef.current;
    if (!map) return;
    const a = map.containerPointToLatLng(L.point(start.x, start.y));
    const b = map.containerPointToLatLng(L.point(end.x, end.y));
    const raw = normalizeBox({
      minLon: a.lng,
      minLat: a.lat,
      maxLon: b.lng,
      maxLat: b.lat,
    });
    if (!raw) return;
    const next = [...boxesRef.current.filter((row) => !boxesEqual(row, raw)), raw].slice(0, 8);
    setDrawMode(false);
    areaChangeRef.current?.({ boxes: next, districts: districtsRef.current });
  }

  const hasArea = boxes.length > 0 || districts.length > 0;
  const showTools = Boolean(onAreaChange && moduleOn("mapDraw"));

  return (
    <div
      className={cn(
        "relative isolate min-h-[420px] overflow-hidden bg-sunken",
        fill ? "absolute inset-0" : "h-full rounded-xl border border-border",
        drawMode && "hunt-map-drawing",
      )}
    >
      <div ref={host} className="leaflet-container absolute inset-0 bg-sunken" />
      {drawMode ? <MapDrawOverlay onDrag={commitDraw} /> : null}
      {showTools ? (
        <div className="hunt-map-float">
          {!drawMode && pickDistricts && named.length && moduleOn("districts") ? (
            <div className="hunt-map-districts">
              {named.map((row) => {
                const on = districts.includes(row.id);
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      const next = on ? districts.filter((id) => id !== row.id) : [...districts, row.id];
                      onAreaChange?.({ boxes, districts: next });
                    }}
                    className={cn(
                      "h-8 shrink-0 rounded-full border px-2.5 text-xs font-medium",
                      on ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-fg",
                    )}
                  >
                    {row.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPickDistricts(false);
                setDrawMode((v) => !v);
              }}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium shadow-card",
                drawMode ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-fg",
              )}
            >
              <Pencil className="size-3.5" />
              {drawMode ? "Annullér" : "Tegn"}
            </button>
            {!drawMode && named.length && moduleOn("districts") ? (
              <button
                type="button"
                onClick={() => setPickDistricts((v) => !v)}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-xs font-medium shadow-card",
                  pickDistricts ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-fg",
                )}
              >
                Bydele
              </button>
            ) : null}
            {!drawMode && hasArea ? (
              <button
                type="button"
                onClick={() => areaChangeRef.current?.({ boxes: [], districts: [] })}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-fg shadow-card"
              >
                <Trash2 className="size-3.5" />
                Ryd
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
