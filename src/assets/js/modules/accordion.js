//приклад
// new Accordion(".js-faq-wrap");

// new Accordion(".js-accordion-wrap", {
//     triggerSelector: ".js-accordion-trigger",
//     bodySelector: ".js-accordion-body"
// });

export default class Accordion {
    constructor(selector, options = {}) {
        this.selector = selector;
        this.items = document.querySelectorAll(selector);

        // Налаштування
        this.config = {
            media: options.media || null,
            oneOpen: options.oneOpen !== false,
            triggerSelector: options.triggerSelector || ".js-faq-trigger",
            bodySelector: options.bodySelector || ".js-faq-body",
            // НОВЕ: Селектор елементів всередині, по кліку на які акордеон має закритись
            closeSelector: options.closeSelector || null,
        };

        this.isInitialized = false;
        this.clickHandler = this.onClick.bind(this);
        this.checkMedia = this.checkMedia.bind(this);
        // НОВЕ: Біндимо метод для внутрішнього закриття
        this.innerCloseHandler = this.onInnerClose.bind(this);

        this.init();
    }

    init() {
        if (this.items.length === 0) return;

        if (this.config.media) {
            this.mediaQuery = window.matchMedia(this.config.media);
            this.mediaQuery.addEventListener("change", this.checkMedia);
            this.checkMedia(this.mediaQuery);
        } else {
            this.enable();
        }
    }

    checkMedia(e) {
        e.matches ? this.enable() : this.disable();
    }

    enable() {
        if (this.isInitialized) return;

        this.items.forEach((item) => {
            const trigger = item.querySelector(this.config.triggerSelector);
            if (trigger) {
                trigger.addEventListener("click", this.clickHandler);
                trigger.setAttribute("aria-expanded", "false");
            }

            // НОВЕ: Додаємо обробник подій на весь блок, якщо передано closeSelector
            if (this.config.closeSelector) {
                item.addEventListener("click", this.innerCloseHandler);
            }

            if (item.classList.contains("is-open") && trigger) {
                const body = item.querySelector(this.config.bodySelector);
                if (body) this.open(trigger, item, body);
            }
        });
        this.isInitialized = true;
    }

    disable() {
        if (!this.isInitialized) return;

        this.items.forEach((item) => {
            const trigger = item.querySelector(this.config.triggerSelector);
            const body = item.querySelector(this.config.bodySelector);

            if (trigger && body) {
                trigger.removeEventListener("click", this.clickHandler);
                trigger.classList.remove("is-active");
                item.classList.remove("is-open");
                body.style.maxHeight = null;
            }

            // НОВЕ: Видаляємо обробник подій для запобігання витоку пам'яті
            if (this.config.closeSelector) {
                item.removeEventListener("click", this.innerCloseHandler);
            }
        });
        this.isInitialized = false;
    }

    onClick(e) {
        const wrap = e.target.closest(this.selector);
        if (!wrap) return;

        const trigger = wrap.querySelector(this.config.triggerSelector);
        const body = wrap.querySelector(this.config.bodySelector);

        if (!trigger.contains(e.target) && trigger !== e.target) return;

        e.preventDefault();
        e.stopPropagation();

        if (this.config.oneOpen && !wrap.classList.contains("is-open")) {
            this.closeAll();
        }

        wrap.classList.contains("is-open")
            ? this.close(trigger, wrap, body)
            : this.open(trigger, wrap, body);
    }

    // НОВЕ: Логіка закриття по кліку на внутрішній елемент (радіо-кнопку, посилання і т.д.)
    onInnerClose(e) {
        // Перевіряємо, чи клік був саме по потрібному елементу (або його нащадках)
        const closeBtn = e.target.closest(this.config.closeSelector);
        if (!closeBtn) return;

        const wrap = e.target.closest(this.selector);
        if (!wrap || !wrap.classList.contains("is-open")) return;

        const trigger = wrap.querySelector(this.config.triggerSelector);
        const body = wrap.querySelector(this.config.bodySelector);

        // Використовуємо setTimeout, щоб дати браузеру мілісекунду на перемальовування
        // стану radio-checked перед тим, як згорнути блок (краще для UX)
        setTimeout(() => {
            this.close(trigger, wrap, body);
        }, 100);
    }

    open(trigger, wrap, body) {
        this._cancelTransition(body);

        wrap.classList.add("is-open");
        trigger.classList.add("is-active");
        trigger.setAttribute("aria-expanded", "true");
        body.hidden = false;

        const prevTransition = body.style.transition;
        body.style.transition = "none";
        body.style.maxHeight = "none";
        const height = body.scrollHeight;
        body.style.maxHeight = "0px";
        void body.offsetHeight;
        body.style.transition = prevTransition;

        body.style.maxHeight = `${height}px`;

        body._accordionOnEnd = (e) => {
            if (e.target !== body || e.propertyName !== "max-height") return;
            if (wrap.classList.contains("is-open")) {
                body.style.maxHeight = "none";
            }
            this._cancelTransition(body);
        };
        body.addEventListener("transitionend", body._accordionOnEnd);
    }

    close(trigger, wrap, body) {
        this._cancelTransition(body);

        // Lock current height, then collapse — spacing stays on children, no end jump
        body.style.maxHeight = `${body.scrollHeight}px`;
        void body.offsetHeight;

        wrap.classList.remove("is-open");
        trigger.classList.remove("is-active");
        trigger.setAttribute("aria-expanded", "false");

        body.style.maxHeight = "0px";

        body._accordionOnEnd = (e) => {
            if (e.target !== body || e.propertyName !== "max-height") return;
            body.style.maxHeight = null;
            this._cancelTransition(body);
        };
        body.addEventListener("transitionend", body._accordionOnEnd);
    }

    _cancelTransition(body) {
        if (body._accordionOnEnd) {
            body.removeEventListener("transitionend", body._accordionOnEnd);
            body._accordionOnEnd = null;
        }
    }

    closeAll() {
        this.items.forEach((item) => {
            if (item.classList.contains("is-open")) {
                const trigger = item.querySelector(this.config.triggerSelector);
                const body = item.querySelector(this.config.bodySelector);
                this.close(trigger, item, body);
            }
        });
    }
}
