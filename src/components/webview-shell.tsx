import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { deviceFromSize, sizeClassFromWidth, type DeviceFrame } from "@/lib/listings/layout";
import { cn } from "@/lib/utils";

const FRAME_KEY = "husjagt:frame";

const FRAMES: { id: DeviceFrame; label: string; icon: typeof Smartphone }[] = [
  { id: "phone", label: "Telefon", icon: Smartphone },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "laptop", label: "Computer", icon: Monitor },
];

function isNativeWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  return /HusjagtApp\//i.test(navigator.userAgent);
}

function readFrame(): DeviceFrame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FRAME_KEY);
    if (raw === "phone" || raw === "tablet" || raw === "laptop") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function WebViewShell({ children }: { children: ReactNode }) {
  const [shell, setShell] = useState(false);
  const [device, setDevice] = useState<DeviceFrame>("laptop");

  useEffect(() => {
    if (isNativeWebView()) {
      setShell(false);
      return;
    }
    setDevice(readFrame() ?? deviceFromSize(sizeClassFromWidth(window.innerWidth)));
    setShell(true);
  }, []);

  if (!shell) return children;

  function pick(next: DeviceFrame) {
    setDevice(next);
    try {
      window.sessionStorage.setItem(FRAME_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="wv-studio" data-device={device}>
      <div className="wv-switch" role="tablist" aria-label="Skærm">
        {FRAMES.map((frame) => {
          const Icon = frame.icon;
          const active = device === frame.id;
          return (
            <button
              key={frame.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pick(frame.id)}
              className={cn("wv-switch-item", active && "is-active")}
            >
              <Icon className="size-4" />
              {frame.label}
            </button>
          );
        })}
      </div>
      <div className="wv-device">
        {device === "laptop" ? (
          <div className="wv-titlebar" aria-hidden="true">
            <span className="wv-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="wv-title">Husjagt</span>
            <span className="wv-titlebar-spacer" />
          </div>
        ) : (
          <div className="wv-status" aria-hidden="true">
            <span>9:41</span>
            <span className="wv-notch" />
            <span>{device === "tablet" ? "Wi-Fi  ·  84%" : "LTE  ·  84%"}</span>
          </div>
        )}
        <div className="wv-progress" aria-hidden="true" />
        <div className="wv-screen">{children}</div>
        {device === "tablet" ? <div className="wv-home" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
