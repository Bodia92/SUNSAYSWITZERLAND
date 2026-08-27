import Swiper from "swiper";
import { FreeMode, Navigation, Pagination, Scrollbar } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

function initReviewsSlider() {
    const sliderEl = document.querySelector(".reviews__slider");
    if (!sliderEl) return;

    const wrapEl = sliderEl.closest(".reviews__slider-wrap");
    if (!wrapEl) return;

    const sectionEl = wrapEl.closest(".reviews") || wrapEl;

    new Swiper(sliderEl, {
        modules: [Navigation, Pagination],
        speed: 600,
        spaceBetween: 20,
        slidesPerView: "auto",
        watchOverflow: true,
        watchSlidesProgress: true,
        grabCursor: true,
        pagination: {
            el: sectionEl.querySelector(".reviews__pagination"),
            clickable: true,
        },
        // breakpoints: {
        //     0: {
        //         slidesPerView: 1.15,
        //         spaceBetween: 16,
        //     },
        //     576: {
        //         slidesPerView: 2.15,
        //         spaceBetween: 16,
        //     },
        //     768: {
        //         slidesPerView: 3.15,
        //         spaceBetween: 20,
        //     },
        //     1100: {
        //         slidesPerView: 4.2,
        //         spaceBetween: 20,
        //     },
        //     1280: {
        //         slidesPerView: 5,
        //         spaceBetween: 20,
        //     },
        // },
    });
}

function initTeamSlider() {
    const sliderEl = document.querySelector(".team__slider");
    if (!sliderEl) return;

    const wrapEl = sliderEl.closest(".team__slider-wrap");
    if (!wrapEl) return;

    new Swiper(sliderEl, {
        modules: [Scrollbar],
        speed: 600,
        spaceBetween: 24,
        slidesPerView: 3,
        watchOverflow: true,
        grabCursor: true,
        watchSlidesProgress: true,
        scrollbar: {
            el: wrapEl.querySelector(".team__scrollbar"),
            draggable: true,
            hide: false,
        },
        breakpoints: {
            0: {
                slidesPerView: 1.15,
                spaceBetween: 16,
            },
            576: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            992: {
                slidesPerView: 3,
                spaceBetween: 24,
            },
        },
    });
}

function initProjectsSlider() {
    const sliderEl = document.querySelector(".projects__slider");
    if (!sliderEl) return;

    const sectionEl = sliderEl.closest(".projects") || sliderEl.parentElement;
    if (!sectionEl) return;

    new Swiper(sliderEl, {
        modules: [Navigation, Pagination],
        speed: 600,
        spaceBetween: 20,
        slidesPerView: 2,
        watchOverflow: true,
        watchSlidesProgress: true,
        grabCursor: false,
        allowTouchMove: false,
        pagination: {
            el: sectionEl.querySelector(".projects__pagination"),
            clickable: true,
        },
        navigation: {
            nextEl: sectionEl.querySelector(".projects__next"),
            prevEl: sectionEl.querySelector(".projects__prev"),
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
                spaceBetween: 16,
            },
            992: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
        },
    });
}

function initProjectGallerySlider() {
    const sliderEl = document.querySelector(".project-gallery__slider");
    if (!sliderEl) return;

    const sectionEl = sliderEl.closest(".project-gallery");
    if (!sectionEl) return;

    const paginationEl = sectionEl.querySelector(".project-gallery__pagination");
    const slides = [...sliderEl.querySelectorAll(".project-gallery__slide")];

    if (paginationEl && slides.length) {
        paginationEl.innerHTML = slides
            .map(
                (_, index) =>
                    `<button type="button" class="project-gallery__bullet${index === 0 ? " is-active" : ""}" data-gallery-bullet="${index}" aria-label="Go to slide ${index + 1}"></button>`,
            )
            .join("");
    }

    const swiper = new Swiper(sliderEl, {
        modules: [],
        speed: 600,
        spaceBetween: 16,
        slidesPerView: 1.35,
        watchOverflow: true,
        watchSlidesProgress: true,
        grabCursor: true,
        breakpoints: {
            576: {
                slidesPerView: 2.2,
                spaceBetween: 18,
            },
            768: {
                slidesPerView: 2.8,
                spaceBetween: 20,
            },
            992: {
                slidesPerView: 3.4,
                spaceBetween: 22,
            },
            1200: {
                slidesPerView: 3.8,
                spaceBetween: 24,
            },
        },
        on: {
            slideChange(instance) {
                updateGalleryBullets(paginationEl, instance.activeIndex);
            },
        },
    });

    paginationEl?.addEventListener("click", (e) => {
        const bullet = e.target.closest("[data-gallery-bullet]");
        if (!bullet) return;
        swiper.slideTo(Number(bullet.dataset.galleryBullet));
    });
}

function updateGalleryBullets(paginationEl, activeIndex) {
    if (!paginationEl) return;
    paginationEl.querySelectorAll("[data-gallery-bullet]").forEach((bullet) => {
        const isActive = Number(bullet.dataset.galleryBullet) === activeIndex;
        bullet.classList.toggle("is-active", isActive);
    });
}

