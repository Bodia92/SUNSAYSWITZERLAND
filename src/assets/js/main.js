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

document.addEventListener("DOMContentLoaded", () => {
    fixMobileVh();
    initSliderObserver();
    initShowMore();
    initAllTabs();
    initSelects();
    initFancybox();

    new Accordion(".sub-in", {
        triggerSelector: ".header__arrow",
        bodySelector: ".sub-list",
        media: "(max-width: 992px)",
    });

    new Accordion(".js-faq-wrap");

    new Accordion(".project-card__specs", {
        triggerSelector: ".project-card__specs-toggle",
        bodySelector: ".project-card__specs-body",
        media: "(max-width: 991.98px)",
        oneOpen: false,
    });
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
