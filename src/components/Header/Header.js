import "./_header.scss";
import Accordion from "../../assets/js/modules/accordion.js";

const MOBILE_MENU_MQ = "(max-width: 1279.98px)";

export default class Header {
    constructor() {
        this.el = document.querySelector(".header");
        if (!this.el) return;

        this.burger = this.el.querySelector(".js-menu-trigger");
        this.init();
    }

    init() {
        this.enhanceWpMenu();
        this.initSubmenuAccordion();
        this.initClickListeners();
        this.initScrollWatcher();
    }

    initSubmenuAccordion() {
        new Accordion(".header .js-header-submenu", {
            triggerSelector: ".js-header-submenu-trigger",
            bodySelector: ".js-header-submenu-body",
            media: MOBILE_MENU_MQ,
            oneOpen: false,
        });
    }

    // WP wp_nav_menu(): li.menu-item-has-children > a + ul.sub-menu
    enhanceWpMenu() {
        const wpItems = this.el.querySelectorAll(".menu-item-has-children");

        wpItems.forEach((item) => {
            if (item.classList.contains("js-header-submenu") && item.querySelector(":scope > .header__nav-parent")) {
                return;
            }
            if (item.querySelector(":scope > .header__nav-parent .js-header-submenu-trigger")) return;

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
            toggle.setAttribute("aria-label", `Відкрити підменю: ${link.textContent.trim()}`);
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
        if (!icon) return "./assets/images/sprite.svg";

        const href = icon.getAttribute("href");
        return href.split("#")[0];
    }

    isMobileMenu() {
        return window.matchMedia(MOBILE_MENU_MQ).matches;
    }

    initClickListeners() {
        document.addEventListener("click", (e) => {
            const menuBtnTrigger = e.target.closest(".js-menu-trigger");

            if (menuBtnTrigger) {
                const isOpen = document.body.classList.toggle("menu-open");
                menuBtnTrigger.classList.toggle("is-active", isOpen);
                menuBtnTrigger.setAttribute("aria-expanded", String(isOpen));
                menuBtnTrigger.setAttribute("aria-label", isOpen ? "Закрити меню" : "Відкрити меню");

                if (!isOpen) this.closeAllSubmenus();
                return;
            }

            if (this.isMobileMenu() && this.isLeafNavLink(e.target)) {
                this.closeMobileMenu();
                return;
            }

            if (this.isMobileMenu() && e.target.closest(".js-header-submenu-trigger")) {
                requestAnimationFrame(() => this.syncOpenSubmenuHeights());
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
                this.closeMobileMenu();
            }
        });

        window.addEventListener("resize", () => {
            if (!this.isMobileMenu() && document.body.classList.contains("menu-open")) {
                this.closeMobileMenu();
            }
        });
    }

    isLeafNavLink(target) {
        const link = target.closest(".header__navbar a");
        if (!link) return false;
        if (link.closest(".header__nav-parent")) return false;
        if (link.closest(".menu-item-has-children") && link.parentElement?.classList.contains("menu-item-has-children")) {
            return false;
        }
        return Boolean(link.closest(".sub-menu") || link.closest(".header__top-nav") || link.closest(".header__actions"));
    }

    syncOpenSubmenuHeights() {
        const bodies = [...this.el.querySelectorAll(".js-header-submenu.is-open > .js-header-submenu-body, .js-header-submenu.is-open > .sub-menu")];
        bodies.reverse().forEach((body) => {
            body.style.maxHeight = `${body.scrollHeight}px`;
        });
    }

    closeMobileMenu() {
        document.body.classList.remove("menu-open");

        if (this.burger) {
            this.burger.classList.remove("is-active");
            this.burger.setAttribute("aria-expanded", "false");
            this.burger.setAttribute("aria-label", "Відкрити меню");
        }

        this.closeAllSubmenus();
    }

    closeAllSubmenus() {
        this.el.querySelectorAll(".js-header-submenu.is-open").forEach((item) => {
            const trigger = item.querySelector(":scope > .header__nav-parent .js-header-submenu-trigger");
            const body = item.querySelector(":scope > .js-header-submenu-body, :scope > .sub-menu");

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
