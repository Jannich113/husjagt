import { useEffect, useMemo, useState } from "react";
import { listingImageFallbacks } from "@/lib/listings/listing-image";
import { cn } from "@/lib/utils";

export function ListingPhoto({
  src,
  alt,
  className,
  placeholder = "Intet foto",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  placeholder?: string;
}) {
  const urls = useMemo(() => listingImageFallbacks(src), [src]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src]);

  const current = urls[index];
  if (!current) {
    return (
      <div className={cn("flex size-full items-center justify-center bg-sunken text-sm text-muted", className)}>
        {placeholder}
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setIndex((n) => n + 1)}
    />
  );
}
