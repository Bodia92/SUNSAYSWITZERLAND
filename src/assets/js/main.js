import "../scss/main.scss";
import "../../components/Footer/_footer.scss";
import "../../components/Contacts/_contacts.scss";

import { fixMobileVh } from "./modules/utils.js";
import { initSliderObserver } from "./modules/slider.js";
import { initScrollAnimations } from "./modules/animations.js";
import Accordion from "./modules/accordion.js";
import { initSelects } from "./modules/select.js";
import { initShowMore } from "./modules/showMore";
import { initFancybox } from "./modules/fancybox.js";
import { initAllTabs } from "./modules/tabs.js";
import { initUtilityPoints } from "./modules/utility-points.js";
import { initWhoStats } from "./modules/who-stats.js";
import { initFaqMore } from "./modules/faq-more.js";
import { initHome } from "./modules/home.js";
import { initPresentMap } from "./modules/present-map.js";
import { initBlogFilters } from "./modules/blog-filters.js";
import { initScrollSliders } from "./modules/scroll-slider.js";
import { initTextFill } from "./modules/text-fill.js";
import { initFormValidation } from "./modules/form-validation.js";

document.addEventListener("DOMContentLoaded", () => {
    fixMobileVh();
    initSliderObserver();
    initShowMore();
    initAllTabs();
    initSelects();
    initFancybox();
    initUtilityPoints();
    initWhoStats();
    initFaqMore();
    initHome();
    initPresentMap();
    initBlogFilters();
    initScrollSliders();
    initTextFill();
    initFormValidation();


    new Accordion(".sub-in", {
        triggerSelector: ".header__arrow",
        bodySelector: ".sub-list",
        media: "(max-width: 992px)",
    });

    new Accordion(".js-faq-wrap");
});

const modules = import.meta.glob("../../components/**/*.js", { eager: true });

window.addEventListener("load", () => {
    initScrollAnimations();
});

document.addEventListener("DOMContentLoaded", () => {
    for (const path in modules) {
        const component = modules[path];

        if (component.default && typeof component.default === "function") {
            try {
                new component.default();
            } catch (e) {
                console.error(`Error loading component ${path}:`, e);
            }
        }
    }
});
