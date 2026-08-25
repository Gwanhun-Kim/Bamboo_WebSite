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
const familiarDataPath = path.join(
  projectRoot,
  "data/exhibitions/2025-2-familiar-happiness.json"
);
const familiarData = JSON.parse(await readFile(familiarDataPath, "utf8"));
const attractionDataPath = path.join(
  projectRoot,
  "data/exhibitions/2026-2-attraction.json"
);
const attractionData = JSON.parse(await readFile(attractionDataPath, "utf8"));
const withoutIndex = (pathname) => pathname.replace(/index\.html$/, "");

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
for (const work of familiarData.works) {
  await access(path.join(projectRoot, "public", work.webAsset.publicUrl));
}
if (attractionData.status !== "published" || attractionData.works.length !== 68) {
  throw new Error("Attraction exhibition must be published with exactly 68 works");
}
for (const work of attractionData.works) {
  await access(path.join(projectRoot, "public", work.webAsset.publicUrl));
}

const allowedFiles = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/script.js", "script.js"],
  ["/exhibitions/", "exhibitions/index.html"],
  ["/exhibitions/index.html", "exhibitions/index.html"],
  ["/exhibitions/exhibitions.css", "exhibitions/exhibitions.css"],
  ["/exhibitions/exhibitions.js", "exhibitions/exhibitions.js"],
  ["/exhibitions/exhibition-detail.css", "exhibitions/exhibition-detail.css"],
  ["/exhibitions/2025-2-first/", "exhibitions/2025-2-first/index.html"],
  ["/exhibitions/2025-2-first/index.html", "exhibitions/2025-2-first/index.html"],
  ["/exhibitions/2025-2-first/exhibition.css", "exhibitions/2025-2-first/exhibition.css"],
  ["/exhibitions/2025-2-first/exhibition.js", "exhibitions/2025-2-first/exhibition.js"],
  ["/exhibitions/2025-2-familiar-happiness/", "exhibitions/2025-2-familiar-happiness/index.html"],
  ["/exhibitions/2025-2-familiar-happiness/index.html", "exhibitions/2025-2-familiar-happiness/index.html"],
  ["/exhibitions/2025-2-familiar-happiness/exhibition.css", "exhibitions/2025-2-familiar-happiness/exhibition.css"],
  ["/exhibitions/2025-2-familiar-happiness/exhibition.js", "exhibitions/2025-2-familiar-happiness/exhibition.js"],
  ["/exhibitions/2026-2-attraction/", "exhibitions/2026-2-attraction/index.html"],
  ["/exhibitions/2026-2-attraction/index.html", "exhibitions/2026-2-attraction/index.html"],
  ["/exhibitions/2026-2-attraction/exhibition.css", "exhibitions/2026-2-attraction/exhibition.css"],
  ["/exhibitions/2026-2-attraction/exhibition.js", "exhibitions/2026-2-attraction/exhibition.js"],
  ["/styles.css", "styles.css"],
  ["/data/exhibitions/2025-2-offline-exhibition-first.json", "data/exhibitions/2025-2-offline-exhibition-first.json"],
  ["/data/exhibitions/2025-2-familiar-happiness.json", "data/exhibitions/2025-2-familiar-happiness.json"],
  ["/data/exhibitions/2026-2-attraction.json", "data/exhibitions/2026-2-attraction.json"],
]);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  if (pathname === "/api/guestbook" || pathname === "/api/guestbook/") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ enabled: false, code: "guestbook_not_configured" }));
    return;
  }
  let relativePath = allowedFiles.get(pathname);
  if (pathname.startsWith("/assets/photos/")) {
    relativePath = pathname.slice(1);
  }
  if (pathname.startsWith("/assets/activity-cards/")) {
    relativePath = pathname.slice(1);
  }
  if (pathname.startsWith("/assets/activity-photos/")) {
    relativePath = pathname.slice(1);
  }
  if (pathname.startsWith("/assets/exhibition-posters/")) {
    relativePath = pathname.slice(1);
  }
  if (pathname.startsWith("/public/exhibitions/2025-2-first/images/")) {
    relativePath = pathname.slice(1);
  }
  if (pathname.startsWith("/public/exhibitions/2025-2-familiar-happiness/images/")) {
    relativePath = pathname.slice(1);
  }
  if (pathname.startsWith("/public/exhibitions/2026-2-attraction/images/")) {
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
  if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) {
    browserErrors.push(message.text());
  }
});
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400) {
    browserErrors.push(`${response.status()} ${response.url()}`);
  }
});

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
  await page.locator(".exhibition-entry").first().waitFor();
  if ((await page.locator(".exhibition-entry").count()) !== 3) {
    throw new Error("Exhibition list does not show all three exhibitions");
  }
  if ((await page.locator(".entry-count").first().textContent()) !== "68 works") {
    throw new Error("Attraction exhibition work count is not JSON-driven");
  }
  if ((await page.locator(".entry-count").nth(1).textContent()) !== "52 works") {
    throw new Error("Exhibition list work count is not JSON-driven");
  }
  if ((await page.locator(".entry-count").nth(2).textContent()) !== `${familiarData.works.length} works`) {
    throw new Error("Familiar Happiness work count is not JSON-driven");
  }
  const href = await page.locator(".entry-link").first().getAttribute("href");
  if (withoutIndex(new URL(href, `${baseUrl}/exhibitions/`).pathname) !== "/exhibitions/2026-2-attraction/") {
    throw new Error(`Unexpected attraction exhibition href: ${href}`);
  }
  const firstHref = await page.locator(".entry-link").nth(1).getAttribute("href");
  if (withoutIndex(new URL(firstHref, `${baseUrl}/exhibitions/`).pathname) !== "/exhibitions/2025-2-first/") {
    throw new Error(`Unexpected exhibition href: ${firstHref}`);
  }
  const familiarHref = await page.locator(".entry-link").nth(2).getAttribute("href");
  if (
    withoutIndex(new URL(familiarHref, `${baseUrl}/exhibitions/`).pathname) !==
    "/exhibitions/2025-2-familiar-happiness/"
  ) {
    throw new Error(`Unexpected Familiar Happiness href: ${familiarHref}`);
  }
  const images = page.locator(".entry-images img");
  if ((await images.count()) !== 3) throw new Error("Exhibition cover set is incomplete");
  const expectedCoverNames = [
    attractionData.cover.publicUrl.split("/").at(-1),
    "first-poster.png",
    "familiar-happiness-poster.jpg",
  ];
  for (let index = 0; index < expectedCoverNames.length; index += 1) {
    const poster = images.nth(index);
    const loaded = await poster.evaluate((image) => image.complete && image.naturalWidth > 0);
    const source = await poster.getAttribute("src");
    const objectFit = await poster.evaluate((image) => getComputedStyle(image).objectFit);
    if (!loaded || !source.endsWith(expectedCoverNames[index]) || objectFit !== "contain") {
      throw new Error(`Exhibition cover ${index + 1} is not rendered correctly`);
    }
  }
}

