import Swiper from "swiper";
import { Navigation, Thumbs, FreeMode } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/free-mode";

export function initProductGallery() {
    const roots = document.querySelectorAll("[data-product-gallery]");
    if (!roots.length) return;

    roots.forEach((root) => initOne(root));
}

function initOne(root) {
    const mainEl = root.querySelector("[data-product-main]");
    const thumbsEl = root.querySelector("[data-product-thumbs]");
    if (!mainEl || !thumbsEl) return;

    const prevEl = root.querySelector("[data-product-prev]");
    const nextEl = root.querySelector("[data-product-next]");

    const thumbsSwiper = new Swiper(thumbsEl, {
        modules: [FreeMode, Thumbs],
        direction: "horizontal",
        slidesPerView: "auto",
        spaceBetween: 8,
        freeMode: true,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        watchOverflow: true,
        breakpoints: {
            992: {
                direction: "vertical",
                spaceBetween: 16,
            },
        },
    });

    const mainSwiper = new Swiper(mainEl, {
        modules: [Navigation, Thumbs],
        speed: 500,
        spaceBetween: 0,
        watchOverflow: true,
        grabCursor: true,
        autoHeight: false,
        thumbs: {
            swiper: thumbsSwiper,
        },
        navigation: {
            prevEl,
            nextEl,
        },
    });

    // після зміни брейкпоінту — оновити розміри (без changeDirection, який ламає висоту)
    const mq = window.matchMedia("(min-width: 992px)");
    mq.addEventListener("change", () => {
        requestAnimationFrame(() => {
            thumbsSwiper.update();
            mainSwiper.update();
        });
    });
}

export function initProductTabs() {
    const roots = document.querySelectorAll("[data-product]");
    if (!roots.length) return;

    roots.forEach((root) => {
        const tabs = root.querySelectorAll(".product__tab[href^='#']");
        if (!tabs.length) return;

        tabs.forEach((tab) => {
            tab.addEventListener("click", (e) => {
                const id = tab.getAttribute("href");
                const target = id ? root.querySelector(id) : null;
                if (!target) return;

                e.preventDefault();
                tabs.forEach((t) => t.classList.toggle("is-active", t === tab));

                const headerOffset = 96;
                const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
                window.scrollTo({ top, behavior: "smooth" });
            });
        });
    });
}
