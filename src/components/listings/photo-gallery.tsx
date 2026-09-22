import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ListingPhoto } from "@/components/listings/listing-photo";
import { cn } from "@/lib/utils";

export function PhotoGallery({
  urls,
  alt,
}: {
  urls: string[];
  alt: string;
}) {
  const slides = urls.filter(Boolean);
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    scroller.current?.scrollTo({ left: 0 });
  }, [slides.join("|")]);

  function go(next: number) {
    if (!slides.length) return;
    const clamped = (next + slides.length) % slides.length;
    const node = scroller.current;
    const width = node?.clientWidth ?? 0;
    node?.scrollTo({ left: clamped * width, behavior: "smooth" });
    setIndex(clamped);
  }

  function onScroll() {
    const node = scroller.current;
    if (!node || !node.clientWidth) return;
    const next = Math.round(node.scrollLeft / node.clientWidth);
    if (next !== index && next >= 0 && next < slides.length) setIndex(next);
  }

  if (!slides.length) {
    return (
      <div className="flex h-64 w-full items-center justify-center bg-sunken text-sm text-muted sm:h-80">
        Intet foto
      </div>
    );
  }

  if (slides.length === 1) {
    return (
      <div className="h-64 w-full bg-sunken sm:h-80">
        <ListingPhoto src={slides[0]} alt={alt} className="h-64 w-full object-cover sm:h-80" />
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full bg-sunken sm:h-80">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth hunt-gallery"
      >
        {slides.map((url, i) => (
          <div key={`${url}-${i}`} className="h-full w-full shrink-0 snap-center">
            <ListingPhoto src={url} alt={i === 0 ? alt : `${alt} ${i + 1}`} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <p className="pointer-events-none absolute right-3 top-3 rounded-full bg-fg/70 px-2.5 py-1 text-xs font-medium text-bg">
        {index + 1}/{slides.length}
      </p>
      <button
        type="button"
        aria-label="Forrige foto"
        onClick={() => go(index - 1)}
        className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg/90 text-fg shadow-card"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Næste foto"
        onClick={() => go(index + 1)}
        className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg/90 text-fg shadow-card"
      >
        <ChevronRight className="size-5" />
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1">
        {slides.slice(0, 12).map((_, i) => (
          <span
            key={i}
            className={cn("size-1.5 rounded-full", i === index ? "bg-bg" : "bg-bg/40")}
          />
        ))}
      </div>
    </div>
  );
}
