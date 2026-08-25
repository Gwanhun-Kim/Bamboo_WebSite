const DATA_URL = "../../data/exhibitions/2025-2-familiar-happiness.json";
const STATIC_PUBLIC_ROOT = "../../public";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");
const navigationLinks = navigation.querySelectorAll("a");
const galleryView = document.querySelector("[data-gallery-view]");
const detailView = document.querySelector("[data-detail-view]");
const footer = document.querySelector(".familiar-footer");
const albumGrid = document.querySelector("[data-album-grid]");
const galleryStatus = document.querySelector("[data-gallery-status]");
const workCount = document.querySelector("[data-work-count]");
const heroWorkCount = document.querySelector("[data-hero-work-count]");
const backToGallery = document.querySelector("[data-back-to-gallery]");
const previousWork = document.querySelector("[data-previous-work]");
const nextWork = document.querySelector("[data-next-work]");

let works = [];
let selectedIndex = -1;

const detailFields = {
  image: document.querySelector("[data-detail-image]"),
  placeholder: document.querySelector("[data-detail-placeholder]"),
  title: document.querySelector("[data-detail-title]"),
  artist: document.querySelector("[data-detail-artist]"),
  statement: document.querySelector("[data-detail-statement]"),
  camera: document.querySelector("[data-detail-camera]"),
  settings: document.querySelector("[data-detail-settings]"),
  location: document.querySelector("[data-detail-location]"),
  date: document.querySelector("[data-detail-date]"),
  position: document.querySelector("[data-detail-position]"),
};

function assetUrl(publicUrl) {
  return `${STATIC_PUBLIC_ROOT}${publicUrl}`;
}

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
}

function displayText(value, fallback = "기록 없음") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function workHash(id) {
  return `#work=${encodeURIComponent(id)}`;
}

function selectedIdFromHash() {
  if (!window.location.hash.startsWith("#work=")) return null;
  return decodeURIComponent(window.location.hash.slice(6));
}

function formatSettings(settings) {
  if (!settings || typeof settings !== "object") return "기록 없음";
  const values = [
    settings.aperture,
    settings.shutterSpeed,
    settings.iso,
    settings.focalLength,
  ].filter((value) => typeof value === "string" && value.trim());
  return values.length ? values.join(" / ") : "기록 없음";
}

function createWorkCard(work, index) {
  const article = document.createElement("article");
  const link = document.createElement("a");
  const imageWrap = document.createElement("div");
  const caption = document.createElement("div");
  const title = document.createElement("h3");
  const artist = document.createElement("p");
  const shownTitle = displayText(work.title, "제목 없음");

  article.className = "familiar-work-card";
  link.href = workHash(work.id);
  link.setAttribute("aria-label", `${shownTitle}, ${work.artist} 작품 상세 보기`);
  imageWrap.className = "familiar-work-image";
  if (work.webAsset?.publicUrl) {
    const image = document.createElement("img");
    image.src = assetUrl(work.webAsset.publicUrl);
    image.alt = `${work.artist}의 작품 ${shownTitle}`;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener(
      "error",
      () => {
        imageWrap.className = "familiar-work-placeholder";
        imageWrap.setAttribute("role", "img");
        imageWrap.setAttribute("aria-label", `${shownTitle} 작품 이미지 준비 중`);
        imageWrap.textContent = `이미지 준비 중  ${String(index + 1).padStart(2, "0")}`;
      },
      { once: true }
    );
    imageWrap.append(image);
  } else {
    imageWrap.className = "familiar-work-placeholder";
    imageWrap.setAttribute("role", "img");
    imageWrap.setAttribute("aria-label", `${shownTitle} 작품 이미지 준비 중`);
    imageWrap.textContent = `이미지 준비 중  ${String(index + 1).padStart(2, "0")}`;
  }
  caption.className = "familiar-work-caption";
  title.textContent = shownTitle;
  artist.textContent = displayText(work.artist, "작가 미상");

  caption.append(title, artist);
  link.append(imageWrap, caption);
  article.append(link);
  return article;
}

function renderGallery() {
  const fragment = document.createDocumentFragment();
  works.forEach((work, index) => fragment.append(createWorkCard(work, index)));
  albumGrid.replaceChildren(fragment);
  workCount.textContent = String(works.length);
  heroWorkCount.textContent = String(works.length);
  galleryStatus.hidden = true;
}

