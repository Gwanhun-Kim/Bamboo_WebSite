import { execFile as execFileCallback } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const projectRoot = process.cwd();
const sourceRoot = process.argv[2];

if (!sourceRoot) {
  throw new Error(
    "Usage: node scripts/prepare-attraction-exhibition.mjs <source exhibition directory>"
  );
}

const photoDirectory = path.join(sourceRoot, "사진");
const textDirectory = path.join(sourceRoot, "사진 설명");
const outputDirectory = path.join(
  projectRoot,
  "public/exhibitions/2026-2-attraction/images"
);
const outputDataPath = path.join(
  projectRoot,
  "data/exhibitions/2026-2-attraction.json"
);
const collator = new Intl.Collator("ko-KR");

const sectionPatterns = {
  title:
    /^[ \t]*(?:\d*[ \t]*\)[ \t]*)?(?:(?:사진|진)[ \t]*)?제목[ \t]*[:：]?[ \t]*/im,
  statement:
    /^[ \t]*(?:\d*[ \t]*\)[ \t]*)?(?:작가의[ \t]*말(?:[ \t]*\([^\r\n)]*\))?|사진[ \t]*설명)[ \t]*[:：]?[ \t]*/im,
  camera:
    /^[ \t]*(?:\d*[ \t]*\)[ \t]*)?(?:사용한[ \t]*카메라[ \t]*기종|사용[ \t]*기종)[ \t]*[:：]?[ \t]*/im,
  settings:
    /^[ \t]*(?:\d*[ \t]*\)[ \t]*)?(?:구체적인[ \t]*촬영값(?:[ \t]*\([^\r\n)]*\))?|촬영값|F값[ \t]*\(조리개\))[ \t]*[:：]?[ \t]*/im,
  date:
    /^[ \t]*(?:\d*[ \t]*\)[ \t]*)?(?:사진[ \t]*촬영[ \t]*시각(?:[ \t]*\([^\r\n)]*\))?|촬영[ \t]*일자)[ \t]*[:：]?[ \t]*/im,
};

function normalizeSourceText(value) {
  return value
    .normalize("NFC")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B\u200C\u200D\u2060]/g, "")
    .replace(/\u00A0/g, " ");
}

function compactSection(value, { singleLine = false } = {}) {
  const cleanedLines = value
    .replace(/^[ \t]*[:：][ \t]*/, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        !/^→?[ \t]*만약[ \t]*수치[ \t]*모른다면[ \t]*X[ \t]*적어주세요/i.test(line) &&
        !/^\d+[ \t]*\)[ \t]*사진(?:[ \t]|$)/i.test(line) &&
        !/^→?[ \t]*파일[ \t]*이름은/i.test(line)
    );

  const compacted = [];
  for (const line of cleanedLines) {
    if (!line && (!compacted.length || compacted.at(-1) === "")) continue;
    compacted.push(line);
  }
  while (compacted.at(-1) === "") compacted.pop();

  if (singleLine) return compacted.filter(Boolean).join(" ").trim();
  return compacted.join("\n").trim();
}

