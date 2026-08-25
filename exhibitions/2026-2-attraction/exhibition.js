const DATA_URL = "../../data/exhibitions/2026-2-attraction.json";
const STATIC_PUBLIC_ROOT = "../../public";
const GUESTBOOK_URL = "../../api/guestbook/";
const EXHIBITION_ID = "2026-2-attraction";
const IMAGE_VERSION = "20260825-srgb";
const SUBMIT_COOLDOWN_MS = 30_000;
const SUBMIT_TIME_KEY = `bamboo-guestbook-last-submit:${EXHIBITION_ID}`;

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");
const navigationLinks = navigation.querySelectorAll("a");
const galleryView = document.querySelector("[data-gallery-view]");
const detailView = document.querySelector("[data-detail-view]");
const footer = document.querySelector(".attraction-footer");
const exhibitionState = document.querySelector("[data-exhibition-state]");
const galleryStatus = document.querySelector("[data-gallery-status]");
const albumGrid = document.querySelector("[data-album-grid]");
const workCount = document.querySelector("[data-work-count]");
const heroState = document.querySelector("[data-hero-state]");
const coverState = document.querySelector("[data-cover-state]");
const attractionCover = document.querySelector(".attraction-cover");
const exhibitionDescription = document.querySelector("[data-exhibition-description]");
const backToGallery = document.querySelector("[data-back-to-gallery]");
const previousWork = document.querySelector("[data-previous-work]");
const nextWork = document.querySelector("[data-next-work]");

const guestbookAvailability = document.querySelector("[data-guestbook-availability]");
const guestbookForm = document.querySelector("[data-guestbook-form]");
const guestbookListWrap = document.querySelector("[data-guestbook-list-wrap]");
const guestbookList = document.querySelector("[data-guestbook-list]");
const guestbookEmpty = document.querySelector("[data-guestbook-empty]");
const messageInput = document.querySelector("#guestbook-message");
const messageCount = document.querySelector("[data-message-count]");
const formStatus = document.querySelector("[data-form-status]");

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

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
}

function assetUrl(publicUrl) {
  const separator = publicUrl.includes("?") ? "&" : "?";
  return `${STATIC_PUBLIC_ROOT}${publicUrl}${separator}v=${IMAGE_VERSION}`;
}

function displayText(value, fallback = "기록 없음") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function formatSettings(settings) {
  if (typeof settings === "string") return displayText(settings);
  if (!settings || typeof settings !== "object") return "기록 없음";
  const values = [
    settings.aperture,
    settings.shutterSpeed,
    settings.iso,
    settings.focalLength,
  ].filter((value) => typeof value === "string" && value.trim());
  return values.length ? values.join(" / ") : "기록 없음";
}

function workHash(id) {
  return `#work=${encodeURIComponent(id)}`;
}

function selectedIdFromHash() {
  if (!window.location.hash.startsWith("#work=")) return null;
  return decodeURIComponent(window.location.hash.slice(6));
}

function createWorkCard(work, index) {
  const article = document.createElement("article");
  const link = document.createElement("a");
  const imageWrap = document.createElement("div");
  const caption = document.createElement("div");
  const title = document.createElement("h3");
  const artist = document.createElement("p");
  const shownTitle = displayText(work.title, "제목 없음");
  const shownArtist = displayText(work.artist, "작가 미상");

  article.className = "attraction-work-card";
  link.href = workHash(work.id);
  link.setAttribute("aria-label", `${shownTitle}, ${shownArtist} 작품 상세 보기`);

  if (work.webAsset?.publicUrl) {
    const image = document.createElement("img");
    imageWrap.className = "attraction-work-image";
    image.src = assetUrl(work.webAsset.publicUrl);
    image.alt = `${shownArtist}의 작품 ${shownTitle}`;
    image.loading = "lazy";
    image.decoding = "async";
    if (work.webAsset.width && work.webAsset.height) {
      image.width = work.webAsset.width;
      image.height = work.webAsset.height;
    }
    image.addEventListener(
      "error",
      () => {
        imageWrap.className = "attraction-work-placeholder";
        imageWrap.textContent = `이미지 준비 중 ${String(index + 1).padStart(2, "0")}`;
      },
      { once: true }
    );
    imageWrap.append(image);
  } else {
    imageWrap.className = "attraction-work-placeholder";
    imageWrap.textContent = `이미지 준비 중 ${String(index + 1).padStart(2, "0")}`;
  }

  caption.className = "attraction-work-caption";
  title.textContent = shownTitle;
  artist.textContent = shownArtist;
  caption.append(title, artist);
  link.append(imageWrap, caption);
  article.append(link);
  return article;
}

function renderGallery(data) {
  const fragment = document.createDocumentFragment();
  works.forEach((work, index) => fragment.append(createWorkCard(work, index)));
  albumGrid.replaceChildren(fragment);
  albumGrid.hidden = false;
  exhibitionState.hidden = true;
  galleryStatus.hidden = true;
  workCount.textContent = String(works.length);
  heroState.textContent = `${works.length} works`;
  coverState.textContent = `${works.length} works`;
  attractionCover.setAttribute("aria-label", "끌림 전시 표지");
  exhibitionDescription.textContent = displayText(data.description, exhibitionDescription.textContent);
}

function showPreparingState(data) {
  works = [];
  albumGrid.replaceChildren();
  albumGrid.hidden = true;
  galleryStatus.hidden = true;
  exhibitionState.hidden = false;
  workCount.textContent = "0";
  heroState.textContent = "준비 중";
  coverState.textContent = "전시 준비 중";
  const description = displayText(data.description, exhibitionDescription.textContent);
  exhibitionDescription.textContent = description;
  exhibitionState.querySelector("p").textContent = description;
}

