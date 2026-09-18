export const STANDALONE_MEDIA =
  "(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui), (display-mode: window-controls-overlay)";

export function isStandaloneDisplay(win: Window | undefined = typeof window === "undefined" ? undefined : window): boolean {
  if (!win) return false;
  try {
    if (win.matchMedia?.(STANDALONE_MEDIA).matches) return true;
  } catch {
    /* ignore */
  }
  const nav = win.navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

export function isIosSafari(ua: string): boolean {
  const value = ua.toLowerCase();
  const ios = /iphone|ipad|ipod/.test(value) || (/macintosh/.test(value) && /mobile/.test(value));
  return ios && !/crios|fxios|edgios/.test(value);
}

/** Legacy Android WebView wrapper (`HusjagtApp/1.0`). Not required for hunt, share, or outbound links. */
export function isNativeWebView(ua: string): boolean {
  return /HusjagtApp\//i.test(ua);
}

/** Installed Chrome PWA (display-mode) or the leftover APK wrapper. Standalone wins over UA. */
export function isInstalledApp(
  win: Window | undefined = typeof window === "undefined" ? undefined : window,
  ua: string = typeof navigator === "undefined" ? "" : navigator.userAgent,
): boolean {
  return isStandaloneDisplay(win) || isNativeWebView(ua);
}

export function isEmbeddedFrame(win: Window | undefined = typeof window === "undefined" ? undefined : window): boolean {
  if (!win) return false;
  try {
    return win.self !== win.top;
  } catch {
    return true;
  }
}
