const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");

const slideshowImages = Object.freeze([
  {
    src: "../assets/activity-photos/recruiting-02.jpg",
    alt: "교내 야외 부스에서 함께한 지난 밤부 모집 홍보 활동",
    caption: "지난 모집 홍보 활동 · 2026년 1학기",
  },
  {
    src: "../assets/activity-photos/department-outing-02.jpg",
    alt: "넓은 잔디밭에서 함께한 밤부 부서별 출사",
    caption: "부서별 출사 · 2026년 1학기",
  },
  {
    src: "../assets/activity-photos/weekday-outing-01.jpg",
    alt: "카메라를 들고 함께한 밤부 정기 요일별 출사",
    caption: "정기 및 요일별 출사 · 2026년 1학기",
  },
  {
    src: "../assets/activity-photos/photo-study-04.jpg",
    alt: "노트북과 태블릿으로 사진을 편집하는 밤부 사진 스터디",
    caption: "사진 스터디 · 2026년 1학기",
  },
  {
    src: "../assets/activity-photos/mt-02.jpg",
    alt: "한 공간에 모여 교류하는 밤부 MT",
    caption: "동아리 MT · 2026년 1학기",
  },
]);

const slideshow = document.querySelector("[data-recruitment-slideshow]");
const slideshowCaption = document.querySelector("[data-slideshow-caption]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const SLIDESHOW_INTERVAL = 4500;
let activeSlideIndex = 0;
let slideshowTimer = null;

function setActiveSlide(index) {
  if (!slideshow) return;

  const slides = slideshow.querySelectorAll(".recruitment-slide");
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === index);
    slide.setAttribute("aria-hidden", String(slideIndex !== index));
  });

  const activeSlide = slideshowImages[index];
  if (slideshowCaption && activeSlide) {
    slideshowCaption.textContent = activeSlide.caption;
  }
}

function stopSlideshow() {
  if (slideshowTimer !== null) {
    window.clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
}

function startSlideshow() {
  stopSlideshow();
  if (!slideshow || reducedMotion.matches || document.hidden || slideshowImages.length < 2) return;

  slideshowTimer = window.setInterval(() => {
    activeSlideIndex = (activeSlideIndex + 1) % slideshowImages.length;
    setActiveSlide(activeSlideIndex);
  }, SLIDESHOW_INTERVAL);
}

function initializeSlideshow() {
  if (!slideshow) return;

  slideshowImages.slice(1).forEach((imageData) => {
    const image = document.createElement("img");
    image.className = "recruitment-slide";
    image.src = imageData.src;
    image.alt = imageData.alt;
    image.loading = "eager";
    image.decoding = "async";
    image.setAttribute("aria-hidden", "true");
    slideshow.append(image);
  });

  setActiveSlide(0);
  startSlideshow();
}

function setMenu(open) {
  if (!menuButton || !navigation) return;

  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
}

menuButton?.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
});

const desktopQuery = window.matchMedia("(min-width: 681px)");
desktopQuery.addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopSlideshow();
  else startSlideshow();
});

reducedMotion.addEventListener("change", startSlideshow);

document.querySelectorAll(".faq-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const answerId = button.getAttribute("aria-controls");
    const answer = answerId ? document.getElementById(answerId) : null;
    if (!answer) return;

    const willOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(willOpen));
    answer.hidden = !willOpen;
  });
});

initializeSlideshow();
