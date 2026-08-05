const STATIC_PUBLIC_ROOT = "../public";
const exhibitions = [
  {
    title: "처음",
    meta: "2025-2 Offline Exhibition",
    description: "세종대학교 사진동아리 밤부의 2025년 2학기 오프라인 사진전",
    href: "2025-2-first/",
    dataUrl: "../data/exhibitions/2025-2-offline-exhibition-first.json",
    representativeIndexes: [0, 7, 40],
  },
];

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");
const navigationLinks = navigation.querySelectorAll("a");
const exhibitionList = document.querySelector("[data-exhibition-list]");
const archiveStatus = document.querySelector("[data-archive-status]");
const exhibitionCount = document.querySelector("[data-exhibition-count]");

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
}

function assetUrl(publicUrl) {
  return `${STATIC_PUBLIC_ROOT}${publicUrl}`;
}

function createExhibitionEntry(config, data) {
  const article = document.createElement("article");
  const images = document.createElement("div");
  const copy = document.createElement("div");
  const period = document.createElement("p");
  const title = document.createElement("h3");
  const description = document.createElement("p");
  const count = document.createElement("p");
  const link = document.createElement("a");

  article.className = "exhibition-entry";
  images.className = "entry-images";
  images.setAttribute("aria-label", `${config.title} 전시 대표 작품`);
  config.representativeIndexes.forEach((index) => {
    const work = data.works[index];
    if (!work) return;
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const sourceImage = work.source?.imageFiles?.[0] ?? {};
    image.src = assetUrl(work.webAsset.publicUrl);
    image.alt = `${work.artist}의 출품작 ${work.title || "제목 없음"}`;
    image.loading = "lazy";
    image.decoding = "async";
    if (sourceImage.width) image.width = sourceImage.width;
    if (sourceImage.height) image.height = sourceImage.height;
    figure.append(image);
    images.append(figure);
  });

  copy.className = "entry-copy";
  period.className = "entry-period";
  period.textContent = config.meta;
  title.className = "entry-title";
  title.textContent = config.title;
  description.className = "entry-description";
  description.textContent = config.description;
  count.className = "entry-count";
  count.textContent = `${data.works.length} works`;
  link.className = "entry-link";
  link.href = config.href;
  link.innerHTML = "전시 보기 <span aria-hidden=\"true\">→</span>";
  copy.append(period, title, description, count, link);
  article.append(images, copy);
  return article;
}

async function loadExhibitions() {
  try {
    const loaded = await Promise.all(
      exhibitions.map(async (config) => {
        const response = await fetch(config.dataUrl);
        if (!response.ok) throw new Error(`${config.title}: HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.works)) throw new Error(`${config.title}: 작품 데이터 없음`);
        return { config, data };
      })
    );
    const fragment = document.createDocumentFragment();
    loaded.forEach(({ config, data }) => fragment.append(createExhibitionEntry(config, data)));
    exhibitionList.replaceChildren(fragment);
    exhibitionCount.textContent = `${loaded.length} exhibition${loaded.length === 1 ? "" : "s"}`;
    archiveStatus.hidden = true;
  } catch (error) {
    archiveStatus.classList.add("error");
    archiveStatus.textContent = "전시 기록을 불러오지 못했습니다. 잠시 후 다시 열어주세요.";
    console.error("Failed to load exhibitions:", error);
  }
}

menuButton.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});
navigationLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
});
window.matchMedia("(min-width: 681px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

loadExhibitions();
