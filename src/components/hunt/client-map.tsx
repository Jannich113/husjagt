import { useEffect, useState } from "react";
import type { District } from "@/lib/listings/districts";
import type { KommuneView } from "@/lib/listings/kommune-view";
import type { GeoBounds, Listing } from "@/lib/listings/types";

export function ClientMap({
  listings,
  onSelect,
  fill = false,
  boxes = [],
  districts = [],
  kommune = "odense",
  focus = null,
  catalog,
  onAreaChange,
}: {
  listings: Listing[];
  onSelect: (id: string) => void;
  fill?: boolean;
  boxes?: GeoBounds[];
  districts?: string[];
  kommune?: string;
  focus?: KommuneView | null;
  catalog?: District[];
  onAreaChange?: (next: { boxes: GeoBounds[]; districts: string[] }) => void;
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
    return <div className={fill ? "hunt-skel-map size-full" : "hunt-skel-map h-full min-h-[420px] rounded-xl border border-border"} aria-hidden />;
  }
  return (
    <MapCmp
      listings={listings}
      onSelect={onSelect}
      fill={fill}
      boxes={boxes}
      districts={districts}
      kommune={kommune}
      focus={focus}
      catalog={catalog}
      onAreaChange={onAreaChange}
    />
  );
}
