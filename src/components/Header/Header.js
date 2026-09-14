import "./_header.scss";
import Accordion from "../../assets/js/modules/accordion.js";

const MOBILE_MENU_MQ = "(max-width: 1279.98px)";

export default class Header {
    constructor() {
        this.el = document.querySelector(".header");
        if (!this.el) return;

        this.burger = this.el.querySelector(".js-menu-trigger");
        this.navbar = this.el.querySelector("#mobile-menu");
        this.init();
    }

    init() {
        this.enhanceWpMenu();
        this.initSubmenuAccordion();
        this.initClickListeners();
        this.initScrollWatcher();
        this.syncNavbarA11y();
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
            const regionsBtn = e.target.closest(".js-menu-regions");
            if (regionsBtn) {
                e.preventDefault();
                this.openMobileMenu();
                this.openRegionsAccordion();
                return;
            }

            const menuBtnTrigger = e.target.closest(".js-menu-trigger");

            if (menuBtnTrigger) {
                const isOpen = document.body.classList.contains("menu-open");
                if (isOpen) this.closeMobileMenu();
                else this.openMobileMenu();
                return;
            }

            if (this.isMobileMenu() && this.toggleParentHashLink(e)) {
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
            this.syncNavbarA11y();
        });
    }

    syncNavbarA11y() {
        if (!this.navbar) return;

        if (!this.isMobileMenu()) {
            this.navbar.setAttribute("aria-hidden", "false");
            return;
        }

        this.navbar.setAttribute(
            "aria-hidden",
            document.body.classList.contains("menu-open") ? "false" : "true",
        );
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

    toggleParentHashLink(e) {
        const parentLink = e.target.closest(".header__nav-parent > a");
        if (!parentLink) return false;

        const href = parentLink.getAttribute("href");
        if (href && href !== "#") return false;

        e.preventDefault();
        const trigger = parentLink.parentElement?.querySelector(":scope > .js-header-submenu-trigger");
        trigger?.click();
        requestAnimationFrame(() => this.syncOpenSubmenuHeights());
        return true;
    }

    setMenuOpen(isOpen) {
        document.body.classList.toggle("menu-open", isOpen);
        this.navbar?.setAttribute("aria-hidden", this.isMobileMenu() ? String(!isOpen) : "false");

        if (this.burger) {
            this.burger.classList.toggle("is-active", isOpen);
            this.burger.setAttribute("aria-expanded", String(isOpen));
            this.burger.setAttribute("aria-label", isOpen ? "Закрити меню" : "Відкрити меню");
        }
    }

    openMobileMenu() {
        this.setMenuOpen(true);
    }

    closeMobileMenu() {
        this.setMenuOpen(false);
        this.closeAllSubmenus();
    }

    openRegionsAccordion() {
        const item = this.el.querySelector(".js-header-regions");
        if (!item) return;

        const trigger = item.querySelector(":scope > .header__nav-parent .js-header-submenu-trigger");
        const body = item.querySelector(":scope > .js-header-submenu-body, :scope > .sub-menu");
        if (!trigger || !body) return;

        requestAnimationFrame(() => {
            item.classList.add("is-open");
            trigger.classList.add("is-active");
            trigger.setAttribute("aria-expanded", "true");
            body.style.maxHeight = `${body.scrollHeight}px`;
            this.syncOpenSubmenuHeights();
            item.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
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
