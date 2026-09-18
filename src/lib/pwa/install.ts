export const INSTALL_DISMISS_KEY = "husjagt-install-dismissed";
export const INSTALL_DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

export type InstallKind = "prompt" | "ios" | "hint" | null;

export function parseDismissedAt(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function shouldShowInstall(opts: {
  standalone: boolean;
  nativeWebView: boolean;
  dismissedAt: number | null;
  now?: number;
  hasPrompt: boolean;
  ios: boolean;
}): InstallKind {
  if (opts.standalone || opts.nativeWebView) return null;
  const now = opts.now ?? Date.now();
  if (opts.dismissedAt != null && now - opts.dismissedAt < INSTALL_DISMISS_MS) return null;
  if (opts.hasPrompt) return "prompt";
  if (opts.ios) return "ios";
  return "hint";
}
