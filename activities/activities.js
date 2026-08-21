const imagePath = (filename) => `../assets/activity-photos/${filename}`;

const activitiesData = Object.freeze([
  {
    id: "recruiting",
    title: "신입부원 모집",
    period: "2026.03",
    description: "교내 행사와 공식 채널에서 밤부의 활동을 소개하고 새로운 부원을 만납니다.",
    coverImage: imagePath("recruiting-02.jpg"),
    images: [
      { src: imagePath("recruiting-01.jpg"), alt: "교내 부스에서 밤부 배너와 함께 진행한 지난 모집 홍보 활동" },
      { src: imagePath("recruiting-02.jpg"), alt: "교내 야외 부스에서 함께한 지난 밤부 모집 홍보 활동" },
    ],
  },
  {
    id: "opening-meeting",
    title: "개강총회",
    period: "2026.03",
    description: "새 학기의 활동 방향을 나누고 처음 만난 부원들과 인사를 나눕니다.",
    coverImage: imagePath("opening-meeting-01.jpg"),
    images: [
      { src: imagePath("opening-meeting-01.jpg"), alt: "2026년 1학기 밤부 개강총회 단체 사진" },
    ],
  },
  {
    id: "exhibition-first",
    title: "사진전 ‘처음’",
    period: "2026.03.19 - 03.23",
    description: "한 학기의 시선을 모아 온라인과 오프라인 사진전으로 선보입니다.",
    coverImage: imagePath("exhibition-first-01.jpg"),
    images: [
      { src: imagePath("exhibition-first-01.jpg"), alt: "사진전 처음을 함께 마친 밤부 부원들" },
      { src: imagePath("exhibition-first-02.jpg"), alt: "사진전 처음 전시장 풍경" },
      { src: imagePath("exhibition-first-03.jpg"), alt: "사진전 처음 포스터" },
    ],
  },
  {
    id: "department-outing",
    title: "부서별 출사",
    period: "2026.03 - 04",
    description: "부서별로 장소와 주제를 정해 더 작은 단위로 함께 촬영합니다.",
    coverImage: imagePath("department-outing-01.jpg"),
    images: [
      { src: imagePath("department-outing-01.jpg"), alt: "부서별 출사에 참여한 밤부 부원들" },
      { src: imagePath("department-outing-02.jpg"), alt: "공원에서 함께한 부서별 출사" },
    ],
  },
  {
    id: "weekday-outing",
    title: "정기·요일별 출사",
    period: "2026.04 - 05",
    description: "가능한 요일이 같은 부원들이 가까운 장소를 찾아 함께 촬영합니다.",
    coverImage: imagePath("weekday-outing-01.jpg"),
    images: [
      { src: imagePath("weekday-outing-01.jpg"), alt: "정기 요일별 출사에 참여한 밤부 부원들" },
      { src: imagePath("weekday-outing-02.jpg"), alt: "장미 정원에서 함께한 정기 요일별 출사" },
    ],
  },
  {
    id: "joint-outing",
    title: "연합 출사",
    period: "2026.05",
    description: "다른 사진동아리와 한 장소를 걸으며 서로 다른 시선을 나눕니다.",
    coverImage: imagePath("joint-outing-01.jpg"),
    images: [
      { src: imagePath("joint-outing-01.jpg"), alt: "연합 출사에 함께한 사진동아리 부원들" },
      { src: imagePath("joint-outing-02.jpg"), alt: "꽃밭에서 촬영한 연합 출사 단체 사진" },
    ],
  },
  {
    id: "photo-study",
    title: "사진 스터디",
    period: "2026.05",
    description: "촬영과 편집을 배우고 각자의 경험과 사진에 관한 생각을 공유합니다.",
    coverImage: imagePath("photo-study-03.jpg"),
    images: [
      { src: imagePath("photo-study-01.jpg"), alt: "카메라 화면을 함께 살펴보는 밤부 사진 스터디" },
      { src: imagePath("photo-study-02.jpg"), alt: "세종대학교 교정에서 진행한 사진 스터디 촬영 실습" },
      { src: imagePath("photo-study-03.jpg"), alt: "동아리방에서 카메라 사용법을 나누는 밤부 사진 스터디" },
      { src: imagePath("photo-study-04.jpg"), alt: "노트북과 태블릿으로 사진을 편집하는 밤부 사진 스터디" },
    ],
  },
  {
    id: "photo-contest",
    title: "사진 콘테스트",
    period: "연 4회",
    description: "1학기, 여름방학, 2학기, 겨울방학에 자유로운 주제로 서로의 시선을 나눕니다.",
    coverImage: imagePath("photo-contest-01.jpg"),
    images: [
      {
        src: imagePath("photo-contest-01.jpg"),
        alt: "벚꽃 사이에 앉은 직박구리",
        workTitle: "모두의 봄날",
        artist: "연도흠",
        date: "2026.04.07",
        caption: "고된 겨울을 버티고 예쁜 벚꽃을 맞이한 직박구리처럼 밤부 부원들도 아름다운 봄날을 맞이하였으면 좋겠습니다.",
      },
      {
        src: imagePath("photo-contest-02.jpg"),
        alt: "물속을 헤엄치는 잉어와 흩날리는 꽃잎",
        workTitle: "꽃비",
        artist: "이민우",
        date: "2026.04.07",
        caption: "물고기도 사람도 젖지 않던 꽃비",
      },
    ],
  },
  {
    id: "small-groups",
    title: "소모임 활동",
    period: "2026.03 - 06",
    description: "다양한 주제로 자율적으로 모여 관심사를 공유하고 함께 활동합니다.",
    coverImage: imagePath("small-groups-01.jpg"),
    images: [
      { src: imagePath("small-groups-01.jpg"), alt: "필름 카메라를 주제로 모인 밤부필름 소모임" },
      { src: imagePath("small-groups-02.jpg"), alt: "식사를 함께하며 관심사를 나누는 밤슐랭가이드 소모임" },
      { src: imagePath("small-groups-03.jpg"), alt: "보드게임을 함께 즐기는 보부상 소모임" },
      { src: imagePath("small-groups-04.jpg"), alt: "거울 앞에서 함께 촬영한 야인시대 소모임" },
    ],
  },
  {
    id: "mt",
    title: "동아리 MT",
    period: "2026.05",
    description: "학기 중 함께 시간을 보내며 자연스럽게 가까워지는 교류 활동입니다.",
    coverImage: imagePath("mt-02.jpg"),
    images: [
      { src: imagePath("mt-01.jpg"), alt: "보라색 조명 아래에서 함께한 2026년 1학기 밤부 MT" },
      { src: imagePath("mt-02.jpg"), alt: "한 공간에 모여 교류하는 2026년 1학기 밤부 MT" },
    ],
  },
  {
    id: "snack-events",
    title: "간식 행사",
    period: "2026.06",
    description: "시험 기간에 동아리방에 모여 잠시 쉬고 서로를 응원합니다.",
    coverImage: imagePath("snack-events-01.jpg"),
    images: [
      { src: imagePath("snack-events-01.jpg"), alt: "동아리방에서 함께한 2026년 1학기 간식 행사" },
    ],
  },
  {
    id: "closing-meeting",
    title: "종강총회",
    period: "2026.06",
    description: "한 학기의 활동을 돌아보고 다음 기록을 위한 이야기를 나눕니다.",
    coverImage: imagePath("closing-meeting-01.jpg"),
    images: [
      { src: imagePath("closing-meeting-01.jpg"), alt: "강의실에서 진행한 2026년 1학기 밤부 종강총회" },
    ],
  },
]);

