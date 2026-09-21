import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

function localPoint(event: ReactPointerEvent<HTMLDivElement>): Point {
  const box = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

function rectFrom(a: Point, b: Point) {
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  return { left, top, width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}

/** Captures mouse + touch above pins/zoom so drawing a hunt box actually works. */
export function MapDrawOverlay({
  onDrag,
}: {
  onDrag: (start: Point, end: Point) => void;
}) {
  const origin = useRef<Point | null>(null);
  const [draft, setDraft] = useState<ReturnType<typeof rectFrom> | null>(null);

  function finish(event: ReactPointerEvent<HTMLDivElement>) {
    const start = origin.current;
    origin.current = null;
    setDraft(null);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    if (!start) return;
    onDrag(start, localPoint(event));
  }

  return (
    <div
      className="hunt-map-draw"
      role="application"
      aria-label="Tegn et område på kortet"
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
        const point = localPoint(event);
        origin.current = point;
        setDraft(rectFrom(point, point));
      }}
      onPointerMove={(event) => {
        if (!origin.current) return;
        event.preventDefault();
        setDraft(rectFrom(origin.current, localPoint(event)));
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <p className="hunt-map-draw-hint">Træk diagonalen, og løft fingeren</p>
      {draft && draft.width + draft.height > 6 ? (
        <span
          className={cn("hunt-map-draw-box")}
          style={{ left: draft.left, top: draft.top, width: draft.width, height: draft.height }}
        />
      ) : null}
    </div>
  );
}
