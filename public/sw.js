/* Husjagt app-shell service worker (PWA-1).
 *
 * Cache bump: change SHELL below (e.g. husjagt-shell-v2). Install calls
 * skipWaiting(); activate deletes older husjagt-shell-* caches and claims clients.
 * Dev (`npm run dev`) does not register this file — HMR stays intact.
 */
const SHELL = "husjagt-shell-v1";

const PRECACHE = [
  "/",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/__grok/icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith("husjagt-shell-") && key !== SHELL).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/__grok/") ||
    url.pathname.startsWith("/reels/") ||
    /\.(?:js|css|png|svg|jpg|jpeg|webp|woff2|ico)$/i.test(url.pathname)
  );
}

function isApi(request, url) {
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.includes("_server")) return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json") && !accept.includes("text/html");
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const copy = response.clone();
    const cache = await caches.open(SHELL);
    await cache.put(request, copy);
  }
  return response;
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const copy = response.clone();
      const cache = await caches.open(SHELL);
      await cache.put(request, copy);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const shell = await caches.match(fallbackUrl);
      if (shell) return shell;
    }
    return new Response("Husjagt er offline.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!isSameOrigin(url)) return;
  if (url.pathname === "/sw.js") return;
  if (url.pathname === "/__grok/manifest.webmanifest" || url.pathname === "/__grok/manifest.json") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isApi(request, url)) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/"));
    return;
  }
  if (isAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});
