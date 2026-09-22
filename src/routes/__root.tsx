import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { PwaChrome } from "@/components/pwa/pwa-chrome";
import { WebViewShell } from "@/components/webview-shell";
import appCss from "../styles.css?url";

const APP_NAME = "Husjagt";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#2C4A3E" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      {
        name: "description",
        content: "Find huse til salg i Danmark. Villa, rækkehus og andelsbolig fra Boligsiden — plus Instagram, TikTok og sociale opslag i området.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
    ],
  }),
  component: () => (
    <html lang="da" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bg text-fg">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var q=[];window.__huntQueue=q;document.addEventListener('click',function(e){if(window.__huntReady)return;var n=e.target&&e.target.closest&&e.target.closest('[data-view]');if(!n)return;e.preventDefault();q.push(n.getAttribute('data-view'));},true);})();",
          }}
        />
        <PreviewHostBridge />
        <AuthProvider>
          <WebViewShell>
            <PwaChrome>
              <Outlet />
            </PwaChrome>
          </WebViewShell>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
