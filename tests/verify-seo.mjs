import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sitemapUrl = "https://www.sejongbamboo.site/sitemap.xml";
const shareImageUrl = "https://sejongbamboo.site/assets/brand/bamboo-logo-og.jpg";
const pages = [
  {
    file: "index.html",
    url: "https://www.sejongbamboo.site/",
    title: "세종대학교 사진동아리 밤부(BAMBOO) | 공식 홈페이지",
    shareUrl: "https://sejongbamboo.site/",
    shareTitle: "BAMBOO | 세종대학교 사진동아리",
    shareDescription: "사진으로 순간을 기록하고, 함께 시선을 나누는 세종대학교 사진동아리 밤부",
  },
  {
    file: "activities/index.html",
    url: "https://www.sejongbamboo.site/activities/",
    title: "밤부 활동 | 세종대학교 사진동아리 BAMBOO",
    shareUrl: "https://sejongbamboo.site/activities/",
    shareTitle: "밤부 활동 | 세종대학교 사진동아리 BAMBOO",
    shareDescription:
      "세종대학교 사진동아리 밤부의 출사, 스터디, 콘테스트, 전시 준비와 소모임 활동 기록",
  },
  {
    file: "exhibitions/index.html",
    url: "https://www.sejongbamboo.site/exhibitions/",
    title: "밤부 사진전 | 세종대학교 사진동아리 BAMBOO",
    shareUrl: "https://sejongbamboo.site/exhibitions/",
    shareTitle: "밤부 사진전 | 세종대학교 사진동아리 BAMBOO",
    shareDescription: "세종대학교 사진동아리 밤부의 온라인 및 오프라인 사진전 아카이브",
  },
  {
    file: "exhibitions/2026-2-attraction/index.html",
    url: "https://www.sejongbamboo.site/exhibitions/2026-2-attraction/",
    title: "끌림 | 세종대학교 사진동아리 밤부 사진전",
    shareUrl: "https://sejongbamboo.site/exhibitions/2026-2-attraction/",
    shareTitle: "끌림 | 세종대학교 사진동아리 밤부 사진전",
    shareDescription: "세종대학교 사진동아리 밤부의 열아홉번째 사진전 끌림",
    runtimeScript: "exhibitions/2026-2-attraction/exhibition.js",
  },
  {
    file: "exhibitions/2025-2-first/index.html",
    url: "https://www.sejongbamboo.site/exhibitions/2025-2-first/",
    title: "처음 | 세종대학교 사진동아리 밤부 사진전",
    shareUrl: "https://sejongbamboo.site/exhibitions/2025-2-first/",
    shareTitle: "처음 | 세종대학교 사진동아리 밤부 사진전",
    shareDescription: "세종대학교 사진동아리 밤부의 열여덟번째 사진전 처음",
    runtimeScript: "exhibitions/2025-2-first/exhibition.js",
  },
  {
    file: "exhibitions/2025-2-familiar-happiness/index.html",
    url: "https://www.sejongbamboo.site/exhibitions/2025-2-familiar-happiness/",
    title: "익숙한 행복 | 세종대학교 사진동아리 밤부 사진전",
    shareUrl: "https://sejongbamboo.site/exhibitions/2025-2-familiar-happiness/",
    shareTitle: "익숙한 행복 | 세종대학교 사진동아리 밤부 사진전",
    shareDescription: "세종대학교 사진동아리 밤부의 열일곱번째 사진전 익숙한 행복",
    runtimeScript: "exhibitions/2025-2-familiar-happiness/exhibition.js",
  },
  {
    file: "recruitment/index.html",
    url: "https://www.sejongbamboo.site/recruitment/",
    title: "12.5기 모집 종료 | 세종대학교 사진동아리 밤부",
    shareUrl: "https://sejongbamboo.site/recruitment/",
    shareTitle: "12.5기 모집 종료 | 세종대학교 사진동아리 밤부",
    shareDescription: "세종대학교 사진동아리 밤부 12.5기 신입부원 모집 종료 및 다음 학기 모집 안내",
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMetaContent(html, attribute, value) {
  const tags = [
    ...html.matchAll(
      new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapeRegExp(value)}["'][^>]*>`, "gi")
    ),
  ].map((match) => match[0]);
  if (tags.length !== 1) return { count: tags.length, content: null };
  return {
    count: 1,
    content: tags[0].match(/content=["']([^"']*)["']/i)?.[1] ?? null,
  };
}

function getJpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += length;
  }
  return null;
}

