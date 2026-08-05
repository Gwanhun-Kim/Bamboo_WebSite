import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const runtimeModules = path.join(
  os.homedir(),
  ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
);
const { chromium } = require(path.join(runtimeModules, "playwright"));

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ deviceScaleFactor: 1 });
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

for (const [name, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.screenshot({
    path: `/private/tmp/bamboo-${name}.png`,
    fullPage: true,
    animations: "disabled",
  });

  const failedImages = await page.locator("img").evaluateAll((images) =>
    images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src)
  );
  if (failedImages.length) throw new Error(`Failed images: ${failedImages.join(", ")}`);

  if (name === "mobile") {
    const toggle = page.getByRole("button", { name: "메뉴 열기" });
    await toggle.click();
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      throw new Error("Mobile menu did not open");
    }
    await page.keyboard.press("Escape");
    if ((await toggle.getAttribute("aria-expanded")) !== "false") {
      throw new Error("Mobile menu did not close with Escape");
    }
  }
}

await browser.close();

if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
console.log("Desktop and mobile checks passed; all images loaded; mobile menu passed.");