window.activitiesData = activitiesData;

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");
const activitiesList = document.querySelector("#activities-list");
const activitySummary = document.querySelector("#activity-summary");
const lightbox = document.querySelector("#activity-lightbox");
const lightboxImage = document.querySelector("#activity-lightbox-image");
const lightboxCaption = document.querySelector("#activity-lightbox-caption");
const lightboxIndex = document.querySelector("#activity-lightbox-index");
const lightboxPrevious = document.querySelector("[data-lightbox-previous]");
const lightboxNext = document.querySelector("[data-lightbox-next]");

// true로 바꾸면 여러 활동 갤러리를 동시에 열 수 있습니다.
const ALLOW_MULTIPLE_OPEN = false;
const openActivityIds = new Set();
const accordionCloseTimers = new Map();
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeActivity = null;
let activeImageIndex = 0;
let imageOpener = null;

function setMenu(open) {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
}

function photoCountText(count) {
  return count > 0 ? `사진 ${count}장` : "사진 준비 중";
}

function renderAccordionGallery(activity) {
  if (activity.images.length === 0) {
    return `
      <div class="activity-accordion-empty">
        <p>사진 준비 중</p>
        <span>해당 활동의 기록은 추후 추가됩니다.</span>
      </div>
    `;
  }

  return `
    <div class="activity-accordion-grid${activity.images.length === 1 ? " is-single" : ""}">
      ${activity.images
        .map(
          (image, imageIndex) => `
            <figure class="activity-accordion-entry${image.caption ? " has-caption" : ""}">
              <button
                type="button"
                class="activity-accordion-photo"
                data-open-image="${activity.id}:${imageIndex}"
                aria-label="${activity.title} 사진 ${imageIndex + 1} 크게 보기"
              >
                <img src="${image.src}" alt="${image.alt}" loading="lazy" />
              </button>
              ${
                image.caption
                  ? `<figcaption>
                      <div>
                        <strong>${image.workTitle}</strong>
                        <span>${image.artist} · ${image.date}</span>
                      </div>
                      <p>${image.caption}</p>
                    </figcaption>`
                  : ""
              }
            </figure>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderActivityCards() {
  if (!activitiesList) return;

  const photoTotal = activitiesData.reduce((total, activity) => total + activity.images.length, 0);
  const photographedActivities = activitiesData.filter((activity) => activity.images.length > 0).length;

  if (activitySummary) {
    activitySummary.textContent = `${activitiesData.length} activities · ${photoTotal} photographs`;
  }

  activitiesList.innerHTML = activitiesData
    .map((activity, index) => {
      const panelId = `activity-panel-${activity.id}`;
      const toggleId = `activity-toggle-${activity.id}`;
      const coverAlt = activity.images.find((image) => image.src === activity.coverImage)?.alt ?? activity.title;
      const media = activity.coverImage
        ? `<figure><img src="${activity.coverImage}" alt="${coverAlt}" loading="lazy" /></figure>`
        : `<div class="activities-item-media-placeholder"><span>${activity.period}</span><strong>사진 기록 준비 중</strong></div>`;

      return `
        <section class="activity-accordion" data-activity-accordion="${activity.id}">
          <article class="activities-item${activity.coverImage ? "" : " activities-item-text-only"}" data-activity-card="${activity.id}">
            ${media}
            <p class="activities-item-number">${String(index + 1).padStart(2, "0")}</p>
            <div class="activities-item-copy">
              <p class="activities-item-period">${activity.period}</p>
              <h3>${activity.title}</h3>
              <p>${activity.description}</p>
              <div class="activities-item-meta">
                <span>${photoCountText(activity.images.length)}</span>
                <span data-activity-toggle-label>사진 보기</span>
              </div>
            </div>
            <button
              class="activities-item-hitbox"
              id="${toggleId}"
              type="button"
              data-toggle-activity="${activity.id}"
              aria-expanded="false"
              aria-controls="${panelId}"
              aria-label="${activity.title} 사진 갤러리"
            ></button>
          </article>
          <div
            class="activity-accordion-panel"
            id="${panelId}"
            role="region"
            aria-labelledby="${toggleId}"
            aria-hidden="true"
            hidden
          >
            <div class="activity-accordion-inner">
              ${renderAccordionGallery(activity)}
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  activitiesList.querySelectorAll("[data-toggle-activity]").forEach((button) => {
    button.addEventListener("click", () => toggleActivity(button.dataset.toggleActivity));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleActivity(button.dataset.toggleActivity);
    });
  });

  activitiesList.querySelectorAll("[data-open-image]").forEach((button) => {
    button.addEventListener("click", () => {
      const [activityId, imageIndex] = button.dataset.openImage.split(":");
      openLightbox(activityId, Number(imageIndex), button);
    });
  });

  activitiesList.dataset.photographedActivities = String(photographedActivities);
}

function setAccordionState(activityId, expanded) {
  const accordion = activitiesList?.querySelector(`[data-activity-accordion="${activityId}"]`);
  const button = accordion?.querySelector("[data-toggle-activity]");
  const panel = accordion?.querySelector(".activity-accordion-panel");
  const label = accordion?.querySelector("[data-activity-toggle-label]");
  const activity = activitiesData.find((item) => item.id === activityId);

  if (!accordion || !button || !panel || !label || !activity) return;

  const closeTimer = accordionCloseTimers.get(activityId);
  if (closeTimer) window.clearTimeout(closeTimer);

  button.setAttribute("aria-expanded", String(expanded));
  label.textContent = expanded ? "접기" : "사진 보기";
  panel.setAttribute("aria-hidden", String(!expanded));

  if (expanded) {
    panel.hidden = false;
    window.requestAnimationFrame(() => accordion.classList.add("is-open"));
    return;
  }

  accordion.classList.remove("is-open");
  if (reduceMotion.matches) {
    panel.hidden = true;
    return;
  }

  const timer = window.setTimeout(() => {
    if (!openActivityIds.has(activityId)) panel.hidden = true;
    accordionCloseTimers.delete(activityId);
  }, 260);
  accordionCloseTimers.set(activityId, timer);
}

function toggleActivity(activityId) {
  const isOpen = openActivityIds.has(activityId);

  if (isOpen) {
    openActivityIds.delete(activityId);
    setAccordionState(activityId, false);
    return;
  }

  if (!ALLOW_MULTIPLE_OPEN) {
    [...openActivityIds].forEach((openId) => {
      openActivityIds.delete(openId);
      setAccordionState(openId, false);
    });
  }

  openActivityIds.add(activityId);
  setAccordionState(activityId, true);
}

function renderLightbox() {
  if (!activeActivity || activeActivity.images.length === 0 || !lightboxImage || !lightboxCaption || !lightboxIndex) return;

  const image = activeActivity.images[activeImageIndex];
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = activeActivity.title;
  lightboxIndex.textContent = `${activeImageIndex + 1} / ${activeActivity.images.length}`;

  const hasMultipleImages = activeActivity.images.length > 1;
  if (lightboxPrevious) lightboxPrevious.disabled = !hasMultipleImages;
  if (lightboxNext) lightboxNext.disabled = !hasMultipleImages;
}

function openLightbox(activityId, index, opener) {
  const activity = activitiesData.find((item) => item.id === activityId);
  if (!activity || !lightbox) return;
  activeActivity = activity;
  activeImageIndex = index;
  imageOpener = opener;
  renderLightbox();
  lightbox.showModal();
  document.body.classList.add("activities-modal-open");
}

function closeLightbox(restoreFocus = true) {
  if (!lightbox?.open) return;
  lightbox.close();
  document.body.classList.remove("activities-modal-open");
  if (restoreFocus) imageOpener?.focus();
}

function moveLightbox(direction) {
  if (!activeActivity || activeActivity.images.length < 2) return;
  activeImageIndex = (activeImageIndex + direction + activeActivity.images.length) % activeActivity.images.length;
  renderLightbox();
}

menuButton?.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.querySelector("[data-close-lightbox]")?.addEventListener("click", () => closeLightbox());
lightboxPrevious?.addEventListener("click", () => moveLightbox(-1));
lightboxNext?.addEventListener("click", () => moveLightbox(1));

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

lightbox?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (lightbox?.open) {
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    }
    return;
  }

  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
});

window.matchMedia("(min-width: 681px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

renderActivityCards();
