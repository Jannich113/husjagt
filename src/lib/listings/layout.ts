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

export function useSizeClass(): SizeClass {
  const [size, setSize] = useState<SizeClass>("compact");

  useEffect(() => {
    const el =
      document.querySelector<HTMLElement>(".wv-screen") ?? document.documentElement;
    const apply = () => setSize(sizeClassFromWidth(el.clientWidth || window.innerWidth));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return size;
}
