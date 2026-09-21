import type { ReactNode } from "react";

/** App fills the viewport. Device frames belong to the host preview, not the product. */
export function WebViewShell({ children }: { children: ReactNode }) {
  return children;
}
