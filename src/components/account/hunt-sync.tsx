import { useEffect, useRef } from "react";
import { applyHuntBlob, blobIsNewer, collectHuntBlob } from "@/lib/account/blob";
import { loadHuntBlob, saveHuntBlob } from "@/lib/account/blob.server";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useFavorites } from "@/lib/listings/favorites";
import { useFirstSeen } from "@/lib/listings/fresh";
import { useHidden } from "@/lib/listings/hidden";
import { useKeywords } from "@/lib/listings/keywords";
import { useSearchAlerts } from "@/lib/listings/search-alerts";
import { useSeen } from "@/lib/listings/seen";
import { useSocialWatch } from "@/lib/listings/social-watch";

const LOCAL_STAMP = "husjagt-blob-saved-at";

function localStamp(): number {
  if (typeof localStorage === "undefined") return 0;
  const n = Number(localStorage.getItem(LOCAL_STAMP) ?? "0");
  return Number.isFinite(n) ? n : 0;
}

function setLocalStamp(value: number) {
  localStorage.setItem(LOCAL_STAMP, String(value));
}

function rehydrateLocalStores() {
  useFavorites.setState({ ready: false });
  useHidden.setState({ ready: false });
  useSeen.setState({ ready: false });
  useFirstSeen.setState({ ready: false });
  useSearchAlerts.setState({ ready: false });
  useKeywords.setState({ ready: false });
  useSocialWatch.setState({ ready: false });
  useFavorites.getState().hydrate();
  useHidden.getState().hydrate();
  useSeen.getState().hydrate();
  useFirstSeen.getState().hydrate();
  useSearchAlerts.getState().hydrate();
  useKeywords.getState().hydrate();
  useSocialWatch.getState().hydrate();
}

export function HuntSync() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id;
  const armed = useRef<string | null>(null);

  useEffect(() => {
    if (isPending || !userId || armed.current === userId) return;
    armed.current = userId;
    let alive = true;
    void loadHuntBlob()
      .then((remote) => {
        if (!alive) return;
        const local = localStamp();
        if (blobIsNewer(remote, local) && remote) {
          applyHuntBlob(remote);
          setLocalStamp(remote.savedAt);
          rehydrateLocalStores();
          return;
        }
        const payload = collectHuntBlob();
        setLocalStamp(payload.savedAt);
        return saveHuntBlob({ data: payload });
      })
      .catch(() => {
        /* stay local */
      });
    const timer = window.setInterval(() => {
      const payload = collectHuntBlob();
      setLocalStamp(payload.savedAt);
      void saveHuntBlob({ data: payload }).catch(() => {});
    }, 45_000);
    const onHide = () => {
      const payload = collectHuntBlob();
      setLocalStamp(payload.savedAt);
      void saveHuntBlob({ data: payload }).catch(() => {});
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [isPending, userId]);

  return null;
}
