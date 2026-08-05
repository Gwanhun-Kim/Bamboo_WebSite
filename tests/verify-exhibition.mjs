import { createRequire } from "node:module";
import { access, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const runtimeModules = path.join(
  os.homedir(),
  ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
);
const { chromium } = require(path.join(runtimeModules, "playwright"));
const projectRoot = process.cwd();
const dataPath = path.join(
  projectRoot,
  "data/exhibitions/2025-2-offline-exhibition-first.json"
);
const data = JSON.parse(await readFile(dataPath, "utf8"));

if (data.works.length !== 52) throw new Error(`Expected 52 works, got ${data.works.length}`);
const jihyoWork = data.works.find((work) => work.artist === "이지효");
const expectedJihyo = {
  title: null,
  camera: "Pentax Q7",
  settings: "f4.5\n1/2000s\nISO 400\n65mm",
  statement:
    "사진 속 장소는 노들섬입니다.\n노들섬은 제가 동아리에 들어와 부원들과 처음으로 출사를 나갔던 곳입니다. 신입생 시절, 첫 동아리 활동을 나갔을 때의 설레고도 어색했던 기분은 이제 다시 느낄 수 없겠지만, 노을이 질 무렵 부원들과 함께 걸으며 괜히 마음이 들떴던 순간과 강가에 비친 윤슬을 보며 긴장이 풀리고 나른해졌던 기억만큼은 잊을 수 없습니다.\n\n선선한 바람이 불던 작년 가을, 마지막으로 찾은 노들섬에서 강가에 비친 노을의 반짝임을 바라보다 보니 처음 이곳에 왔던 날이 자연스레 떠올랐습니다. 처음이라 긴장되어 두근거리던 감정과는 분명 달랐지만, 그때 느꼈던 노들섬의 따스함만큼은 그대로였습니다.\n\n문득 이렇게 복잡하고도 애틋한 감정들이 말로 형용할 수 없는 채로 제게 오래 남아 있었으면, 그리고 이 순간을 영원히 기억하고 싶다는 생각이 들었습니다.",
};
for (const [key, expectedValue] of Object.entries(expectedJihyo)) {
  if (jihyoWork?.[key] !== expectedValue) {
    throw new Error(`이지효 ${key} does not match the requested value`);
  }
}
for (const work of data.works) {
  await access(path.join(projectRoot, "public", work.webAsset.publicUrl));
}

const allowedFiles = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/script.js", "script.js"],
  ["/exhibitions/", "exhibitions/index.html"],
  ["/exhibitions/exhibitions.css", "exhibitions/exhibitions.css"],
  ["/exhibitions/exhibitions.js", "exhibitions/exhibitions.js"],
  ["/exhibitions/2025-2-first/", "exhibitions/2025-2-first/index.html"],
  ["/exhibitions/2025-2-first/exhibition.css", "exhibitions/2025-2-first/exhibition.css"],
  ["/exhibitions/2025-2-first/exhibition.js", "exhibitions/2025-2-first/exhibition.js"],
  ["/styles.css", "styles.css"],
  ["/data/exhibitions/2025-2-offline-exhibition-first.json", "data/exhibitions/2025-2-offline-exhibition-first.json"],
]);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://127.0.0.1").pathname;
  let relativePath = allowedFiles.get(pathname);
  if (pathname.startsWith("/assets/photos/")) {
    relativePath = pathname.slice(1);
  }
  if (pathname.startsWith("/public/exhibitions/2025-2-first/images/")) {
    relativePath = pathname.slice(1);
  }
  if (!relativePath || relativePath.includes("source-materials")) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const body = await readFile(path.join(projectRoot, relativePath));
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(relativePath)] });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ deviceScaleFactor: 1 });
const browserErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(message.text());
});
page.on("pageerror", (error) => browserErrors.push(error.message));

