const DESKTOP_MQ = "(min-width: 992px)";
const MOBILE_IMG_MQ = "(max-width: 575.98px)";

/**
 * Utility Scale BESS hotspots:
 * - desktop: SVG lines from card top-center → point center; hover/focus highlights
 * - mobile: point labels; only active card visible; tap switches card
 *
 * Positions (% of block):
 * - data-x / data-y — default (desktop + tablet)
 * - data-x-mobile / data-y-mobile — ≤575.98px (mobile image); falls back to data-x/y
 *
 * WP: same data-id on points and cards.
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
        this.mobileImgMedia = window.matchMedia(MOBILE_IMG_MQ);
        this.raf = 0;
        this.activeId = null;

        this.positionPoints();
        this.bind();
        this.syncBreakpoint();
        this.update();
    }

    bind() {
        this.onResize = () => this.scheduleUpdate();
        this.onMediaChange = () => {
            this.syncBreakpoint();
            this.update();
        };

        window.addEventListener("resize", this.onResize, { passive: true });
        window.addEventListener("load", this.onResize, { passive: true });
        this.media.addEventListener?.("change", this.onMediaChange);
        this.mobileImgMedia.addEventListener?.("change", this.onMediaChange);

        if (typeof ResizeObserver !== "undefined") {
            this.ro = new ResizeObserver(() => this.scheduleUpdate());
            this.ro.observe(this.block);
            this.cards.forEach((card) => this.ro.observe(card));
        }

        const image = this.block.querySelector(".utility__image img");
        if (image && !image.complete) {
            image.addEventListener("load", this.onResize, { passive: true });
        }

        this.points.forEach((point) => {
            point.addEventListener("click", () => this.onPointClick(point));
            point.addEventListener("mouseenter", () => {
                if (this.media.matches) this.setActive(point.dataset.id);
            });
            point.addEventListener("mouseleave", () => {
                if (this.media.matches) this.setActive(null);
            });
            point.addEventListener("focus", () => {
                if (this.media.matches) this.setActive(point.dataset.id);
            });
            point.addEventListener("blur", () => {
                if (this.media.matches) this.setActive(null);
            });
        });

        this.cards.forEach((card) => {
            card.addEventListener("click", () => this.onCardClick(card));
        });
    }

    syncBreakpoint() {
        if (this.media.matches) {
            this.setActive(null);
            return;
        }

        const fallback = this.activeId || this.points[0]?.dataset.id || this.cards[0]?.dataset.id;
        if (fallback) this.setActive(fallback);
    }

    scheduleUpdate() {
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(() => this.update());
    }

    update() {
        this.positionPoints();

        if (this.media.matches) {
            this.clearLabelSides();
            this.drawLines();
        } else {
            this.clearLines();
            this.fitPointLabels();
        }
    }

    /**
     * Read % coords from data attrs for current breakpoint.
     */
    getPointCoords(point) {
        const useMobile = this.mobileImgMedia.matches;
        const xRaw = useMobile && point.dataset.xMobile != null ? point.dataset.xMobile : point.dataset.x;
        const yRaw = useMobile && point.dataset.yMobile != null ? point.dataset.yMobile : point.dataset.y;

        return {
            x: Number.parseFloat(xRaw),
            y: Number.parseFloat(yRaw),
        };
    }

    positionPoints() {
        this.points.forEach((point) => {
            const { x, y } = this.getPointCoords(point);

            if (Number.isFinite(x)) point.style.left = `${x}%`;
            if (Number.isFinite(y)) point.style.top = `${y}%`;
        });
    }

    clearLabelSides() {
        this.points.forEach((point) => {
            point.classList.remove("utility__point--label-start");
        });
    }

    /**
     * Keep labels inside the block: default to the right of the dot,
     * flip to the left if they would overflow the right edge.
     */
    fitPointLabels() {
        const edgePad = 12;
        const blockRect = this.block.getBoundingClientRect();

        this.points.forEach((point) => {
            const label = point.querySelector(".utility__point-label");
            if (!label) return;

            point.classList.remove("utility__point--label-start");

            const labelRect = label.getBoundingClientRect();
            const overflowsRight = labelRect.right > blockRect.right - edgePad;
            const overflowsLeft = labelRect.left < blockRect.left + edgePad;

            if (overflowsRight && !overflowsLeft) {
                point.classList.add("utility__point--label-start");
            }
        });
    }

    getCardById(id) {
        return this.cards.find((card) => card.dataset.id === id) || null;
    }

    getPointById(id) {
        return this.points.find((point) => point.dataset.id === id) || null;
    }

    setActive(id) {
        this.activeId = id || null;

        this.points.forEach((point) => {
            const active = Boolean(id) && point.dataset.id === id;
            point.classList.toggle("is-active", active);
            point.setAttribute("aria-pressed", active ? "true" : "false");
        });

        this.cards.forEach((card) => {
            card.classList.toggle("is-active", Boolean(id) && card.dataset.id === id);
        });
    }

    onPointClick(point) {
        this.setActive(point.dataset.id);
    }

    onCardClick(card) {
        if (this.media.matches) {
            this.setActive(card.dataset.id);
        }
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

            const cardRect = card.getBoundingClientRect();
            const dot = point.querySelector(".utility__point-dot") || point;
            const dotRect = dot.getBoundingClientRect();

            const x1 = cardRect.left + cardRect.width / 2 - blockRect.left;
            const y1 = cardRect.top - blockRect.top;
            const x2 = dotRect.left + dotRect.width / 2 - blockRect.left;
            const y2 = dotRect.top + dotRect.height / 2 - blockRect.top;

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
