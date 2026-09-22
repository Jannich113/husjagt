import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { applyHuntBlob, blobIsNewer, collectHuntBlob } from "@/lib/account/blob";
import { loadHuntBlob, saveHuntBlob } from "@/lib/account/blob.server";

const LOCAL_STAMP = "husjagt-blob-saved-at";

function localStamp(): number {
  if (typeof localStorage === "undefined") return 0;
  const n = Number(localStorage.getItem(LOCAL_STAMP) ?? "0");
  return Number.isFinite(n) ? n : 0;
}

function setLocalStamp(value: number) {
  localStorage.setItem(LOCAL_STAMP, String(value));
}

export function HuntSync() {
  const user = useCurrentUser();
  const armed = useRef(false);

  useEffect(() => {
    if (!user || armed.current) return;
    armed.current = true;
    let alive = true;
    void loadHuntBlob()
      .then((remote) => {
        if (!alive) return;
        const local = localStamp();
        if (blobIsNewer(remote, local) && remote) {
          applyHuntBlob(remote);
          setLocalStamp(remote.savedAt);
          window.location.reload();
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
  }, [user]);

  return null;
}
