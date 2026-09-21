import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SORT_OPTIONS, type SearchFilters } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

const SHORT: Record<string, string> = {
  "Pris, lav → høj": "Pris",
  "Pris, høj → lav": "Pris ↓",
  "Nyeste først": "Nyeste",
  "Kortest liggetid": "Liggetid",
  "Lavest m²-pris": "m²-pris",
  "Lavest ejerudgift": "Ejerudgift",
  "Størst grund": "Grund",
};

function currentOption(filters: SearchFilters) {
  return (
    SORT_OPTIONS.find((opt) => opt.id === filters.sortBy && opt.ascending === filters.sortAscending) ?? SORT_OPTIONS[0]
  );
}

export function SortMenu({
  value,
  onChange,
}: {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();
  const current = currentOption(value);

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const rect = button.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (root.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onWin() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open]);

  const menu = open
    ? createPortal(
        <ul
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-label="Sortér"
          className="fixed z-[80] min-w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-card"
          style={{ top: pos.top, right: pos.right }}
        >
          {SORT_OPTIONS.map((opt) => {
            const active = opt.id === current.id && opt.ascending === current.ascending;
            return (
              <li key={`${opt.id}-${opt.ascending}`} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...value, sortBy: opt.id, sortAscending: opt.ascending, page: 1 });
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-11 w-full items-center justify-between gap-3 px-3.5 text-left text-sm",
                    active ? "bg-sunken text-fg" : "text-muted hover:bg-sunken hover:text-fg",
                  )}
                >
                  <span>{opt.label}</span>
                  {active ? <Check className="size-4 shrink-0 text-primary" /> : null}
                </button>
              </li>
            );
          })}
        </ul>,
        document.body,
      )
    : null;

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 max-w-40 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 text-sm text-fg",
          open && "border-primary",
        )}
      >
        <ArrowUpDown className="size-4 shrink-0" />
        <span className="truncate">{SHORT[current.label] ?? current.label}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {menu}
    </div>
  );
}
