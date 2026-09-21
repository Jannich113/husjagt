import { useEffect, useState } from "react";
import type { District } from "@/lib/listings/districts";
import type { GeoBounds, Listing } from "@/lib/listings/types";

export function ClientMap({
  listings,
  onSelect,
  fill = false,
  boxes = [],
  districts = [],
  kommune = "odense",
  catalog,
  onAreaChange,
}: {
  listings: Listing[];
  onSelect: (id: string) => void;
  fill?: boolean;
  boxes?: GeoBounds[];
  districts?: string[];
  kommune?: string;
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
    return <div className={fill ? "size-full bg-sunken" : "h-full min-h-[420px] rounded-xl border border-border bg-sunken"} />;
  }
  return (
    <MapCmp
      listings={listings}
      onSelect={onSelect}
      fill={fill}
      boxes={boxes}
      districts={districts}
      kommune={kommune}
      catalog={catalog}
      onAreaChange={onAreaChange}
    />
  );
}
