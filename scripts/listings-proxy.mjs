#!/usr/bin/env node
/**
 * Local Playwright proxy for Danish listing APIs.
 * Cloudflare blocks datacenter curl; Chromium from this process is allowed.
 * Unix socket only — a TCP port would be picked up as the Grok live preview.
 */
import fs from "node:fs";
import http from "node:http";
import { chromium } from "playwright";

const SOCKET = process.env.LISTINGS_PROXY_SOCKET || "/tmp/listings-proxy.sock";
const TTL_MS = 10 * 60_000;
const ALLOWED_HOSTS = new Set([
  "api.boligsiden.dk",
  "api.boliga.dk",
  "www.guloggratis.dk",
  "www.dba.dk",
  "www.facebook.com",
  "www.instagram.com",
  "instagram.com",
  "api.dataforsyningen.dk",
  "www.tiktok.com",
  "html.duckduckgo.com",
  "duckduckgo.com",
]);

/** @type {import('playwright').Browser | null} */
let browser = null;
/** @type {import('playwright').BrowserContext | null} */
let context = null;
/** @type {Map<string, { expires: number, body: string, status: number, type: string }>} */
const cache = new Map();

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function getContext() {
  if (context) return context;
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  context = await browser.newContext({
    locale: "da-DK",
    timezoneId: "Europe/Copenhagen",
    geolocation: { latitude: 55.4038, longitude: 10.4024 },
    permissions: ["geolocation"],
    userAgent: UA,
    extraHTTPHeaders: {
      Accept: "application/json, text/html, text/plain, */*",
      "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
    },
  });
  return context;
}

async function fetchUpstream(url, html) {
  const key = `${html ? "html:" : ""}${url}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit;
  const ctx = await getContext();
  const page = await ctx.newPage();
  try {
    const res = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 25_000,
    });
    if (html) await page.waitForTimeout(2500);
    const status = res?.status() ?? 502;
    const typeHeader = res?.headers()["content-type"] || "text/html";
    const body = html
      ? await page.content()
      : await page.evaluate(() => document.body?.innerText ?? "");
    const entry = {
      expires: Date.now() + TTL_MS,
      body,
      status,
      type: html
        ? "text/html; charset=utf-8"
        : typeHeader.includes("json")
          ? "application/json; charset=utf-8"
          : typeHeader,
    };
    if (status === 200) cache.set(key, entry);
    return entry;
  } finally {
    await page.close().catch(() => {});
  }
}

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://listings-proxy");
    if (url.pathname === "/health") {
      return json(res, 200, { ok: true });
    }
    if (url.pathname !== "/fetch") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("");
      return;
    }
    const target = url.searchParams.get("url");
    const html = url.searchParams.get("html") === "1";
    if (!target) return json(res, 400, { error: "missing url" });
    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return json(res, 400, { error: "bad url" });
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return json(res, 403, { error: "host not allowed" });
    }
    const result = await fetchUpstream(parsed.toString(), html);
    res.writeHead(result.status, {
      "content-type": result.type,
      "cache-control": "private, max-age=60",
    });
    res.end(result.body);
  } catch (err) {
    json(res, 502, { error: err instanceof Error ? err.message : "proxy failed" });
  }
});

try {
  fs.unlinkSync(SOCKET);
} catch {
  /* first boot */
}

server.listen(SOCKET, () => {
  try {
    fs.chmodSync(SOCKET, 0o600);
  } catch {
    /* ignore */
  }
  console.log(`listings-proxy on unix:${SOCKET}`);
});