async function expectExhibitionIndexLink(detailPath, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(`${baseUrl}${detailPath}`, { waitUntil: "networkidle" });

  const link = page.locator(".exhibition-index-link");
  await link.waitFor();
  if ((await link.textContent()).trim() !== "← 전시 목록으로") {
    throw new Error(`${detailPath} has an unexpected exhibition index link label`);
  }

  const href = await link.getAttribute("href");
  if (withoutIndex(new URL(href, `${baseUrl}${detailPath}`).pathname) !== "/exhibitions/") {
    throw new Error(`${detailPath} has an unexpected exhibition index href: ${href}`);
  }

  const minimumHeight = await link.evaluate((element) => element.getBoundingClientRect().height);
  if (minimumHeight < 44) {
    throw new Error(`${detailPath} exhibition index link is too small at ${width}px`);
  }

  const activeExhibitionMenu = page.locator('.primary-navigation a[aria-current="page"]');
  if (
    (await activeExhibitionMenu.count()) !== 1 ||
    (await activeExhibitionMenu.textContent()).trim() !== "Exhibition"
  ) {
    throw new Error(`${detailPath} lost the active Exhibition navigation state`);
  }

  await link.focus();
  const focusStyle = await link.evaluate((element) => ({
    outlineStyle: getComputedStyle(element).outlineStyle,
    outlineWidth: getComputedStyle(element).outlineWidth,
  }));
  if (focusStyle.outlineStyle === "none" || focusStyle.outlineWidth === "0px") {
    throw new Error(`${detailPath} exhibition index link has no visible focus state`);
  }

  await link.click();
  await page.waitForURL(`${baseUrl}/exhibitions/`);
  await page.locator(".exhibition-entry").first().waitFor();
}

