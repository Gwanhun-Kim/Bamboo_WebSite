const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");
const navigationLinks = navigation.querySelectorAll("a");

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
}

menuButton.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
    menuButton.focus();
  }
});

const desktopQuery = window.matchMedia("(min-width: 681px)");
desktopQuery.addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

const heroSlides = Object.freeze([
  { src: "assets/activity-photos/photo-contest-01.jpg", alt: "밤부 사진 콘테스트 공동 우승작, 벚꽃 사이에 앉은 새" },
  { src: "public/exhibitions/2025-2-first/images/thumbnails/12-yubin-kim-800.webp", alt: "밤부 열여덟번째 사진전 처음 출품작, 연못 위 정자" },
  { src: "assets/activity-photos/department-outing-01.jpg", alt: "카메라와 삼각대를 들고 부서별 출사에 참여한 밤부 부원들" },
  { src: "assets/activity-photos/weekday-outing-01.jpg", alt: "카메라를 들고 정기·요일별 출사에 참여한 밤부 부원들" },
  { src: "assets/activity-photos/photo-contest-02.jpg", alt: "밤부 사진 콘테스트 공동 우승작, 수면을 헤엄치는 비단잉어" },
  { src: "public/exhibitions/2025-2-familiar-happiness/images/thumbnails/03-강신혁-한강에서-바라보는-노을-800.webp", alt: "밤부 열일곱번째 사진전 익숙한 행복 출품작, 한강 철교 너머의 노을" },
  { src: "public/exhibitions/2025-2-first/images/thumbnails/01-nayeon-kang-800.webp", alt: "밤부 열여덟번째 사진전 처음 출품작, 햇살이 드는 실내 정원" },
  { src: "assets/activity-photos/joint-outing-01.jpg", alt: "카메라를 들고 연합 출사에 함께한 사진동아리 부원들" },
  { src: "assets/activity-photos/department-outing-02.jpg", alt: "공원에서 함께한 밤부 부서별 출사" },
  { src: "assets/activity-photos/weekday-outing-02.jpg", alt: "장미 정원에서 함께한 밤부 정기·요일별 출사" },
  { src: "assets/activity-photos/joint-outing-02.jpg", alt: "꽃밭에서 촬영한 연합 출사 단체 사진" },
  { src: "public/exhibitions/2025-2-familiar-happiness/images/thumbnails/08-김관훈-비눗방울-800.webp", alt: "밤부 열일곱번째 사진전 익숙한 행복 출품작, 공원에서 비눗방울을 만드는 풍경" },
]);

const heroSlideSlots = [...document.querySelectorAll("[data-hero-slide]")];
const reduceHeroMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const HERO_SLIDE_INTERVAL = 3800;
const HERO_SLIDE_DURATION = 850;
let heroSlideTimer = null;
let nextHeroSlot = 0;
let nextHeroImage = heroSlideSlots.length;

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = src;
  });
}

async function advanceHeroSlide() {
  if (document.hidden || reduceHeroMotion.matches || heroSlideSlots.length === 0) return;

  const slot = heroSlideSlots[nextHeroSlot];
  const slide = heroSlides[nextHeroImage];
  const layers = [...slot.querySelectorAll(".hero-slide")];
  const activeLayer = layers.find((layer) => layer.classList.contains("is-active"));
  const nextLayer = layers.find((layer) => layer !== activeLayer);

  try {
    await preloadImage(slide.src);
  } catch {
    nextHeroImage = (nextHeroImage + 1) % heroSlides.length;
    return;
  }

  nextLayer.src = slide.src;
  nextLayer.alt = slide.alt;
  nextLayer.setAttribute("aria-hidden", "false");
  activeLayer.setAttribute("aria-hidden", "true");

  requestAnimationFrame(() => {
    activeLayer.classList.add("is-leaving");
    nextLayer.classList.add("is-active");
    activeLayer.classList.remove("is-active");
  });

  window.setTimeout(() => {
    activeLayer.classList.add("is-resetting");
    activeLayer.classList.remove("is-leaving");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => activeLayer.classList.remove("is-resetting"));
    });
  }, HERO_SLIDE_DURATION);

  nextHeroSlot = (nextHeroSlot + 1) % heroSlideSlots.length;
  nextHeroImage = (nextHeroImage + 1) % heroSlides.length;
}

function stopHeroSlideshow() {
  window.clearInterval(heroSlideTimer);
  heroSlideTimer = null;
}

function startHeroSlideshow() {
  stopHeroSlideshow();
  if (!reduceHeroMotion.matches && heroSlideSlots.length > 0) {
    heroSlideTimer = window.setInterval(advanceHeroSlide, HERO_SLIDE_INTERVAL);
  }
}

if (heroSlideSlots.length > 0) {
  heroSlideSlots.forEach((slot) => {
    const fallback = slot.querySelector(".hero-slide");
    fallback.setAttribute("aria-hidden", "false");

    const alternate = document.createElement("img");
    alternate.className = "hero-slide";
    alternate.src = fallback.currentSrc || fallback.src;
    alternate.alt = "";
    alternate.setAttribute("aria-hidden", "true");
    alternate.decoding = "async";
    slot.append(alternate);
  });

  startHeroSlideshow();
  reduceHeroMotion.addEventListener("change", startHeroSlideshow);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopHeroSlideshow();
    else startHeroSlideshow();
  });
}