function showGallery({ focusHeading = false } = {}) {
  selectedIndex = -1;
  galleryView.hidden = false;
  detailView.hidden = true;
  footer.hidden = false;
  document.title = "익숙한 행복 | 세종대학교 사진동아리 밤부 사진전";
  if (focusHeading) {
    const heading = document.querySelector("#album-title");
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

function showDetail(index) {
  const work = works[index];
  if (!work) {
    window.history.replaceState(null, "", "#gallery");
    showGallery();
    return;
  }

  const shownTitle = displayText(work.title, "제목 없음");
  const shownArtist = displayText(work.artist, "작가 미상");
  selectedIndex = index;
  galleryView.hidden = true;
  detailView.hidden = false;
  footer.hidden = true;

  if (work.webAsset?.publicUrl) {
    detailFields.image.src = assetUrl(work.webAsset.publicUrl);
    detailFields.image.alt = `${shownArtist}의 작품 ${shownTitle}`;
    detailFields.image.hidden = false;
    detailFields.placeholder.hidden = true;
  } else {
    detailFields.image.removeAttribute("src");
    detailFields.image.alt = "";
    detailFields.image.hidden = true;
    detailFields.placeholder.hidden = false;
    detailFields.placeholder.textContent = `웹 이미지 준비 중\n${String(index + 1).padStart(2, "0")} / ${works.length}`;
    detailFields.placeholder.setAttribute(
      "aria-label",
      `${shownArtist}의 작품 ${shownTitle} 이미지 준비 중`
    );
  }
  detailFields.title.textContent = shownTitle;
  detailFields.artist.textContent = shownArtist;
  detailFields.statement.textContent = displayText(
    work.statement,
    "작가의 말이 기록되지 않았습니다."
  );
  detailFields.camera.textContent = displayText(work.camera);
  detailFields.settings.textContent = formatSettings(work.settings);
  detailFields.location.textContent = displayText(work.location);
  detailFields.date.textContent = displayText(work.date);
  detailFields.position.textContent = `${index + 1} / ${works.length}`;
  previousWork.href = workHash(works[(index - 1 + works.length) % works.length].id);
  nextWork.href = workHash(works[(index + 1) % works.length].id);
  document.title = `${shownTitle} - ${shownArtist} | 익숙한 행복`;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function syncViewWithHash() {
  if (!works.length) return;
  const selectedId = selectedIdFromHash();
  if (!selectedId) {
    showGallery();
    return;
  }
  showDetail(works.findIndex((work) => work.id === selectedId));
}

function returnToGallery() {
  window.history.replaceState(null, "", "#gallery");
  showGallery({ focusHeading: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

async function loadExhibition() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.works) || data.works.length === 0) {
      throw new Error("작품 데이터가 비어 있습니다.");
    }
    works = data.works;
    renderGallery();
    syncViewWithHash();
  } catch (error) {
    galleryStatus.classList.add("error");
    galleryStatus.innerHTML =
      "<strong>작품 기록을 불러오지 못했습니다.</strong><span>잠시 후 페이지를 다시 열어주세요.</span>";
    console.error("Failed to load familiar happiness exhibition data:", error);
  }
}

menuButton.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

navigationLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));
backToGallery.addEventListener("click", (event) => {
  event.preventDefault();
  returnToGallery();
});

window.addEventListener("hashchange", syncViewWithHash);
window.addEventListener("keydown", (event) => {
  const menuIsOpen = menuButton.getAttribute("aria-expanded") === "true";
  if (event.key === "Escape" && menuIsOpen) {
    setMenu(false);
    menuButton.focus();
    return;
  }
  if (detailView.hidden) return;
  if (event.key === "Escape") returnToGallery();
  if (event.key === "ArrowLeft") window.location.hash = previousWork.hash;
  if (event.key === "ArrowRight") window.location.hash = nextWork.hash;
});

window.matchMedia("(min-width: 681px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

loadExhibition();

detailFields.image.addEventListener("error", () => {
  detailFields.image.hidden = true;
  detailFields.placeholder.hidden = false;
  detailFields.placeholder.textContent = "작품 이미지를 불러오지 못했습니다.";
  detailFields.placeholder.setAttribute("aria-label", "작품 이미지를 불러오지 못했습니다.");
});
