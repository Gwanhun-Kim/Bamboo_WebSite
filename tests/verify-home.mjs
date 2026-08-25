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

  const heroSlots = page.locator("[data-hero-slide]");
  if ((await heroSlots.count()) !== 6) throw new Error("Home hero must keep six slideshow slots");

  if (name === "desktop") {
    const initialSlides = await heroSlots.locator(".hero-slide.is-active").evaluateAll((images) =>
      images.map((image) => image.getAttribute("src"))
    );
    const initialRects = await heroSlots.evaluateAll((slots) =>
      slots.map((slot) => ({ width: slot.getBoundingClientRect().width, height: slot.getBoundingClientRect().height }))
    );

    await page.waitForTimeout(4300);

    const nextSlides = await heroSlots.locator(".hero-slide.is-active").evaluateAll((images) =>
      images.map((image) => image.getAttribute("src"))
    );
    const nextRects = await heroSlots.evaluateAll((slots) =>
      slots.map((slot) => ({ width: slot.getBoundingClientRect().width, height: slot.getBoundingClientRect().height }))
    );
    const changedSlides = nextSlides.filter((src, index) => src !== initialSlides[index]).length;
    if (changedSlides !== 1) throw new Error(`Expected one sequential hero slide change, received ${changedSlides}`);
    if (JSON.stringify(initialRects) !== JSON.stringify(nextRects)) {
      throw new Error("Hero slideshow changed the grid slot dimensions");
    }
  }

  if (name === "mobile") {
    const toggle = page.locator(".menu-toggle");
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

const reducedMotionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
await reducedMotionPage.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
const reducedInitialSlides = await reducedMotionPage.locator(".hero-slide.is-active").evaluateAll((images) =>
  images.map((image) => image.getAttribute("src"))
);
await reducedMotionPage.waitForTimeout(4300);
const reducedFinalSlides = await reducedMotionPage.locator(".hero-slide.is-active").evaluateAll((images) =>
  images.map((image) => image.getAttribute("src"))
);
if (JSON.stringify(reducedInitialSlides) !== JSON.stringify(reducedFinalSlides)) {
  throw new Error("Hero slideshow did not stop for reduced motion");
}
await reducedMotionPage.close();

await browser.close();

if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
console.log("Desktop and mobile checks passed; hero slideshow, reduced motion, images, and mobile menu passed.");
