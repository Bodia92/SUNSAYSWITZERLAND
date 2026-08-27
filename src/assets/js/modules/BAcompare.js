export default class BACompare {
    constructor(root) {
        this.root = root;
        this.before = root.querySelector(".projects-card__img-before");
        this.handle = root.querySelector(".projects-card__img-handle");
        this.dragging = false;
        this.rect = null;
        this.raf = null;
        this.pendingPct = null;

        // Прив'язка контексту для обробників
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onClickTrack = this.onClickTrack.bind(this);
        this.onResize = this.onResize.bind(this);

        this.init();
    }

    async init() {
        await this.waitImagesLoad();
        this.updateRect();
        this.setPct(this.getInitialPct(), false);
        this.bindEvents();
    }

    waitImagesLoad() {
        const imgs = Array.from(this.root.querySelectorAll("img"));
        return Promise.all(
            imgs.map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((res) => img.addEventListener("load", res, { once: true }));
            }),
        );
    }

    getInitialPct() {
        // Виправлено: додано ||
        const w = parseFloat(this.handle.style.left) || 50;
        return Math.max(0, Math.min(100, w));
    }

    updateRect() {
        this.rect = this.root.getBoundingClientRect();
    }

    bindEvents() {
        // pointer (covers mouse + touch)
        this.handle.addEventListener("pointerdown", this.onPointerDown);
        // click on track to jump
        this.root.addEventListener("click", this.onClickTrack);
        // keyboard
        this.handle.addEventListener("keydown", this.onKeyDown);
        // resize
        window.addEventListener("resize", this.onResize);
    }

    onPointerDown(e) {
        e.preventDefault();
        this.dragging = true;
        this.handle.classList.add("is-dragging");
        this.root.classList.add("no-select");
        this.handle.setPointerCapture(e.pointerId);
        this.updateRect();
        this.onPointerMove(e); // set immediate pos

        this.handle.addEventListener("pointermove", this.onPointerMove);

        // Обгортка для pointerUp, щоб передати pointerId
        this.handle.addEventListener("pointerup", (ev) => this.onPointerUp(ev, e.pointerId), {
            once: true,
        });
        this.handle.addEventListener("pointercancel", (ev) => this.onPointerUp(ev, e.pointerId), {
            once: true,
        });
    }

    onPointerMove(e) {
        if (!this.dragging) return;
        const x = e.clientX;
        const pct = Math.round(((x - this.rect.left) / this.rect.width) * 100 * 100) / 100;
        this.scheduleSetPct(pct);
    }

    onPointerUp(e, pointerId) {
        this.dragging = false;
        this.handle.classList.remove("is-dragging");
        this.root.classList.remove("no-select");
        try {
            this.handle.releasePointerCapture(pointerId);
        } catch (err) {}
        this.handle.removeEventListener("pointermove", this.onPointerMove);
    }

    // Додано метод, якого не вистачало
    onClickTrack(e) {
        // Ігноруємо клік, якщо це був драг хендла
        if (e.target === this.handle || this.dragging) return;

        this.updateRect();
        const x = e.clientX;
        const pct = Math.round(((x - this.rect.left) / this.rect.width) * 100 * 100) / 100;
        this.setPct(pct);
    }

    onKeyDown(e) {
        const stepSmall = 1;
        const stepBig = 10;
        let pct = this.getInitialPct();
        switch (e.key) {
            case "ArrowLeft":
                pct -= stepSmall;
                break;
            case "ArrowRight":
                pct += stepSmall;
                break;
            case "PageDown":
                pct -= stepBig;
                break;
            case "PageUp":
                pct += stepBig;
                break;
            case "Home":
                pct = 0;
                break;
            case "End":
                pct = 100;
                break;
            default:
                return;
        }
        e.preventDefault();
        this.setPct(pct);
    }

    onResize() {
        this.updateRect();
        // Оновлюємо clipPath, бо ширина змінилась
        this.setPct(this.getInitialPct());
    }

    scheduleSetPct(pct) {
        this.pendingPct = Math.max(0, Math.min(100, pct));
        if (!this.raf) {
            this.raf = requestAnimationFrame(() => {
                this.setPct(this.pendingPct);
                this.raf = null;
                this.pendingPct = null;
            });
        }
    }

    setPct(pct) {
        pct = Math.max(0, Math.min(100, pct));

        // Виправлено синтаксис
        const clipX = (pct / 100) * this.rect.width;
        this.before.style.clipPath = `inset(0 ${this.rect.width - clipX}px 0 0)`;
        this.handle.style.left = pct + "%";
    }
}