function initCertsSlider() {
    const sliderEl = document.querySelector(".certs__slider");
    if (!sliderEl) return;

    new Swiper(sliderEl, {
        modules: [],
        speed: 600,
        spaceBetween: 16,
        slidesPerView: 1.4,
        watchOverflow: true,
        watchSlidesProgress: true,
        grabCursor: true,
        breakpoints: {
            576: {
                slidesPerView: 2.4,
                spaceBetween: 16,
            },
            768: {
                slidesPerView: 3.2,
                spaceBetween: 18,
            },
            992: {
                slidesPerView: 4.2,
                spaceBetween: 20,
            },
            1200: {
                slidesPerView: 4.4,
                spaceBetween: 20,
            },
        },
    });
}

function initGallerySliders() {
    const sliders = [...document.querySelectorAll(".gallery__slider")];
    if (!sliders.length) return;

    const instances = sliders.map(
        (sliderEl) =>
            new Swiper(sliderEl, {
                modules: [FreeMode],
                slidesPerView: "auto",
                spaceBetween: 16,
                speed: 600,
                grabCursor: true,
                watchOverflow: true,
                observer: true,
                observeParents: true,
                freeMode: {
                    enabled: true,
                    momentum: true,
                },
            }),
    );

    const root = sliders[0].closest("[data-tabs]");
    root?.addEventListener("click", (e) => {
        if (!e.target.closest("[data-tabs-btn]")) return;
        setTimeout(() => {
            instances.forEach((swiper) => swiper.update());
        }, 280);
    });
}

function initHeroServiceSlider() {
    const sliderEl = document.querySelector(".hero-services__slider");
    if (!sliderEl) return;

    new Swiper(sliderEl, {
        modules: [FreeMode],
        slidesPerView: "auto",
        spaceBetween: 12,
        speed: 600,
        grabCursor: true,
        watchOverflow: true,
        freeMode: {
            enabled: true,
            momentum: true,
        },
    });
}

function initServiceWorksSlider() {
    const sliderEl = document.querySelector(".service-works__slider");
    if (!sliderEl) return;

    const sectionEl = sliderEl.closest(".service-works");
    if (!sectionEl) return;

    new Swiper(sliderEl, {
        modules: [Pagination],
        slidesPerView: "auto",
        spaceBetween: 20,
        speed: 600,
        grabCursor: true,
        watchOverflow: true,
        pagination: {
            el: sectionEl.querySelector(".service-works__pagination"),
            clickable: true,
        },
        breakpoints: {
            0: {
                spaceBetween: 12,
            },
            768: {
                spaceBetween: 20,
            },
        },
    });
}

function initCatalogHeroSlider() {
    const sliderEl = document.querySelector(".catalog-hero__slider");
    if (!sliderEl) return;

    const wrapEl = sliderEl.closest(".catalog-hero__slider-wrap");
    if (!wrapEl) return;

    new Swiper(sliderEl, {
        modules: [Navigation, Pagination],
        slidesPerView: 1,
        speed: 600,
        loop: true,
        grabCursor: true,
        watchOverflow: true,
        navigation: {
            prevEl: wrapEl.querySelector(".catalog-hero__btn--prev"),
            nextEl: wrapEl.querySelector(".catalog-hero__btn--next"),
        },
        pagination: {
            el: wrapEl.querySelector(".catalog-hero__fraction"),
            type: "fraction",
            renderFraction: (currentClass, totalClass) =>
                `<span class="${currentClass}"></span><span class="catalog-hero__sep">|</span><span class="${totalClass}"></span>`,
        },
    });
}

function initRecommendedSlider() {
    const sliderEl = document.querySelector(".recommended__slider");
    if (!sliderEl) return;

    new Swiper(sliderEl, {
        slidesPerView: "auto",
        spaceBetween: 20,
        speed: 600,
        grabCursor: true,
        watchOverflow: true,
        breakpoints: {
            0: {
                spaceBetween: 12,
            },
            768: {
                spaceBetween: 20,
            },
        },
    });
}

function initCommentsSlider() {
    const sliderEl = document.querySelector(".comments__slider");
    if (!sliderEl) return;

    const sectionEl = sliderEl.closest(".comments");
    if (!sectionEl) return;

    new Swiper(sliderEl, {
        modules: [Pagination],
        slidesPerView: "auto",
        spaceBetween: 16,
        speed: 600,
        grabCursor: true,
        watchOverflow: true,
        pagination: {
            el: sectionEl.querySelector(".comments__pagination"),
            clickable: true,
        },
        breakpoints: {
            0: {
                spaceBetween: 12,
            },
            768: {
                spaceBetween: 16,
            },
        },
    });
}

export function initSliderObserver() {
    initReviewsSlider();
    initTeamSlider();
    initProjectsSlider();
    initProjectGallerySlider();
    initCertsSlider();
    initGallerySliders();
    initHeroServiceSlider();
    initServiceWorksSlider();
    initCommentsSlider();
    initCatalogHeroSlider();
    initRecommendedSlider();
}
