import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const runtimeModules = path.join(
  os.homedir(),
  ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
);
const { chromium } = require(path.join(runtimeModules, "playwright"));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlUrl = pathToFileURL(path.join(__dirname, "bamboo-preview.html")).href;
const outDir = path.join(__dirname, "output");

const screens = [
  ["01-main-desktop", 1440, 1000],
  ["02-main-mobile", 390, 844],
  ["03-intro-desktop", 1440, 1000],
  ["04-intro-mobile", 390, 844],
  ["05-exhibition-desktop", 1440, 1000],
  ["06-exhibition-mobile", 390, 844],
  ["07-gallery-desktop", 1440, 1000],
  ["08-gallery-mobile", 390, 844],
  ["09-recruit-desktop", 1440, 1000],
  ["10-recruit-mobile", 390, 844],
  ["11-contact-desktop", 1440, 1000],
  ["12-contact-mobile", 390, 844]
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const [name, width, height] of screens) {
  await page.setViewportSize({ width, height });
  await page.goto(`${htmlUrl}?screen=${name}`, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: false,
    animations: "disabled"
  });
  console.log(`saved ${name}.png`);
}

await browser.close();