async function openGallery(width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(`${baseUrl}/exhibitions/2025-2-first/`, {
    waitUntil: "networkidle",
  });
  await page.locator(".work-card").first().waitFor();
  const count = await page.locator(".work-card").count();
  if (count !== 52) throw new Error(`Rendered ${count} cards instead of 52`);
}

async function openExhibitionList(width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(`${baseUrl}/exhibitions/`, { waitUntil: "networkidle" });
  await page.locator(".exhibition-entry").waitFor();
  if ((await page.locator(".exhibition-entry").count()) !== 1) {
    throw new Error("Exhibition list does not show exactly one current exhibition");
  }
  if ((await page.locator(".entry-count").textContent()) !== "52 works") {
    throw new Error("Exhibition list work count is not JSON-driven");
  }
  const href = await page.locator(".entry-link").getAttribute("href");
  if (href !== "2025-2-first/") throw new Error(`Unexpected exhibition href: ${href}`);
  const images = page.locator(".entry-images img");
  if ((await images.count()) !== 3) throw new Error("Representative image set is incomplete");
  for (let index = 0; index < 3; index += 1) {
    const loaded = await images.nth(index).evaluate((image) => image.complete && image.naturalWidth > 0);
    if (!loaded) throw new Error(`Exhibition representative image ${index + 1} failed`);
  }
}

async function expectDetail(work, expectedPosition) {
  const fallback = (value, replacement = "기록 없음") => value?.trim() || replacement;
  const values = await page.locator("[data-detail-view]").evaluate((detail) => ({
    hidden: detail.hidden,
    title: detail.querySelector("[data-detail-title]").textContent,
    artist: detail.querySelector("[data-detail-artist]").textContent,
    statement: detail.querySelector("[data-detail-statement]").textContent,
    camera: detail.querySelector("[data-detail-camera]").textContent,
    settings: detail.querySelector("[data-detail-settings]").textContent,
    date: detail.querySelector("[data-detail-date]").textContent,
    position: detail.querySelector("[data-detail-position]").textContent,
  }));

  const expected = {
    hidden: false,
    title: fallback(work.title, "제목 없음"),
    artist: work.artist,
    statement: fallback(work.statement, "작가의 말이 기록되지 않았습니다."),
    camera: fallback(work.camera),
    settings: fallback(work.settings),
    date: fallback(work.shotDate),
    position: `${expectedPosition} / 52`,
  };
  if (JSON.stringify(values) !== JSON.stringify(expected)) {
    throw new Error(`Detail mismatch for ${work.id}\n${JSON.stringify({ values, expected }, null, 2)}`);
  }
}

await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
const mainExhibitionHref = await page
  .locator(".primary-navigation a", { hasText: "Exhibition" })
  .getAttribute("href");
if (mainExhibitionHref !== "exhibitions/") {
  throw new Error(`Main Exhibition menu bypasses the list: ${mainExhibitionHref}`);
}
if ((await page.locator('a[href="exhibitions/"]').count()) < 5) {
  throw new Error("Main exhibition-related links do not all target the exhibition list");
}

await openExhibitionList(1440, 1000);
await page.screenshot({
  path: "/private/tmp/bamboo-exhibition-list-desktop.png",
  fullPage: false,
  animations: "disabled",
});
await page.locator(".entry-link").click();
await page.locator(".work-card").first().waitFor();
if (new URL(page.url()).pathname !== "/exhibitions/2025-2-first/") {
  throw new Error("Exhibition list did not navigate to the first exhibition");
}

await openGallery(1440, 1000);
const slideshow = page.locator("[data-hero-slideshow]");
if ((await slideshow.getAttribute("data-motion")) !== "active") {
  throw new Error("Hero slideshow is not active in normal motion mode");
}
if ((await page.locator(".hero-slide").count()) !== 6) {
  throw new Error("Hero slideshow did not render its JSON-driven image set");
}
if ((await page.locator(".hero-slide.active").count()) !== 1) {
  throw new Error("Hero slideshow active slide state is invalid");
}
const firstSlideSource = await page.locator(".hero-slide.active").getAttribute("src");
await page.waitForTimeout(8300);
const secondSlideSource = await page.locator(".hero-slide.active").getAttribute("src");
if (secondSlideSource === firstSlideSource) {
  throw new Error("Hero slideshow did not advance automatically");
}
await page.screenshot({
  path: "/private/tmp/bamboo-exhibition-desktop.png",
  fullPage: false,
  animations: "disabled",
});

