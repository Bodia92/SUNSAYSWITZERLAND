const DESKTOP_MQ = "(min-width: 992px)";

/**
 * Utility Scale BESS hotspots:
 * - desktop: SVG lines from card top-center → point center
 * - mobile: native horizontal card scroll; point click scrolls to matching card
 *
 * WP: set data-x / data-y (%) and data-id on points; same data-id on cards.
 */
export function initUtilityPoints(root = document) {
    const blocks = [...root.querySelectorAll("[data-utility]")];
    blocks.forEach((block) => new UtilityPoints(block));
}

class UtilityPoints {
    constructor(block) {
        this.block = block;
        this.linesSvg = block.querySelector("[data-utility-lines]");
        this.list = block.querySelector("[data-utility-list]");
        this.points = [...block.querySelectorAll("[data-utility-point]")];
        this.cards = [...block.querySelectorAll("[data-utility-card]")];

        if (!this.points.length || !this.cards.length) return;

        this.media = window.matchMedia(DESKTOP_MQ);
        this.raf = 0;

        this.positionPoints();
        this.bind();
        this.update();
    }

    bind() {
        this.onResize = () => this.scheduleUpdate();
        this.onMediaChange = () => this.update();

        window.addEventListener("resize", this.onResize, { passive: true });
        window.addEventListener("load", this.onResize, { passive: true });
        this.media.addEventListener?.("change", this.onMediaChange);

        if (typeof ResizeObserver !== "undefined") {
            this.ro = new ResizeObserver(() => this.scheduleUpdate());
            this.ro.observe(this.block);
            this.cards.forEach((card) => this.ro.observe(card));
        }

        this.points.forEach((point) => {
            point.addEventListener("click", () => this.onPointClick(point));
            point.addEventListener("mouseenter", () => this.setActive(point.dataset.id));
            point.addEventListener("mouseleave", () => {
                if (this.media.matches) this.setActive(null);
            });
            point.addEventListener("focus", () => this.setActive(point.dataset.id));
            point.addEventListener("blur", () => {
                if (this.media.matches) this.setActive(null);
            });
        });

        this.cards.forEach((card) => {
            card.addEventListener("click", () => this.onCardClick(card));
        });
    }

    scheduleUpdate() {
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(() => this.update());
    }

    update() {
        this.positionPoints();

        if (this.media.matches) {
            this.drawLines();
        } else {
            this.clearLines();
        }
    }

    positionPoints() {
        this.points.forEach((point) => {
            const x = Number.parseFloat(point.dataset.x);
            const y = Number.parseFloat(point.dataset.y);

            if (Number.isFinite(x)) point.style.left = `${x}%`;
            if (Number.isFinite(y)) point.style.top = `${y}%`;
        });
    }

    getCardById(id) {
        return this.cards.find((card) => card.dataset.id === id) || null;
    }

    getPointById(id) {
        return this.points.find((point) => point.dataset.id === id) || null;
    }

    setActive(id) {
        this.points.forEach((point) => {
            point.classList.toggle("is-active", Boolean(id) && point.dataset.id === id);
        });
        this.cards.forEach((card) => {
            card.classList.toggle("is-active", Boolean(id) && card.dataset.id === id);
        });
    }

    onPointClick(point) {
        const id = point.dataset.id;
        this.setActive(id);

        if (!this.media.matches) {
            this.scrollToCard(id);
        }
    }

    onCardClick(card) {
        const id = card.dataset.id;
        this.setActive(id);

        if (!this.media.matches) {
            this.scrollToCard(id);
        }
    }

    scrollToCard(id) {
        const card = this.getCardById(id);
        if (!card || !this.list) return;

        const listRect = this.list.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const left =
            this.list.scrollLeft + (cardRect.left - listRect.left) - (listRect.width - cardRect.width) / 2;

        this.list.scrollTo({
            left: Math.max(0, left),
            behavior: "smooth",
        });
    }

    clearLines() {
        if (this.linesSvg) this.linesSvg.innerHTML = "";
    }

    drawLines() {
        if (!this.linesSvg) return;

        const blockRect = this.block.getBoundingClientRect();
        const width = Math.max(1, this.block.clientWidth);
        const height = Math.max(1, this.block.clientHeight);

        this.linesSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        this.linesSvg.setAttribute("width", String(width));
        this.linesSvg.setAttribute("height", String(height));

        const ns = "http://www.w3.org/2000/svg";
        const frag = document.createDocumentFragment();

        this.points.forEach((point) => {
            const card = this.getCardById(point.dataset.id);
            if (!card) return;

            const pointRect = point.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();

            const x1 = cardRect.left + cardRect.width / 2 - blockRect.left;
            const y1 = cardRect.top - blockRect.top;
            const x2 = pointRect.left + pointRect.width / 2 - blockRect.left;
            const y2 = pointRect.top + pointRect.height / 2 - blockRect.top;

            const line = document.createElementNS(ns, "line");
            line.setAttribute("x1", x1.toFixed(2));
            line.setAttribute("y1", y1.toFixed(2));
            line.setAttribute("x2", x2.toFixed(2));
            line.setAttribute("y2", y2.toFixed(2));
            line.setAttribute("class", "utility__line");
            line.dataset.id = point.dataset.id || "";
            frag.appendChild(line);
        });

        this.linesSvg.replaceChildren(frag);
    }
}
