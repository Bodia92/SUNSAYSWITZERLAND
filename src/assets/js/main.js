import "../scss/main.scss";
// Компоненти лише зі стилями (без порожніх *.js у build:wp)
import "../../components/Footer/_footer.scss";
import "../../components/Contacts/_contacts.scss";
import "../../components/Features/_features.scss";

// Імпорт загальних модулів
import { fixMobileVh } from "./modules/utils.js";
import { initSliderObserver } from "./modules/slider.js";
import { initAboutUs } from "./modules/about-us.js";
import { initReviewsPopup } from "./modules/reviews.js";
import { initBlogLikes } from "./modules/blog-likes.js";
import { initIncludesPopup } from "./modules/includes-popup.js";
import { initCourses } from "./modules/courses.js";
import { initObjectsMap } from "./modules/objects-map.js";
import { initProjectsFilter } from "./modules/projects-filter.js";
import { initFaqShowMore } from "./modules/faq-more.js";
import { initScrollAnimations } from "./modules/animations.js";
import { initDecorParallax } from "./modules/decor-parallax.js";
import Accordion from "./modules/accordion.js";
import { initSelects } from "./modules/select.js";
// import { initVideoBannerControls } from "./modules/video";
import { initShowMore } from "./modules/showMore";
//import { initLightbox } from "./modules/lightbox.js";
import { initMarquee } from "./modules/marquee";
import { initGallery } from "./modules/lightgallery";
import { initAllTabs, initTabs } from "./modules/tabs.js";
import BACompare from "./modules/BAcompare.js";

import { initFancybox } from "./modules/fancybox.js";
import { initScrollSliders } from "./modules/scroll-slider.js";
import { initCompareScroll } from "./modules/compare-scroll.js";

// Запуск загальних скриптів
document.addEventListener("DOMContentLoaded", () => {
    fixMobileVh();
    initSliderObserver();
    initAboutUs();
    initReviewsPopup();
    initBlogLikes();
    initIncludesPopup();
    initCourses();
    initProjectsFilter();
    initObjectsMap();
    initFaqShowMore();
    initShowMore();
    initMarquee();
    initGallery();
    initAllTabs();
    initSelects();
    initFancybox();
    initScrollSliders();
    initCompareScroll();
    //initLightbox();

    const nodes = document.querySelectorAll("[data-ba-compare]");

    nodes.forEach((node) => {
        new BACompare(node);
    });

    new Accordion(".sub-in", {
        triggerSelector: ".header__arrow",
        bodySelector: ".sub-list",
        media: "(max-width: 992px)",
    });

    new Accordion(".js-faq-wrap");

    new Accordion(".js-quote-wrap", {
        triggerSelector: ".js-quote-trigger",
        bodySelector: ".js-quote-body",
    });

    new Accordion(".project-card__specs", {
        triggerSelector: ".project-card__specs-toggle",
        bodySelector: ".project-card__specs-body",
        media: "(max-width: 991.98px)",
        oneOpen: false,
    });

    new Accordion(".form-options", {
        triggerSelector: ".form-options__trigger",
        bodySelector: ".form-options__body",
        closeSelector: ".custom-radio",
    });

    const columns = document.querySelectorAll(".services__col");

    if (columns.length > 0) {
        columns.forEach((col) => {
            col.addEventListener("click", () => {
                if (window.innerWidth >= 992) return;

                columns.forEach((c) => c.classList.remove("is-active"));

                col.classList.add("is-active");
            });
        });

        document.addEventListener("click", (e) => {
            if (window.innerWidth >= 992) return;

            if (!e.target.closest(".services__grid")) {
                columns.forEach((c) => c.classList.remove("is-active"));
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth >= 992) {
                columns.forEach((c) => c.classList.remove("is-active"));
            }
        });
    }
    document.querySelectorAll(".form-options").forEach((dropdown) => {
        dropdown.addEventListener("change", (e) => {
            if (e.target.type === "radio") {
                const trigger = dropdown.querySelector(".form-options__trigger");
                const valueEl = trigger?.querySelector(".form-options__value");
                const label = e.target.closest("label");
                const selectedText =
                    label?.querySelector(".custom-radio__text")?.textContent.trim() ||
                    label?.textContent.trim();

                if (!trigger || !selectedText) return;

                if (valueEl) {
                    valueEl.textContent = selectedText;
                } else if (trigger.firstChild && trigger.firstChild.nodeType === Node.TEXT_NODE) {
                    trigger.firstChild.textContent = `${selectedText} `;
                }
            }
        });
    });
});

// Автоматичний імпорт всіх JS файлів з компонентів
const modules = import.meta.glob("../../components/**/*.js", { eager: true });
window.addEventListener("load", () => {
    initScrollAnimations();
    initDecorParallax();
});
// Логіка ініціалізаціїі
document.addEventListener("DOMContentLoaded", () => {
    // Проходимось по всіх знайдених модулях
    for (const path in modules) {
        const component = modules[path];

        // Якщо в файлі компонента є експорт за замовчуванням (клас або функція)
        if (component.default && typeof component.default === "function") {
            try {
                // Можна додати перевірку, чи існує елемент на сторінці перед запуском
                // Наприклад, якщо компонент називається class Slider
                new component.default();
            } catch (e) {
                console.error(`Error loading component ${path}:`, e);
            }
        }
    }
});