async function openAttraction(width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(`${baseUrl}/exhibitions/2026-2-attraction/`, { waitUntil: "networkidle" });
  await page.locator(".attraction-work-card").first().waitFor();
  if ((await page.locator(".attraction-work-card").count()) !== 68) {
    throw new Error("Attraction exhibition does not render all 68 works");
  }
  if (!(await page.locator("[data-exhibition-state]").isHidden())) {
    throw new Error("Attraction exhibition still shows its preparing state");
  }
  if ((await page.locator("[data-work-count]").textContent()) !== "68") {
    throw new Error("Attraction exhibition work count is not 68");
  }
  if (attractionData.status !== "published" || attractionData.works.length !== 68) {
    throw new Error("Attraction exhibition JSON is not published with 68 works");
  }
  if (!(await page.locator("[data-guestbook-form]").isHidden())) {
    throw new Error("Guestbook form should remain hidden without Supabase configuration");
  }
  if (!(await page.locator("[data-guestbook-availability]").textContent()).includes("준비")) {
    throw new Error("Guestbook unavailable state is not explained to the visitor");
  }
  const pageWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  if (pageWidth.scroll > pageWidth.client) {
    throw new Error(`Attraction exhibition overflows at ${width}px`);
  }
}

async function expectNoAttractionCardOverlap(width) {
  const overlaps = await page.locator(".attraction-work-card").evaluateAll((cards) => {
    const rectangles = cards.map((card, index) => ({ index, rect: card.getBoundingClientRect() }));
    const conflicts = [];
    for (let left = 0; left < rectangles.length; left += 1) {
      for (let right = left + 1; right < rectangles.length; right += 1) {
        const first = rectangles[left];
        const second = rectangles[right];
        const overlapWidth = Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left);
        const overlapHeight = Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top);
        if (overlapWidth > 1 && overlapHeight > 1) conflicts.push([first.index + 1, second.index + 1]);
      }
    }
    return conflicts;
  });
  if (overlaps.length) {
    throw new Error(`Attraction cards overlap at ${width}px: ${JSON.stringify(overlaps.slice(0, 5))}`);
  }
}

