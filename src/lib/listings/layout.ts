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

function screenElement(): HTMLElement {
  return document.querySelector<HTMLElement>(".wv-screen") ?? document.documentElement;
}

export function useSizeClass(): SizeClass {
  const [size, setSize] = useState<SizeClass>("compact");

  useEffect(() => {
    let observed: Element | null = null;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? screenElement().clientWidth;
      setSize(sizeClassFromWidth(width || window.innerWidth));
    });

    function attach() {
      const el = screenElement();
      if (el === observed) return;
      if (observed) ro.unobserve(observed);
      observed = el;
      ro.observe(el);
      setSize(sizeClassFromWidth(el.clientWidth || window.innerWidth));
    }

    attach();
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", attach);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", attach);
    };
  }, []);

  return size;
}
