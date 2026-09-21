import { useEffect, useState } from "react";

export type SizeClass = "compact" | "medium" | "expanded";
export type DeviceFrame = "phone" | "tablet" | "laptop";

export function sizeClassFromWidth(width: number): SizeClass {
  if (width >= 1200) return "expanded";
  if (width >= 720) return "medium";
  return "compact";
}

export function deviceFromSize(size: SizeClass): DeviceFrame {
  if (size === "expanded") return "laptop";
  if (size === "medium") return "tablet";
  return "phone";
}

/** Single layout breakpoint — side-by-side list/detail above this width. */
export const HUNT_WIDE_PX = 860;

export function useMinWidth(px: number): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const apply = () => setMatches(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [px]);
  return matches;
}
