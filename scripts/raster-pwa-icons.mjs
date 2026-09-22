/**
 * Rasterize public/favicon.svg into PWA PNG icons (192 / 512 / maskable 512).
 * Run: node scripts/raster-pwa-icons.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BG = "#F1EDE4";
const FG = "#2C4A3E";

function houseMark(size, inset) {
  const inner = size - inset * 2;
  const s = inner / 32;
  const x = (n) => inset + n * s;
  const y = (n) => inset + n * s;
  const w = (n) => n * s;
  return `
    <rect x="${inset}" y="${inset}" width="${inner}" height="${inner}" rx="${6 * s}" fill="${BG}"/>
    <rect x="${x(21.5)}" y="${y(8)}" width="${w(3)}" height="${w(6)}" fill="${FG}"/>
    <polygon points="${x(16)},${y(6)} ${x(27.5)},${y(16.5)} ${x(4.5)},${y(16.5)}" fill="${FG}"/>
    <rect x="${x(8.5)}" y="${y(16)}" width="${w(15)}" height="${w(11.5)}" fill="${FG}"/>
    <rect x="${x(14.25)}" y="${y(20.5)}" width="${w(3.5)}" height="${w(7)}" fill="${BG}"/>
  `;
}

async function rasterAll() {
  const browser = await chromium.launch({ args: ["--disable-web-security"] });
  const jobs = [
    [192, 0, "icon-192.png"],
    [512, 0, "icon-512.png"],
    [512, Math.round(512 * 0.12), "icon-maskable-512.png"],
  ];
  try {
    for (const [size, inset, outName] of jobs) {
      const page = await browser.newPage({
        viewport: { width: size, height: size },
        deviceScaleFactor: 1,
      });
      await page.setContent(
        `<!doctype html><html><head><style>
          html,body{margin:0;width:${size}px;height:${size}px;background:${BG};}
        </style></head><body>
          <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <rect width="${size}" height="${size}" fill="${BG}"/>
            ${houseMark(size, inset)}
          </svg>
        </body></html>`,
        { waitUntil: "load" },
      );
      const buf = await page.screenshot({ type: "png", omitBackground: false });
      writeFileSync(join(ROOT, "public", outName), buf);
      await page.close();
      console.log(`wrote public/${outName} (${size}×${size}, inset ${inset})`);
    }
  } finally {
    await browser.close();
  }
}

await rasterAll();
