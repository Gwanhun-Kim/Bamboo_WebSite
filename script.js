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
  { src: "assets/activity-photos/opening-meeting-01.jpg", alt: "2026년 1학기 밤부 개강총회 단체 사진" },
  { src: "assets/activity-photos/photo-study-02.jpg", alt: "세종대학교 교정에서 진행한 밤부 사진 스터디 촬영 실습" },
  { src: "assets/activity-photos/small-groups-02.jpg", alt: "함께 식사하며 관심사를 나누는 밤부 소모임 활동" },
  { src: "assets/activity-photos/closing-meeting-01.jpg", alt: "2026년 1학기 밤부 종강총회" },
  { src: "assets/activity-photos/mt-02.jpg", alt: "함께 교류하는 2026년 1학기 밤부 MT" },
  { src: "assets/activity-photos/snack-events-01.jpg", alt: "동아리방에서 함께한 밤부 간식 행사" },
  { src: "assets/activity-photos/department-outing-01.jpg", alt: "부서별 출사에 참여한 밤부 부원들" },
  { src: "assets/activity-photos/department-outing-02.jpg", alt: "공원에서 함께한 밤부 부서별 출사" },
  { src: "assets/activity-photos/weekday-outing-01.jpg", alt: "정기·요일별 출사에 참여한 밤부 부원들" },
  { src: "assets/activity-photos/weekday-outing-02.jpg", alt: "장미 정원에서 함께한 밤부 정기·요일별 출사" },
  { src: "assets/activity-photos/joint-outing-01.jpg", alt: "연합 출사에 함께한 사진동아리 부원들" },
  { src: "assets/activity-photos/joint-outing-02.jpg", alt: "꽃밭에서 촬영한 연합 출사 단체 사진" },
  { src: "assets/activity-photos/photo-study-01.jpg", alt: "카메라 화면을 함께 살펴보는 밤부 사진 스터디" },
  { src: "assets/activity-photos/photo-study-03.jpg", alt: "동아리방에서 카메라 사용법을 나누는 밤부 사진 스터디" },
  { src: "assets/activity-photos/photo-study-04.jpg", alt: "사진 편집 경험을 나누는 밤부 사진 스터디" },
  { src: "assets/activity-photos/small-groups-01.jpg", alt: "필름 카메라를 주제로 모인 밤부 소모임" },
  { src: "assets/activity-photos/small-groups-03.jpg", alt: "보드게임을 함께 즐기는 밤부 소모임" },
  { src: "assets/activity-photos/small-groups-04.jpg", alt: "거울 앞에서 함께 촬영한 밤부 소모임" },
  { src: "assets/activity-photos/mt-01.jpg", alt: "조명 아래에서 함께한 2026년 1학기 밤부 MT" },
  { src: "assets/activity-photos/recruiting-02.jpg", alt: "교내 야외 부스에서 진행한 밤부 모집 홍보 활동" },
]);

const heroSlideSlots = [...document.querySelectorAll("[data-hero-slide]")];
const reduceHeroMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const HERO_SLIDE_INTERVAL = 3800;
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
    nextLayer.classList.add("is-active");
    activeLayer.classList.remove("is-active");
  });

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
