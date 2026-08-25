const DATA_URL = "../../data/exhibitions/2025-2-offline-exhibition-first.json";
const STATIC_PUBLIC_ROOT = "../../public";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");
const navigationLinks = navigation.querySelectorAll("a");
const galleryView = document.querySelector("[data-gallery-view]");
const detailView = document.querySelector("[data-detail-view]");
const footer = document.querySelector(".exhibition-footer");
const albumGrid = document.querySelector("[data-album-grid]");
const galleryStatus = document.querySelector("[data-gallery-status]");
const workCount = document.querySelector("[data-work-count]");
const heroWorkCount = document.querySelector("[data-hero-work-count]");
const backToGallery = document.querySelector("[data-back-to-gallery]");
const previousWork = document.querySelector("[data-previous-work]");
const nextWork = document.querySelector("[data-next-work]");

let works = [];
let selectedIndex = -1;
let lastGridWidth = 0;

const detailFields = {
  image: document.querySelector("[data-detail-image]"),
  title: document.querySelector("[data-detail-title]"),
  artist: document.querySelector("[data-detail-artist]"),
  statement: document.querySelector("[data-detail-statement]"),
  camera: document.querySelector("[data-detail-camera]"),
  settings: document.querySelector("[data-detail-settings]"),
  date: document.querySelector("[data-detail-date]"),
  position: document.querySelector("[data-detail-position]"),
};

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
}

function assetUrl(publicUrl) {
  return `${STATIC_PUBLIC_ROOT}${publicUrl}`;
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

function createWorkCard(work) {
  const article = document.createElement("article");
  const link = document.createElement("a");
  const imageWrap = document.createElement("div");
  const image = document.createElement("img");
  const caption = document.createElement("div");
  const title = document.createElement("h3");
  const artist = document.createElement("p");
  const sourceImage = work.source?.imageFiles?.[0] ?? {};
  const shownTitle = displayText(work.title, "제목 없음");

  article.className = "work-card";
  link.href = workHash(work.id);
  link.setAttribute("aria-label", `${shownTitle}, ${work.artist} 작품 상세 보기`);
  imageWrap.className = "work-image";
  image.addEventListener(
    "load",
    () => {
      // EXIF rotation can make the browser's natural dimensions differ from
      // the metadata stored in the exhibition JSON. Use the decoded size so
      // the intrinsic ratio and masonry span stay in sync.
      image.width = image.naturalWidth;
      image.height = image.naturalHeight;
      resizeMasonryItem(article);
      requestAnimationFrame(() => resizeMasonryItem(article));
    },
    { once: true }
  );
  image.src = assetUrl(work.webAsset.publicUrl);
  image.alt = `${work.artist}의 작품 ${shownTitle}`;
  image.loading = "lazy";
  image.decoding = "async";
  if (sourceImage.width) image.width = sourceImage.width;
  if (sourceImage.height) image.height = sourceImage.height;
  caption.className = "work-caption";
  title.textContent = shownTitle;
  artist.textContent = work.artist;

  imageWrap.append(image);
  caption.append(title, artist);
  link.append(imageWrap, caption);
  article.append(link);
  masonryContentResizeObserver.observe(link);
  return article;
}

function resizeMasonryItem(card) {
  const rowHeight = Number.parseFloat(getComputedStyle(albumGrid).gridAutoRows);
  if (!rowHeight) return;
  const cardStyle = getComputedStyle(card);
  const contentHeight = card.querySelector("a").getBoundingClientRect().height;
  const span = Math.ceil(
    (contentHeight + Number.parseFloat(cardStyle.paddingBottom)) / rowHeight
  );
  card.style.gridRowEnd = `span ${span}`;
}

function resizeMasonryItems() {
  albumGrid.querySelectorAll(".work-card").forEach(resizeMasonryItem);
}

const masonryContentResizeObserver = new ResizeObserver((entries) => {
  entries.forEach(({ target }) => {
    const card = target.closest(".work-card");
    if (card) resizeMasonryItem(card);
  });
});

function renderGallery() {
  const fragment = document.createDocumentFragment();
  works.forEach((work) => fragment.append(createWorkCard(work)));
  albumGrid.replaceChildren(fragment);
  workCount.textContent = String(works.length);
  heroWorkCount.textContent = String(works.length);
  galleryStatus.hidden = true;
  requestAnimationFrame(resizeMasonryItems);
}

function showGallery({ focusHeading = false } = {}) {
  selectedIndex = -1;
  galleryView.hidden = false;
  detailView.hidden = true;
  footer.hidden = false;
  document.title = "처음 | 세종대학교 사진동아리 밤부 사진전";
  if (focusHeading) {
    document.querySelector("#album-title").setAttribute("tabindex", "-1");
    document.querySelector("#album-title").focus({ preventScroll: true });
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
  const sourceImage = work.source?.imageFiles?.[0] ?? {};
  selectedIndex = index;
  galleryView.hidden = true;
  detailView.hidden = false;
  footer.hidden = true;

  detailFields.image.src = assetUrl(work.webAsset.publicUrl);
  detailFields.image.alt = `${work.artist}의 작품 ${shownTitle}`;
  if (sourceImage.width) detailFields.image.width = sourceImage.width;
  if (sourceImage.height) detailFields.image.height = sourceImage.height;
  detailFields.title.textContent = shownTitle;
  detailFields.artist.textContent = work.artist;
  detailFields.statement.textContent = displayText(
    work.statement,
    "작가의 말이 기록되지 않았습니다."
  );
  detailFields.camera.textContent = displayText(work.camera);
  detailFields.settings.textContent = displayText(work.settings);
  detailFields.date.textContent = displayText(work.shotDate);
  detailFields.position.textContent = `${index + 1} / ${works.length}`;
  previousWork.href = workHash(works[(index - 1 + works.length) % works.length].id);
  nextWork.href = workHash(works[(index + 1) % works.length].id);
  document.title = `${shownTitle} - ${work.artist} | 처음`;
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
    galleryStatus.innerHTML = "<strong>작품 기록을 불러오지 못했습니다.</strong><span>잠시 후 페이지를 다시 열어주세요.</span>";
    console.error("Failed to load exhibition data:", error);
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
const galleryResizeObserver = new ResizeObserver(([entry]) => {
  const width = entry.contentRect.width;
  if (Math.abs(width - lastGridWidth) < 1) return;
  lastGridWidth = width;
  resizeMasonryItems();
});
galleryResizeObserver.observe(albumGrid);

loadExhibition();
