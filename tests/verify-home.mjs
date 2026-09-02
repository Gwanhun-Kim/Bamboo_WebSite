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
  if ((await heroSlots.count()) !== 4) throw new Error("Home hero must use four slideshow slots");

  if ((await page.getByText("밤부의 기록과 새로운 만남", { exact: true }).count()) !== 0) {
    throw new Error("Removed home overview title is still visible");
  }
  if ((await page.getByText("Explore BAMBOO", { exact: true }).count()) !== 0) {
    throw new Error("Orphaned Explore BAMBOO label is still visible");
  }
  if ((await page.locator('.hero-links a[href="recruitment/"]', { hasText: "12.5기 모집 종료" }).count()) !== 1) {
    throw new Error("Home recruitment shortcut does not show the closed status");
  }
  if ((await page.getByText("12.5기 모집 종료 · 다음 학기 모집 예정", { exact: true }).count()) !== 1) {
    throw new Error("Home recruitment summary does not show the next-semester notice");
  }

  if (name === "desktop") {
    const initialSlides = await heroSlots.locator(".hero-slide.is-active").evaluateAll((images) =>
      images.map((image) => image.getAttribute("src"))
    );
    const initialRects = await heroSlots.evaluateAll((slots) =>
      slots.map((slot) => ({ width: slot.getBoundingClientRect().width, height: slot.getBoundingClientRect().height }))
    );

    const slideDirection = await page.evaluate(() =>
      new Promise((resolve) => {
        const gallery = document.querySelector(".hero-gallery");
        const observer = new MutationObserver(() => {
          const leaving = gallery.querySelector(".hero-slide.is-leaving");
          if (!leaving) return;
          const incoming = leaving.parentElement.querySelector(".hero-slide.is-active");
          observer.disconnect();
          resolve({
            leavingTransform: getComputedStyle(leaving).transform,
            incomingTransform: getComputedStyle(incoming).transform,
          });
        });
        observer.observe(gallery, { attributes: true, subtree: true, attributeFilter: ["class"] });
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 5000);
      })
    );
    if (!slideDirection) throw new Error("Hero did not begin a horizontal slide transition");

    await page.waitForTimeout(1000);

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

    const galleryColumns = await page.locator(".hero-gallery").evaluate((gallery) =>
      getComputedStyle(gallery).gridTemplateColumns.split(" ").length
    );
    if (galleryColumns !== 2) throw new Error(`Expected two desktop hero columns, received ${galleryColumns}`);
  }

  await page.goto("http://127.0.0.1:4173/recruitment/", { waitUntil: "networkidle" });
  if ((await page.getByRole("heading", { name: /BAMBOO 12\.5기 신입부원 모집 종료/ }).count()) !== 1) {
    throw new Error("Recruitment page does not show the closed heading");
  }
  if ((await page.locator('a[href*="docs.google.com/forms"]').count()) !== 0) {
    throw new Error("Recruitment page still exposes a Google Form link");
  }
  if ((await page.getByText("지원하기", { exact: true }).count()) !== 0) {
    throw new Error("Recruitment page still exposes an application CTA");
  }
  const instagramLink = page.locator('a[href="https://www.instagram.com/sejong_bamboo/"]').first();
  if ((await instagramLink.getAttribute("target")) !== "_blank") {
    throw new Error("Recruitment Instagram link must open in a new tab");
  }
  if ((await page.locator('a[href="mailto:sejongbamboo@gmail.com"]').count()) < 1) {
    throw new Error("Recruitment email link is missing");
  }
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
    throw new Error(`Recruitment page overflows horizontally at ${width}px`);
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
