#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.SMOKE_URL ?? "http://127.0.0.1:8080";
const OUT = "/tmp/husjagt-smoke";
mkdirSync(OUT, { recursive: true });

function fail(step, detail) {
  console.error(`FAIL ${step}: ${detail}`);
  process.exitCode = 1;
}

async function assertResponsive(page, step) {
  const t0 = Date.now();
  const ok = await page.evaluate(async () => {
    const start = performance.now();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return performance.now() - start < 2500;
  });
  const ms = Date.now() - t0;
  if (!ok || ms > 4000) fail(step, `rAF hung (${ms}ms)`);
  const pe = await page.evaluate(() => getComputedStyle(document.body).pointerEvents);
  if (pe === "none") fail(step, "body pointer-events: none");
}

async function countListings(page) {
  return page.locator("article, [data-listing], a[href*='/listing/']").count();
}

async function run() {
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const reloads = { n: 0 };
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) reloads.n += 1;
  });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  console.log("1 home");
  const homeStart = Date.now();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.getByRole("heading", { name: "Husjagt" }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  const homeMs = Date.now() - homeStart;
  console.log(`  home heading ${homeMs}ms`);
  if (homeMs > 15000) fail("home", `slow ${homeMs}ms`);
  await assertResponsive(page, "home");
  await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: false });

  console.log("2 login page");
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.getByRole("heading", { name: /Opret konto|Log ind/ }).waitFor({ timeout: 15000 });
  const fill = page.getByRole("button", { name: /Brug test-konto/ });
  if (await fill.count()) {
    await fill.click();
  } else {
    await page.getByRole("button", { name: /allerede en konto/ }).click();
    await page.locator('input[type="email"]').fill("test@test.com");
    await page.locator('input[type="password"]').fill("test");
  }
  const before = reloads.n;
  const loginStart = Date.now();
  await page.getByRole("button", { name: "Log ind" }).click();
  await page.getByRole("heading", { name: "Husjagt" }).waitFor({ timeout: 25000 });
  const loginMs = Date.now() - loginStart;
  console.log(`  logged in ${loginMs}ms, navigations=${reloads.n - before}`);
  if (loginMs > 20000) fail("login", `slow ${loginMs}ms`);
  if (reloads.n - before > 3) fail("login", `reload loop ${reloads.n - before}`);
  await page.waitForTimeout(2000);
  await assertResponsive(page, "after-login");
  const signed = await page.getByText("test", { exact: false }).first().isVisible().catch(() => false);
  console.log(`  saw identity chip: ${signed}`);
  await page.screenshot({ path: `${OUT}/02-after-login.png` });

  console.log("3 list stays populated");
  const cards = await countListings(page);
  console.log(`  listing nodes=${cards}`);
  const emptyHang = await page.getByText("Henter live boliger").isVisible().catch(() => false);
  if (emptyHang) fail("list", "stuck on Henter live boliger");
  await assertResponsive(page, "list");

  console.log("4 switch Kort");
  const kort = page.getByRole("button", { name: /^Kort$/ }).first();
  if (await kort.count()) {
    await kort.click();
    await page.waitForTimeout(1200);
    await assertResponsive(page, "map");
    await page.screenshot({ path: `${OUT}/03-map.png` });
  }

  console.log("5 switch Liste");
  const liste = page.getByRole("button", { name: /^Liste$/ }).first();
  if (await liste.count()) {
    await liste.click();
    await page.waitForTimeout(800);
    await assertResponsive(page, "list-again");
  }

  console.log("6 Overvåg prompts konto or works");
  const watch = page.getByRole("button", { name: /Overvåg/ }).first();
  if (await watch.count()) {
    await watch.click();
    await page.waitForTimeout(500);
    await assertResponsive(page, "watch");
  }

  console.log("8 soak 8s after login");
  for (const extra of [2000, 2000, 2000, 2000]) {
    await page.waitForTimeout(extra);
    await assertResponsive(page, `soak-${extra}`);
    if (reloads.n - before > 3) fail("soak", `reload loop ${reloads.n - before}`);
  }

  console.log("9 open listing");
  const card = page.locator(".hunt-list-pane button, .hunt-list-pane article").first();
  const listingLink = page.locator("a[href*='/listing/']").first();
  if (await page.getByRole("button", { name: /^Liste$/ }).count()) {
    await page.getByRole("button", { name: /^Liste$/ }).first().click();
    await page.waitForTimeout(600);
  }
  if (await listingLink.count()) {
    await listingLink.click();
  } else if (await card.count()) {
    await card.click();
  }
  await page.waitForTimeout(1500);
  await assertResponsive(page, "detail");
  await page.screenshot({ path: `${OUT}/04-detail.png` });
  const back = page.getByRole("button", { name: /Tilbage|tilbage/ }).first();
  if (await back.count()) await back.click();
  else await page.goBack();
  await page.getByRole("heading", { name: "Husjagt" }).waitFor({ timeout: 15000 });
  await assertResponsive(page, "back-home");

  console.log("10 Lyt");
  const lyt = page.getByRole("button", { name: /^Lyt$/ }).first();
  if (await lyt.count()) {
    await lyt.click();
    await page.waitForTimeout(2000);
    await assertResponsive(page, "lyt");
    await page.screenshot({ path: `${OUT}/05-lyt.png` });
    if (await liste.count()) await liste.click();
  }

  if (errors.length) {
    const unique = [...new Set(errors)].slice(0, 8);
    console.log("console errors:\n", unique.join("\n"));
    const fatal = unique.filter(
      (line) =>
        /Import denied|Maximum update depth|ChunkLoadError|is not defined|aborted/i.test(line) &&
        !/Download the React DevTools|failed to load favicon/i.test(line),
    );
    if (fatal.length) fail("console", fatal.join(" | "));
  }

  await browser.close();
  if (process.exitCode) {
    console.error("SMOKE FAILED");
    process.exit(process.exitCode);
  }
  console.log("SMOKE OK");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
