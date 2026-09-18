/** Production-only. Dev must not register a SW or Vite HMR breaks. */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) void reg.unregister();
    });
    return;
  }

  window.addEventListener(
    "load",
    () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* fail closed — hunt still works online */
      });
    },
    { once: true },
  );
}