for (let index = 0; index < 52; index += 1) {
  const image = page.locator(".work-card img").nth(index);
  await image.scrollIntoViewIfNeeded();
  await image.evaluate((element) => {
    if (element.complete && element.naturalWidth > 0) return;
    return new Promise((resolve, reject) => {
      element.addEventListener("load", resolve, { once: true });
      element.addEventListener("error", () => reject(new Error(element.src)), { once: true });
    });
  });
}

for (let index = 0; index < 52; index += 1) {
  await page.evaluate((id) => {
    window.history.replaceState(null, "", `#work=${encodeURIComponent(id)}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, data.works[index].id);
  await expectDetail(data.works[index], index + 1);
}

await openGallery(1440, 1000);

await page.locator(".work-card a").first().click();
await expectDetail(data.works[0], 1);
await page.screenshot({
  path: "/private/tmp/bamboo-exhibition-detail-desktop.png",
  fullPage: false,
  animations: "disabled",
});

await page.keyboard.press("ArrowRight");
await expectDetail(data.works[1], 2);
await page.goBack();
await expectDetail(data.works[0], 1);
await page.keyboard.press("ArrowLeft");
await expectDetail(data.works[51], 52);
await page.keyboard.press("Escape");
if (await page.locator("[data-gallery-view]").isHidden()) {
  throw new Error("Escape did not return to gallery");
}

await page.goto(
  `${baseUrl}/exhibitions/2025-2-first/#work=${data.works[40].id}`,
  { waitUntil: "networkidle" }
);
await expectDetail(data.works[40], 41);

await page.emulateMedia({ reducedMotion: "reduce" });
await openGallery(1440, 1000);
if ((await slideshow.getAttribute("data-motion")) !== "reduced") {
  throw new Error("Hero slideshow does not stop for reduced motion");
}
await page.emulateMedia({ reducedMotion: "no-preference" });

await openExhibitionList(390, 844);
await page.screenshot({
  path: "/private/tmp/bamboo-exhibition-list-mobile.png",
  fullPage: true,
  animations: "disabled",
});
await openGallery(390, 844);
const menuToggle = page.locator(".menu-toggle");
if ((await menuToggle.getAttribute("aria-label")) !== "메뉴 열기") {
  throw new Error("Mobile menu does not expose the expected accessible label");
}
await menuToggle.click();
if ((await menuToggle.getAttribute("aria-expanded")) !== "true") {
  throw new Error("Mobile menu did not open");
}
await page.keyboard.press("Escape");
if ((await menuToggle.getAttribute("aria-expanded")) !== "false") {
  throw new Error("Mobile menu did not close with Escape");
}
await page.screenshot({
  path: "/private/tmp/bamboo-exhibition-mobile.png",
  fullPage: false,
  animations: "disabled",
});
await page.locator(".work-card a").first().click();
await expectDetail(data.works[0], 1);
const mobileLayout = await page.locator(".detail-layout").evaluate((layout) => {
  const image = layout.querySelector(".detail-image-wrap").getBoundingClientRect();
  const caption = layout.querySelector(".detail-caption").getBoundingClientRect();
  return { imageBottom: image.bottom, captionTop: caption.top };
});
if (mobileLayout.captionTop < mobileLayout.imageBottom) {
  throw new Error("Mobile detail caption does not stack below image");
}
await page.screenshot({
  path: "/private/tmp/bamboo-exhibition-detail-mobile.png",
  fullPage: false,
  animations: "disabled",
});

await browser.close();
await new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
});
if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);
console.log("Exhibition checks passed: 52 works, images, details, history, keyboard, responsive layout.");