function showGallery({ focusHeading = false } = {}) {
  selectedIndex = -1;
  galleryView.hidden = false;
  detailView.hidden = true;
  footer.hidden = false;
  document.title = "끌림 | 세종대학교 사진동아리 밤부 사진전";
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
    if (work.webAsset.width && work.webAsset.height) {
      detailFields.image.width = work.webAsset.width;
      detailFields.image.height = work.webAsset.height;
    }
    detailFields.image.hidden = false;
    detailFields.placeholder.hidden = true;
  } else {
    detailFields.image.removeAttribute("src");
    detailFields.image.hidden = true;
    detailFields.placeholder.hidden = false;
    detailFields.placeholder.textContent = "작품 이미지 준비 중";
    detailFields.placeholder.setAttribute("aria-label", `${shownTitle} 작품 이미지 준비 중`);
  }

  detailFields.title.textContent = shownTitle;
  detailFields.artist.textContent = shownArtist;
  detailFields.statement.textContent = displayText(
    work.statement || work.description,
    "작가의 말이 기록되지 않았습니다."
  );
  detailFields.camera.textContent = displayText(work.camera);
  detailFields.settings.textContent = formatSettings(work.settings);
  detailFields.location.textContent = displayText(work.location);
  detailFields.date.textContent = displayText(work.date || work.shotDate);
  detailFields.position.textContent = `${index + 1} / ${works.length}`;
  previousWork.href = workHash(works[(index - 1 + works.length) % works.length].id);
  nextWork.href = workHash(works[(index + 1) % works.length].id);
  document.title = `${shownTitle} - ${shownArtist} | 끌림`;
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
    if (!Array.isArray(data.works)) throw new Error("작품 데이터 형식이 올바르지 않습니다.");
    if (data.works.length === 0) {
      showPreparingState(data);
      return;
    }
    works = data.works;
    renderGallery(data);
    syncViewWithHash();
  } catch (error) {
    exhibitionState.hidden = true;
    galleryStatus.hidden = false;
    galleryStatus.classList.add("error");
    galleryStatus.textContent = "작품 기록을 불러오지 못했습니다. 잠시 후 다시 열어주세요.";
    console.error("Failed to load attraction exhibition data:", error);
  }
}

function formatGuestbookDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function renderGuestbook(entries) {
  const fragment = document.createDocumentFragment();
  entries.forEach((entry) => {
    const article = document.createElement("article");
    const nickname = document.createElement("h4");
    const message = document.createElement("p");
    const time = document.createElement("time");
    article.className = "guestbook-entry";
    nickname.textContent = entry.nickname;
    message.textContent = entry.message;
    time.dateTime = entry.created_at;
    time.textContent = formatGuestbookDate(entry.created_at);
    article.append(nickname, message, time);
    fragment.append(article);
  });
  guestbookList.replaceChildren(fragment);
  guestbookEmpty.hidden = entries.length !== 0;
}

function showGuestbookUnavailable(message) {
  guestbookAvailability.classList.remove("ready");
  guestbookAvailability.textContent = message;
  guestbookForm.hidden = true;
  guestbookListWrap.hidden = true;
}

async function loadGuestbook() {
  try {
    const response = await fetch(`${GUESTBOOK_URL}?exhibitionId=${EXHIBITION_ID}`, {
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 404 || payload.enabled === false) {
      showGuestbookUnavailable("온라인 방명록 기능을 준비하고 있습니다.");
      return;
    }
    if (!response.ok || !Array.isArray(payload.entries)) {
      throw new Error(payload.message || `HTTP ${response.status}`);
    }
    guestbookAvailability.classList.add("ready");
    guestbookAvailability.textContent = "전시를 기다리는 마음과 짧은 인사를 남겨주세요.";
    guestbookForm.hidden = false;
    guestbookListWrap.hidden = false;
    renderGuestbook(payload.entries);
  } catch {
    showGuestbookUnavailable("방명록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  }
}

async function submitGuestbook(event) {
  event.preventDefault();
  const formData = new FormData(guestbookForm);
  const nickname = String(formData.get("nickname") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const submitButton = guestbookForm.querySelector('button[type="submit"]');

  if (!nickname || !message) {
    formStatus.textContent = "이름과 메시지를 모두 입력해주세요.";
    return;
  }

  const lastSubmit = Number(localStorage.getItem(SUBMIT_TIME_KEY) || 0);
  const remaining = SUBMIT_COOLDOWN_MS - (Date.now() - lastSubmit);
  if (remaining > 0) {
    formStatus.textContent = `${Math.ceil(remaining / 1000)}초 후에 다시 남길 수 있습니다.`;
    return;
  }

  submitButton.disabled = true;
  formStatus.textContent = "메시지를 남기는 중입니다.";

  try {
    const response = await fetch(GUESTBOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ exhibitionId: EXHIBITION_ID, nickname, message }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "메시지를 남기지 못했습니다.");
    localStorage.setItem(SUBMIT_TIME_KEY, String(Date.now()));
    guestbookForm.reset();
    messageCount.textContent = "0";
    formStatus.textContent = "메시지를 남겼습니다.";
    await loadGuestbook();
  } catch (error) {
    formStatus.textContent = error.message || "메시지를 남기지 못했습니다. 잠시 후 다시 시도해주세요.";
  } finally {
    submitButton.disabled = false;
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

messageInput.addEventListener("input", () => {
  messageCount.textContent = String(messageInput.value.length);
});
guestbookForm.addEventListener("submit", submitGuestbook);

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

detailFields.image.addEventListener("error", () => {
  detailFields.image.hidden = true;
  detailFields.placeholder.hidden = false;
  detailFields.placeholder.textContent = "작품 이미지를 불러오지 못했습니다.";
});

loadExhibition();
loadGuestbook();
