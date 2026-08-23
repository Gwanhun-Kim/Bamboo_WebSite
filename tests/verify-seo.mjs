import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sitemapUrl = "https://www.sejongbamboo.site/sitemap.xml";
const pages = [
  {
    file: "index.html",
    url: "https://www.sejongbamboo.site/",
    title: "세종대학교 사진동아리 밤부(BAMBOO) | 공식 홈페이지",
  },
  {
    file: "activities/index.html",
    url: "https://www.sejongbamboo.site/activities/",
    title: "밤부 활동 | 세종대학교 사진동아리 BAMBOO",
  },
  {
    file: "exhibitions/index.html",
    url: "https://www.sejongbamboo.site/exhibitions/",
    title: "밤부 사진전 | 세종대학교 사진동아리 BAMBOO",
  },
  {
    file: "exhibitions/2026-2-attraction/index.html",
    url: "https://www.sejongbamboo.site/exhibitions/2026-2-attraction/",
    title: "끌림 | 세종대학교 사진동아리 밤부 사진전",
    runtimeScript: "exhibitions/2026-2-attraction/exhibition.js",
  },
  {
    file: "exhibitions/2025-2-first/index.html",
    url: "https://www.sejongbamboo.site/exhibitions/2025-2-first/",
    title: "처음 | 세종대학교 사진동아리 밤부 사진전",
    runtimeScript: "exhibitions/2025-2-first/exhibition.js",
  },
  {
    file: "exhibitions/2025-2-familiar-happiness/index.html",
    url: "https://www.sejongbamboo.site/exhibitions/2025-2-familiar-happiness/",
    title: "익숙한 행복 | 세종대학교 사진동아리 밤부 사진전",
    runtimeScript: "exhibitions/2025-2-familiar-happiness/exhibition.js",
  },
  {
    file: "recruitment/index.html",
    url: "https://www.sejongbamboo.site/recruitment/",
    title: "12.5기 신입부원 모집 | 세종대학교 사진동아리 밤부",
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

console.log("SEO checks passed: robots, sitemap, canonical links, titles, descriptions, and indexability.");
