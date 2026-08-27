import "./_header.scss";
import Accordion from "../../assets/js/modules/accordion.js";

export default class Header {
    constructor() {
        this.el = document.querySelector(".header");
        if (!this.el) return;

        this.init();
    }

    init() {
        this.enhanceWpMenu();
        this.initSubmenuAccordion();
        this.initClickListeners();
        this.initScrollWatcher();
    }

    initSubmenuAccordion() {
        new Accordion(".js-header-submenu, .header .menu-item-has-children", {
            triggerSelector: ".js-header-submenu-trigger",
            bodySelector: ".js-header-submenu-body, .sub-menu",
            media: "(max-width: 1199.98px)",
        });
    }

    // Додає toggle-кнопку для WP wp_nav_menu() пунктів з підменю (мобільний акордеон)
    enhanceWpMenu() {
        const wpItems = this.el.querySelectorAll(".menu-item-has-children");

        wpItems.forEach((item) => {
            if (item.classList.contains("js-header-submenu")) return;
            if (item.querySelector(".js-header-submenu-trigger")) return;

            item.classList.add("js-header-submenu");

            const link = item.querySelector(":scope > a");
            const subMenu = item.querySelector(":scope > .sub-menu");
            if (!link || !subMenu) return;

            subMenu.classList.add("js-header-submenu-body");

            const parent = document.createElement("div");
            parent.className = "header__nav-parent";

            link.parentNode.insertBefore(parent, link);
            parent.appendChild(link);

            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "header__submenu-toggle js-header-submenu-trigger";
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", `Toggle ${link.textContent.trim()} submenu`);
            toggle.innerHTML = `
                <svg class="icon header__nav-arrow" aria-hidden="true">
                    <use href="${this.getSpritePath()}#icon-arrow-down"></use>
                </svg>
            `;

            parent.appendChild(toggle);
        });
    }

    getSpritePath() {
        const icon = this.el.querySelector('use[href*="sprite"]');
        if (!icon) return "/assets/images/sprite.svg";

        const href = icon.getAttribute("href");
        return href.split("#")[0];
    }

    initClickListeners() {
        document.addEventListener("click", (e) => {
            const menuBtnTrigger = e.target.closest(".js-menu-trigger");
            const submenuLink = e.target.closest(".header__submenu a");
            const navLink = e.target.closest(".header__nav > ul > li:not(.header__nav-item--has-child) a");

            if (menuBtnTrigger) {
                document.body.classList.toggle("menu-open");
                menuBtnTrigger.classList.toggle("is-active");
                this.closeAllSubmenus();
                return;
            }

            if (submenuLink || navLink) {
                this.closeMobileMenu();
            }
        });
    }

    closeMobileMenu() {
        document.body.classList.remove("menu-open");

        const activeBtn = document.querySelector(".js-menu-trigger");
        if (activeBtn) {
            activeBtn.classList.remove("is-active");
        }

        this.closeAllSubmenus();
    }

    closeAllSubmenus() {
        this.el.querySelectorAll(".js-header-submenu.is-open").forEach((item) => {
            const trigger = item.querySelector(".js-header-submenu-trigger");
            const body = item.querySelector(".js-header-submenu-body");

            item.classList.remove("is-open");

            if (trigger) {
                trigger.classList.remove("is-active");
                trigger.setAttribute("aria-expanded", "false");
            }

            if (body) {
                body.style.maxHeight = null;
            }
        });
    }

    initScrollWatcher() {
        const handleScroll = () => {
            const headerHeight = this.el.offsetHeight;
            const scrollPosition = window.scrollY;

            if (scrollPosition > headerHeight) {
                this.el.classList.add("scroll-header");
            } else {
                this.el.classList.remove("scroll-header");
            }
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
    }
}
