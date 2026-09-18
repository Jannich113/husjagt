import { Download, WifiOff, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { isIosSafari, isNativeWebView, isStandaloneDisplay, STANDALONE_MEDIA } from "@/lib/pwa/display-mode";
import {
  INSTALL_DISMISS_KEY,
  parseDismissedAt,
  shouldShowInstall,
  type InstallKind,
} from "@/lib/pwa/install";
import { registerServiceWorker } from "@/lib/pwa/register";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaChrome({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [kind, setKind] = useState<InstallKind>(null);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    function syncOnline() {
      setOnline(navigator.onLine);
    }
    syncOnline();
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  useEffect(() => {
    let hasPrompt = false;

    function refresh(nextPrompt: boolean) {
      hasPrompt = nextPrompt;
      const ua = navigator.userAgent;
      setKind(
        shouldShowInstall({
          standalone: isStandaloneDisplay(window),
          nativeWebView: isNativeWebView(ua),
          dismissedAt: parseDismissedAt(window.localStorage.getItem(INSTALL_DISMISS_KEY)),
          hasPrompt: nextPrompt,
          ios: isIosSafari(ua),
        }),
      );
    }

    refresh(false);

    function onBip(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      refresh(true);
    }

    function onInstalled() {
      setPromptEvent(null);
      refresh(false);
    }

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia(STANDALONE_MEDIA);
    const onMode = () => refresh(hasPrompt);
    mq.addEventListener("change", onMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onMode);
    };
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setKind(null);
    setPromptEvent(null);
  }

  async function install() {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch {
      /* user closed the sheet */
    }
    setPromptEvent(null);
    setKind(null);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {!online ? <OfflineBanner /> : null}
      {kind ? (
        <InstallBanner kind={kind} onInstall={() => void install()} onDismiss={dismiss} />
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-2 border-b border-border bg-sunken px-4 py-2.5 text-sm text-fg"
    >
      <WifiOff className="size-4 shrink-0 text-warn" aria-hidden />
      <p>Ingen forbindelse — viser sidst hentede boliger, hvis de er gemt her.</p>
    </div>
  );
}

function InstallBanner({
  kind,
  onInstall,
  onDismiss,
}: {
  kind: Exclude<InstallKind, null>;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <aside className="sticky top-0 z-30 shrink-0 border-b border-border bg-surface px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg">
          <Download className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-tight text-fg">Tilføj til hjemmeskærm</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {kind === "ios"
              ? "På iPhone: tryk Del, derefter Føj til hjemmeskærm."
              : kind === "prompt"
                ? "Åbn Husjagt som en app — uden browser-chrome."
                : "I Chrome: menu → Installer app / Tilføj til hjemmeskærm."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {kind === "prompt" ? (
              <Button size="sm" onClick={onInstall}>
                Tilføj til hjemmeskærm
              </Button>
            ) : null}
            <Button size="sm" variant={kind === "prompt" ? "ghost" : "outline"} onClick={onDismiss}>
              Ikke nu
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken hover:text-fg"
          aria-label="Luk"
        >
          <X className="size-5" />
        </button>
      </div>
    </aside>
  );
}