async function expectAttractionDetail(work, expectedPosition) {
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
    position: `${expectedPosition} / 68`,
  };
  if (JSON.stringify(values) !== JSON.stringify(expected)) {
    throw new Error(`Attraction detail mismatch for ${work.id}`);
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
if (withoutIndex(new URL(mainExhibitionHref, baseUrl).pathname) !== "/exhibitions/") {
  throw new Error(`Main Exhibition menu bypasses the list: ${mainExhibitionHref}`);
}
if ((await page.locator('a[href="exhibitions/"]').count()) < 2) {
  throw new Error("Main exhibition navigation and overview do not target the exhibition list");
}

await openExhibitionList(1440, 1000);
await page.screenshot({
  path: "/private/tmp/bamboo-exhibition-list-desktop.png",
  fullPage: false,
  animations: "disabled",
});
await page.locator(".entry-link").nth(1).click();
await page.locator(".work-card").first().waitFor();
if (withoutIndex(new URL(page.url()).pathname) !== "/exhibitions/2025-2-first/") {
  throw new Error("Exhibition list did not navigate to the first exhibition");
}

for (const detailPath of [
  "/exhibitions/2025-2-first/",
  "/exhibitions/2025-2-familiar-happiness/",
  "/exhibitions/2026-2-attraction/",
]) {
  await expectExhibitionIndexLink(detailPath, 1440, 1000);
  await expectExhibitionIndexLink(detailPath, 390, 844);
}

await openGallery(1440, 1000);
const heroPoster = page.locator(".exhibition-hero-poster img");
if (
  !(await heroPoster.evaluate((image) => image.complete && image.naturalWidth > 0)) ||
  !(await heroPoster.getAttribute("src")).endsWith("first-poster.png")
) {
  throw new Error("First exhibition hero poster failed");
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

await openExhibitionList(390, 844);
await page.screenshot({
  path: "/private/tmp/bamboo-exhibition-list-mobile.png",
  fullPage: true,
  animations: "disabled",
});
await openAttraction(1440, 1000);
await page.screenshot({
  path: "/private/tmp/bamboo-attraction-desktop.png",
  fullPage: false,
  animations: "disabled",
});
await openAttraction(390, 844);
await expectNoAttractionCardOverlap(390);
await page.screenshot({
  path: "/private/tmp/bamboo-attraction-mobile.png",
  fullPage: true,
  animations: "disabled",
});
await page.locator(".attraction-work-card a").first().click();
await expectAttractionDetail(attractionData.works[0], 1);
const attractionMobileLayout = await page
  .locator(".attraction-detail-layout")
  .evaluate((layout) => {
    const image = layout.querySelector(".attraction-detail-image-wrap").getBoundingClientRect();
    const caption = layout.querySelector(".attraction-detail-caption").getBoundingClientRect();
    return { imageBottom: image.bottom, captionTop: caption.top };
  });
if (attractionMobileLayout.captionTop < attractionMobileLayout.imageBottom) {
  throw new Error("Attraction mobile detail caption does not stack below the image");
}
await openAttraction(1440, 1000);
for (let index = 0; index < 68; index += 1) {
  const image = page.locator(".attraction-work-card img").nth(index);
  await image.scrollIntoViewIfNeeded();
  const loaded = await image.evaluate((element) => element.complete && element.naturalWidth > 0);
  if (!loaded) throw new Error(`Attraction work image ${index + 1} failed to load`);
  const pixelStats = await image.evaluate((element) => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext("2d");
    context.drawImage(element, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let total = 0;
    let minimum = 255;
    let maximum = 0;
    let count = 0;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const luminance =
        0.2126 * pixels[offset] +
        0.7152 * pixels[offset + 1] +
        0.0722 * pixels[offset + 2];
      total += luminance;
      minimum = Math.min(minimum, luminance);
      maximum = Math.max(maximum, luminance);
      count += 1;
    }
    return { average: total / count, range: maximum - minimum };
  });
  if (pixelStats.average <= 1 && pixelStats.range <= 1) {
    throw new Error(`Attraction work image ${index + 1} renders as solid black`);
  }
}
await expectNoAttractionCardOverlap(1440);
await page.locator(".attraction-work-card a").first().click();
await expectAttractionDetail(attractionData.works[0], 1);
await page.keyboard.press("ArrowRight");
await expectAttractionDetail(attractionData.works[1], 2);
await page.keyboard.press("ArrowLeft");
await expectAttractionDetail(attractionData.works[0], 1);
await page.keyboard.press("Escape");
if (await page.locator("[data-gallery-view]").isHidden()) {
  throw new Error("Attraction Escape navigation did not return to the gallery");
}
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
console.log("Exhibition checks passed: archive, back links, published attraction works, guestbook fallback, galleries, details, history, keyboard, responsive layout.");
