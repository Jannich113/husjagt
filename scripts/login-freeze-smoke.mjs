#!/usr/bin/env node
/**
 * Fast login/hunt freeze check. No fixed soaks — waits for DOM, then
 * samples frames. Screenshots only on failure.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.SMOKE_URL ?? "http://127.0.0.1:8080";
const OUT = "/tmp/husjagt-smoke";
mkdirSync(OUT, { recursive: true });

const failures = [];

function fail(step, detail) {
  failures.push(`${step}: ${detail}`);
  console.error(`FAIL ${step}: ${detail}`);
}

async function shot(page, name) {
  if (!failures.length) return;
  await page.screenshot({ path: `${OUT}/${name}.png` }).catch(() => {});
}

async function assertResponsive(page, step) {
  const result = await page.evaluate(async () => {
    const start = performance.now();
    let worst = 0;
    for (let i = 0; i < 12; i += 1) {
      const t = performance.now();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      worst = Math.max(worst, performance.now() - t);
    }
    return {
      worst,
      elapsed: performance.now() - start,
      pointer: getComputedStyle(document.body).pointerEvents,
    };
  });
  if (result.worst > 800 || result.elapsed > 2500) {
    fail(step, `frame hitch worst=${Math.round(result.worst)}ms total=${Math.round(result.elapsed)}ms`);
  }
  if (result.pointer === "none") fail(step, "body pointer-events: none");
}

async function viewButton(page, label) {
  const link = page.getByRole("link", { name: label, exact: true });
  if (await link.count()) return link;
  return page.getByRole("button", { name: label, exact: true });
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  await page.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (type === "image" || type === "media" || type === "font") return route.abort();
    return route.continue();
  });

  let navs = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) navs += 1;
  });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Husjagt" }).waitFor();
  const dismiss = page.getByRole("button", { name: "Ikke nu" });
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
  await page.getByText(/\d+ boliger/).first().waitFor();
  console.log(`home ${Date.now() - t0}ms`);
  await assertResponsive(page, "home");

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /Opret konto|Log ind/ }).waitFor();
  const fill = page.getByRole("button", { name: /Brug test-konto/ });
  if (await fill.count()) await fill.click();
  else {
    await page.getByRole("button", { name: /allerede en konto/ }).click();
    await page.locator('input[type="email"]').fill("test@test.com");
    await page.locator('input[type="password"]').fill("test");
  }
  const navBefore = navs;
  const loginStart = Date.now();
  await page.getByRole("button", { name: "Log ind", exact: true }).click();
  await page.getByRole("button", { name: "Sign out" }).waitFor();
  const loginMs = Date.now() - loginStart;
  console.log(`login ${loginMs}ms navs=${navs - navBefore}`);
  if (loginMs > 12_000) fail("login", `slow ${loginMs}ms`);
  if (navs - navBefore > 2) fail("login", `reload loop ${navs - navBefore}`);
  await page.getByText(/\d+ boliger/).first().waitFor();
  await assertResponsive(page, "after-login");
  await shot(page, "after-login");

  await (await viewButton(page, "Kort")).click();
  await page.locator(".leaflet-container").waitFor();
  await assertResponsive(page, "map");

  await (await viewButton(page, "Liste")).click();
  await page.locator(".hunt-list-pane").waitFor();
  const card = page.locator(".hunt-list-pane button.flex.min-w-0").first();
  await card.click();
  await page.locator(".hunt-detail-pane").getByText(/kr/).first().waitFor();
  await assertResponsive(page, "detail");

  await (await viewButton(page, "Lyt")).click();
  await page.getByText(/INSTAGRAM|TikTok|opslag|Ingen/i).first().waitFor();
  await assertResponsive(page, "lyt");

  const watch = page.getByRole("button", { name: /Overvåg/ }).first();
  if (await watch.count()) {
    await watch.click();
    await assertResponsive(page, "watch");
  }

  const fatal = [...new Set(errors)].filter((line) =>
    /Import denied|Maximum update depth|ChunkLoadError/i.test(line),
  );
  if (fatal.length) fail("console", fatal.join(" | "));

  await browser.close();
  console.log(`done ${Date.now() - t0}ms`);
  if (failures.length) {
    console.error("SMOKE FAILED\n" + failures.join("\n"));
    process.exit(1);
  }
  console.log("SMOKE OK");
}

run().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