const shareImage = await readFile(path.join(projectRoot, "assets/brand/bamboo-logo-og.jpg"));
const shareImageDimensions = getJpegDimensions(shareImage);
if (shareImageDimensions?.width !== 1200 || shareImageDimensions?.height !== 630) {
  throw new Error("Default share image must be a 1200x630 JPEG");
}

const robots = await readFile(path.join(projectRoot, "robots.txt"), "utf8");
const expectedRobots = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
if (robots !== expectedRobots) {
  throw new Error("robots.txt does not match the required content");
}

const sitemap = await readFile(path.join(projectRoot, "sitemap.xml"), "utf8");
if (!sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
  throw new Error("sitemap.xml is missing the standard sitemap namespace");
}
if (/<lastmod>/i.test(sitemap)) {
  throw new Error("sitemap.xml must not include lastmod");
}

const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = pages.map(({ url }) => url);
if (JSON.stringify(sitemapUrls) !== JSON.stringify(expectedUrls)) {
  throw new Error(`Unexpected sitemap URLs: ${JSON.stringify(sitemapUrls)}`);
}
if (new Set(sitemapUrls).size !== sitemapUrls.length) {
  throw new Error("sitemap.xml contains duplicate URLs");
}
for (const url of sitemapUrls) {
  if (!url.startsWith("https://www.sejongbamboo.site/")) {
    throw new Error(`Sitemap URL is outside the canonical origin: ${url}`);
  }
  if (!url.endsWith("/") || url.includes(".html")) {
    throw new Error(`Sitemap URL is not a clean trailing-slash URL: ${url}`);
  }
}

for (const page of pages) {
  const html = await readFile(path.join(projectRoot, page.file), "utf8");
  const titleMatches = [...html.matchAll(/<title>([^<]*)<\/title>/gi)];
  if (titleMatches.length !== 1 || titleMatches[0][1] !== page.title) {
    throw new Error(`${page.file} has an unexpected title`);
  }

  const canonicalLinks = [...html.matchAll(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi)];
  if (canonicalLinks.length !== 1) {
    throw new Error(`${page.file} must contain exactly one canonical link`);
  }
  const canonicalMatch = canonicalLinks[0][0].match(/href=["']([^"']+)["']/i);
  if (canonicalMatch?.[1] !== page.url) {
    throw new Error(`${page.file} canonical does not match the sitemap URL`);
  }
  if (!new RegExp(`<meta\\s+name=["']description["']`, "i").test(html)) {
    throw new Error(`${page.file} lost its meta description`);
  }
  if (/noindex/i.test(html)) {
    throw new Error(`${page.file} unexpectedly contains noindex`);
  }

  const expectedMeta = [
    ["property", "og:title", page.shareTitle],
    ["property", "og:description", page.shareDescription],
    ["property", "og:image", shareImageUrl],
    ["property", "og:image:width", "1200"],
    ["property", "og:image:height", "630"],
    ["property", "og:url", page.shareUrl],
    ["property", "og:type", "website"],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", page.shareTitle],
    ["name", "twitter:description", page.shareDescription],
    ["name", "twitter:image", shareImageUrl],
  ];
  for (const [attribute, name, expectedContent] of expectedMeta) {
    const meta = getMetaContent(html, attribute, name);
    if (meta.count !== 1 || meta.content !== expectedContent) {
      throw new Error(`${page.file} has unexpected ${name} metadata`);
    }
  }

  const body = html.split(/<body[^>]*>/i)[1] ?? "";
  if (body.includes("bamboo-logo-og.jpg")) {
    throw new Error(`${page.file} exposes the share-only logo in page content`);
  }
  if (!sitemap.includes(`<loc>${page.url}</loc>`)) {
    throw new Error(`${page.file} canonical is missing from sitemap.xml`);
  }
  const canonicalCount = (sitemap.match(new RegExp(`<loc>${escapeRegExp(page.url)}</loc>`, "g")) || [])
    .length;
  if (canonicalCount !== 1) {
    throw new Error(`${page.url} must occur exactly once in sitemap.xml`);
  }

  if (page.runtimeScript) {
    const script = await readFile(path.join(projectRoot, page.runtimeScript), "utf8");
    if (!script.includes(`document.title = "${page.title}";`)) {
      throw new Error(`${page.runtimeScript} resets the page to an unexpected title`);
    }
  }
}

console.log("SEO checks passed: robots, sitemap, canonical links, titles, share previews, descriptions, and indexability.");
