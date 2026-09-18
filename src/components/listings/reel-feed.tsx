import { ExternalLink, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatKr } from "@/lib/listings/format";
import {
  isPlayableVideo,
  openedSocialUrl,
  platformLabel,
  videoEmbedUrl,
  type SocialListing,
} from "@/lib/listings/social";
import { externalLinkProps } from "@/lib/pwa/outbound";
import { cn } from "@/lib/utils";

export function VideoRail({
  listings,
  onOpenAll,
  onSelect,
}: {
  listings: SocialListing[];
  onOpenAll: () => void;
  onSelect: (id: string) => void;
}) {
  const playable = listings.filter(isPlayableVideo);
  if (!playable.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Instagram & TikTok</p>
          <p className="mt-0.5 text-sm text-muted">Boliger i videoformat</p>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="h-11 shrink-0 rounded-full px-3 text-sm font-medium text-primary"
        >
          Se alle
        </button>
      </div>
      <div className="reel-rail -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        {playable.map((listing) => (
          <RailCard key={listing.id} listing={listing} onSelect={() => onSelect(listing.id)} />
        ))}
      </div>
    </section>
  );
}

function RailCard({ listing, onSelect }: { listing: SocialListing; onSelect: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    const el = videoRef.current;
    if (!node || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const place = [listing.street, listing.zip].filter(Boolean).join(" ");

  return (
    <button
      ref={rootRef}
      type="button"
      onClick={onSelect}
      className="relative w-[9.5rem] shrink-0 snap-start overflow-hidden rounded-xl bg-fg text-left shadow-card"
    >
      <span className="block aspect-[9/16]">
        {listing.video ? (
          <video
            ref={videoRef}
            src={listing.video}
            poster={listing.image ?? undefined}
            className="absolute inset-0 size-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : listing.image ? (
          <img src={listing.image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="absolute inset-0 bg-sunken" />
        )}
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg via-fg/70 to-transparent px-2.5 pb-2.5 pt-10 text-primary-fg">
        <span className="inline-flex rounded-full bg-primary-fg/15 px-2 py-0.5 text-[11px] font-medium">
          {platformLabel(listing.platform)}
        </span>
        {listing.price != null ? (
          <span className="mt-1 block font-display text-sm tabular-nums">{formatKr(listing.price)}</span>
        ) : null}
        {place ? <span className="mt-0.5 block truncate text-xs text-primary-fg/70">{place}</span> : null}
      </span>
      <span className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-fg/55 text-primary-fg">
        <Play className="ml-px size-3.5 fill-current" />
      </span>
    </button>
  );
}

export function ReelFeed({
  listings,
  startId,
}: {
  listings: SocialListing[];
  startId?: string | null;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startId) return;
    const node = scrollerRef.current?.querySelector(`#reel-${CSS.escape(startId)}`);
    node?.scrollIntoView({ block: "start" });
  }, [startId, listings]);

  if (!listings.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Video</p>
          <p className="mt-0.5 text-sm text-muted">Instagram Reels og TikTok i området</p>
        </div>
        <p className="text-xs tabular-nums text-faint">{listings.length}</p>
      </div>
      <div
        ref={scrollerRef}
        className="mx-auto h-[min(78dvh,720px)] max-w-[22.5rem] snap-y snap-mandatory overflow-y-auto rounded-xl bg-fg shadow-card"
        aria-label="Video-feed"
      >
        {listings.map((listing) => (
          <ReelSlide key={listing.id} listing={listing} />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-faint">Stryg op for næste boligvideo</p>
    </section>
  );
}

function ReelSlide({ listing }: { listing: SocialListing }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const [muted, setMuted] = useState(true);
  const [active, setActive] = useState(false);
  const embed = !listing.video ? videoEmbedUrl(listing) : null;

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.6)),
      { threshold: [0.6] },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
    if (active) {
      void el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  }, [active, muted]);

  const place = [listing.street, listing.zip, listing.city].filter(Boolean).join(" ");

  return (
    <article
      id={`reel-${listing.id}`}
      ref={rootRef}
      className="relative h-[min(78dvh,720px)] w-full shrink-0 snap-start snap-always overflow-hidden bg-fg"
    >
      {listing.video ? (
        <video
          ref={videoRef}
          src={listing.video}
          poster={listing.image ?? undefined}
          className="absolute inset-0 size-full object-cover"
          playsInline
          loop
          muted
          preload="metadata"
        />
      ) : embed && active ? (
        <iframe
          src={embed}
          title={listing.title}
          className="absolute inset-0 size-full border-0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : listing.image ? (
        <img
          src={listing.image}
          alt=""
          className={cn("absolute inset-0 size-full object-cover", active && "reel-ken")}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-sunken">
          <Play className="ml-px size-10 text-muted" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg via-fg/70 to-transparent px-4 pb-5 pt-24 text-primary-fg">
        <span className="inline-flex rounded-full bg-primary-fg/15 px-2.5 py-1 text-xs font-medium">
          {platformLabel(listing.platform)}
        </span>
        {listing.price != null ? (
          <p className="mt-2 font-display text-2xl tabular-nums tracking-tight">{formatKr(listing.price)}</p>
        ) : null}
        <p className="mt-1 text-sm font-medium leading-snug">{listing.title}</p>
        {place ? <p className="mt-1 text-sm text-primary-fg/75">{place}</p> : null}
        {listing.author ? <p className="mt-1 text-xs text-primary-fg/60">@{listing.author}</p> : null}
        <a
          {...externalLinkProps(openedSocialUrl(listing))}
          className="pointer-events-auto mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-primary-fg px-4 pr-3.5 text-sm font-medium text-fg"
        >
          Åbn på {platformLabel(listing.platform)}
          <ExternalLink className="size-4" />
        </a>
      </div>

      {listing.video ? (
        <button
          type="button"
          onClick={() => setMuted((v) => !v)}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-fg/55 text-primary-fg"
          aria-label={muted ? "Slå lyd til" : "Slå lyd fra"}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      ) : null}
    </article>
  );
}