function extractSections(rawText) {
  const text = normalizeSourceText(rawText);
  const markers = Object.entries(sectionPatterns)
    .map(([name, pattern]) => {
      const match = pattern.exec(text);
      return match
        ? { name, start: match.index, end: match.index + match[0].length }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.start - right.start);

  const sections = {};
  markers.forEach((marker, index) => {
    const next = markers[index + 1];
    sections[marker.name] = compactSection(text.slice(marker.end, next?.start ?? text.length));
  });

  return {
    text,
    sections,
    markers,
    foundMarkers: new Set(markers.map((marker) => marker.name)),
  };
}

function fallbackTitle(text, artist, markers) {
  const firstMarkerStart = markers[0]?.start ?? text.length;
  const prefixLines = compactSection(text.slice(0, firstMarkerStart))
    .split("\n")
    .filter(Boolean);
  if (prefixLines[0]?.normalize("NFC") === artist) prefixLines.shift();
  return prefixLines.join(" ").trim();
}

function splitImplicitStatement(titleBlock) {
  const lines = titleBlock.split("\n").filter(Boolean);
  return {
    title: lines.shift() || "",
    statement: lines.join("\n").trim(),
  };
}

function extractImplicitCamera(statement) {
  const lines = statement.split("\n");
  const lastLine = lines.at(-1)?.trim() || "";
  const cameraPattern =
    /(?:canon|sony|nikon|fujifilm|fuji|olympus|pentax|samsung|galaxy|iphone|lumix|leica|캐논|소니|니콘|후지|올림푸스|펜탁스|삼성|갤럭시|아이폰)/i;
  if (!cameraPattern.test(lastLine)) return { statement, camera: "" };
  lines.pop();
  return { statement: lines.join("\n").trim(), camera: lastLine };
}

function normalizeMissingValue(value) {
  const normalized = value.trim().replace(/^→[ \t]*/, "");
  return /^(?:x|×|없음|모름)$/i.test(normalized) ? "" : normalized;
}

function romanizeHangul(value) {
  const initials = [
    "g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h",
  ];
  const vowels = [
    "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i",
  ];
  const finals = [
    "", "k", "k", "ks", "n", "nj", "nh", "t", "l", "lk", "lm", "lp", "ls", "lt", "lp", "lh", "m", "p", "ps", "t", "t", "ng", "t", "t", "k", "t", "p", "h",
  ];
  const syllables = [];

  for (const character of value.normalize("NFC")) {
    const code = character.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const initial = Math.floor(offset / 588);
      const vowel = Math.floor((offset % 588) / 28);
      const final = offset % 28;
      syllables.push(`${initials[initial]}${vowels[vowel]}${finals[final]}`);
    } else if (/^[A-Za-z0-9]$/.test(character)) {
      syllables.push(character.toLowerCase());
    } else {
      syllables.push("");
    }
  }

  return syllables.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "artist";
}

async function imageDimensions(filePath) {
  const { stdout } = await execFile("sips", [
    "-g",
    "pixelWidth",
    "-g",
    "pixelHeight",
    filePath,
  ]);
  const width = Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!width || !height) throw new Error(`Could not read image dimensions: ${filePath}`);
  return { width, height };
}

async function createWebImage(sourcePath, outputPath, sourceDimensions) {
  if (Math.max(sourceDimensions.width, sourceDimensions.height) <= 2400) {
    await copyFile(sourcePath, outputPath);
  } else {
    await execFile("sips", [
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      "88",
      "-Z",
      "2400",
      sourcePath,
      "--out",
      outputPath,
    ]);
  }
  return imageDimensions(outputPath);
}

const photoFiles = (await readdir(photoDirectory))
  .filter((fileName) => fileName !== ".DS_Store" && /\.jpe?g$/i.test(fileName))
  .map((fileName) => ({ fileName, artist: path.parse(fileName).name.normalize("NFC") }));
const textFiles = (await readdir(textDirectory))
  .filter((fileName) => fileName !== ".DS_Store" && /\.txt$/i.test(fileName))
  .map((fileName) => ({ fileName, artist: path.parse(fileName).name.normalize("NFC") }));

const photoByArtist = new Map(photoFiles.map((entry) => [entry.artist, entry]));
const textByArtist = new Map(textFiles.map((entry) => [entry.artist, entry]));
const artists = [...new Set([...photoByArtist.keys(), ...textByArtist.keys()])].sort(collator.compare);
const unmatched = artists.filter(
  (artist) => !photoByArtist.has(artist) || !textByArtist.has(artist)
);

if (photoFiles.length !== textFiles.length || unmatched.length) {
  throw new Error(
    `Photo/TXT pairing failed: ${photoFiles.length} photos, ${textFiles.length} texts, unmatched: ${unmatched.join(", ")}`
  );
}

await mkdir(outputDirectory, { recursive: true });
const works = [];
const review = [];

