import { Heart, LayoutGrid, Map as MapIcon, Radio } from "lucide-react";
import { moduleOn, type HuntModuleId } from "@/lib/hunt/modules";
import type { HuntView } from "@/lib/listings/share";
import { cn } from "@/lib/utils";

const ITEMS: { id: HuntView; label: string; icon: typeof LayoutGrid; module?: HuntModuleId }[] = [
  { id: "list", label: "Liste", icon: LayoutGrid },
  { id: "map", label: "Kort", icon: MapIcon },
  { id: "listen", label: "Lyt", icon: Radio, module: "listen" },
  { id: "saved", label: "Gemte", icon: Heart, module: "saved" },
];

export function NavRail({
  view,
  savedCount,
  onView,
}: {
  view: HuntView;
  savedCount: number;
  onView: (next: HuntView) => void;
}) {
  return (
    <nav className="hunt-rail" aria-label="Hovedmenu">
      {ITEMS.filter((item) => !item.module || moduleOn(item.module)).map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onView(item.id)}
            aria-current={active ? "page" : undefined}
            className={cn("hunt-rail-item", active && "is-active")}
          >
            <span className="relative">
              <Icon className="size-5" />
              {item.id === "saved" && savedCount > 0 ? (
                <span className="hunt-rail-badge">{savedCount > 9 ? "9+" : savedCount}</span>
              ) : null}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
