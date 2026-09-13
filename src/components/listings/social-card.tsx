import { ExternalLink, MapPin, Play } from "lucide-react";
import { useState } from "react";
import { formatKr } from "@/lib/listings/format";
import { isVideoPost, platformLabel, type SocialListing } from "@/lib/listings/social";

export function SocialCard({ listing }: { listing: SocialListing }) {
  const [broken, setBroken] = useState(false);
  const photo = listing.image && !broken;
  const video = isVideoPost(listing);

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <a href={listing.url} target="_blank" rel="noreferrer" className="block">
        <div className="relative h-44 bg-sunken sm:h-48">
          {listing.video ? (
            <video
              src={listing.video}
              className="size-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : photo ? (
            <img
              src={listing.image ?? undefined}
              alt={listing.title}
              className="size-full object-cover"
              loading="lazy"
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center px-6 text-center text-sm text-muted">
              {video ? "Videoopslag" : "Opslag uden foto"}
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-fg/80 px-2.5 py-1 text-xs font-medium text-primary-fg">
            {platformLabel(listing.platform)}
          </span>
          {video ? (
            <span className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-fg/80 text-primary-fg">
              <Play className="ml-px size-4 fill-current" />
            </span>
          ) : null}
        </div>
      </a>
      <div className="p-4">
        <p className="font-display text-xl font-medium tabular-nums tracking-tight">
          {listing.price != null ? formatKr(listing.price) : "Pris i videoen"}
        </p>
        <p className="mt-1 text-sm font-medium leading-snug">{listing.title}</p>
        {listing.street || listing.city || listing.zip ? (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {[listing.street, listing.zip, listing.city].filter(Boolean).join(" ")}
            </span>
          </p>
        ) : null}
        {listing.text ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{listing.text}</p>
        ) : null}
        <a
          href={listing.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-border bg-bg px-4 text-sm font-medium"
        >
          {video ? `Åbn på ${platformLabel(listing.platform)}` : "Åbn opslag"}
          <ExternalLink className="size-4" />
        </a>
      </div>
    </article>
  );
}