for (const [index, artist] of artists.entries()) {
  const number = String(index + 1).padStart(2, "0");
  const photo = photoByArtist.get(artist);
  const textFile = textByArtist.get(artist);
  const sourcePhotoPath = path.join(photoDirectory, photo.fileName);
  const sourceTextPath = path.join(textDirectory, textFile.fileName);
  const sourceText = await readFile(sourceTextPath, "utf8");
  const { text, sections, markers, foundMarkers } = extractSections(sourceText);
  let title = sections.title || fallbackTitle(text, artist, markers);
  let statement = sections.statement || "";
  if (foundMarkers.has("title") && !foundMarkers.has("statement")) {
    const implicit = splitImplicitStatement(title);
    title = implicit.title;
    statement = implicit.statement;
  } else {
    title = title.split("\n").filter(Boolean).join(" ").trim();
  }
  title ||= "무제";
  let camera = normalizeMissingValue(sections.camera || "");
  if (statement && !camera && !foundMarkers.has("camera")) {
    const implicit = extractImplicitCamera(statement);
    statement = implicit.statement;
    camera = implicit.camera;
  }
  const settings = normalizeMissingValue(sections.settings || "");
  const shotDate = normalizeMissingValue(sections.date || "").replace(/^\(|\)$/g, "");
  const slug = romanizeHangul(artist);
  const fileName = `${number}-${slug}.jpg`;
  const publicUrl = `/exhibitions/2026-2-attraction/images/${fileName}`;
  const outputPath = path.join(outputDirectory, fileName);
  const sourceDimensions = await imageDimensions(sourcePhotoPath);
  const outputDimensions = await createWebImage(
    sourcePhotoPath,
    outputPath,
    sourceDimensions
  );
  const outputStat = await stat(outputPath);
  const notes = [];

  if (title === "무제") notes.push("작품 제목 확인 필요");
  if (!statement) notes.push("작가의 말 없음");
  if (!camera) notes.push("카메라 정보 없음");
  if (!settings) notes.push("촬영값 없음");
  if (!shotDate) notes.push("촬영일 없음");
  if (notes.length) review.push({ artist, title, notes });

  works.push({
    id: `attraction-2026-2-${number}-${slug}`,
    title,
    artist,
    image: publicUrl,
    description: statement,
    statement,
    camera,
    metadata: settings,
    settings,
    location: "",
    date: shotDate,
    shotDate,
    source: {
      textFile: textFile.fileName.normalize("NFC"),
      imageFiles: [
        {
          fileName: photo.fileName.normalize("NFC"),
          width: sourceDimensions.width,
          height: sourceDimensions.height,
        },
      ],
    },
    webAsset: {
      status: "ready",
      fileName,
      path: `public/exhibitions/2026-2-attraction/images/${fileName}`,
      publicUrl,
      extension: ".jpg",
      width: outputDimensions.width,
      height: outputDimensions.height,
      fileSizeBytes: outputStat.size,
    },
    notes,
    needsReview: title === "무제",
  });
}

const exhibition = {
  id: "2026-2-attraction",
  title: "끌림",
  displayTitle: "열아홉번째 사진전 <끌림>",
  year: 2026,
  semester: "2026-2",
  period: "2026년 2학기",
  type: "offline-exhibition",
  status: "published",
  description:
    "세종대학교 사진동아리 밤부의 열아홉번째 사진전 <끌림>에 출품된 작품 기록입니다.",
  cover: {
    publicUrl: works[0].webAsset.publicUrl,
    workId: works[0].id,
  },
  works,
};

await writeFile(outputDataPath, `${JSON.stringify(exhibition, null, 2)}\n`, "utf8");

const totalOutputBytes = works.reduce(
  (total, work) => total + work.webAsset.fileSizeBytes,
  0
);
console.log(
  JSON.stringify(
    {
      photos: photoFiles.length,
      texts: textFiles.length,
      works: works.length,
      outputMegabytes: Number((totalOutputBytes / 1024 / 1024).toFixed(2)),
      needsReview: review,
    },
    null,
    2
  )
);
