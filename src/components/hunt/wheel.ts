import type { WheelEvent } from "react";

/** Forward wheel from the split panes onto the listing list so desktop scroll still works. */
export function forwardWheelToList(event: WheelEvent<HTMLDivElement>) {
  const list = event.currentTarget.querySelector<HTMLElement>(".hunt-list-pane");
  if (!list) return;
  const node = event.target instanceof HTMLElement ? event.target : null;
  const nested = node?.closest(
    ".hunt-list-pane, .hunt-detail-pane, .hunt-support-pane, .leaflet-container",
  ) as HTMLElement | null;
  if (!nested || nested.classList.contains("hunt-list-pane") || nested.classList.contains("leaflet-container")) {
    return;
  }
  const canScroll = nested.scrollHeight - nested.clientHeight > 4;
  if (canScroll) {
    const atTop = nested.scrollTop <= 0 && event.deltaY < 0;
    const atBottom =
      nested.scrollTop + nested.clientHeight >= nested.scrollHeight - 2 && event.deltaY > 0;
    if (!atTop && !atBottom) return;
  }
  list.scrollTop += event.deltaY;
}
