export function initScrollSliders() {
    document.querySelectorAll("[data-scroll-slider]").forEach(initOne);
}

function parseAutoplayMs(attr) {
    if (attr === "false" || attr === "0") return 0;
    if (attr == null || attr === "" || attr === "true") return 2000;
    const n = Number.parseInt(attr, 10);
    return Number.isFinite(n) && n > 0 ? n : 2000;
}

function initOne(root) {
    const track = root.querySelector("[data-scroll-track]");
    const prev = root.querySelector("[data-scroll-prev]");
    const next = root.querySelector("[data-scroll-next]");
    const nav = root.querySelector("[data-scroll-nav]");

    if (!track) return;

    const autoplayMs = parseAutoplayMs(root.getAttribute("data-scroll-autoplay"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let autoplayTimer = null;
    let resumeTimer = null;
    let programmatic = false;
    let programmaticTimer = null;
    let visible = true;

    const items = () => [...track.children].filter((el) => el.nodeType === 1);

    function itemOffset(item) {
        return item.offsetLeft - (Number.parseFloat(getComputedStyle(track).paddingLeft) || 0);
    }

    function currentIndex() {
        const children = items();
        if (!children.length) return 0;

        const x = track.scrollLeft;
        return children.reduce((best, item, index) => {
            const bestDist = Math.abs(itemOffset(children[best]) - x);
            const dist = Math.abs(itemOffset(item) - x);
            return dist < bestDist ? index : best;
        }, 0);
    }

    function maxScroll() {
        return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    function canScroll() {
        return maxScroll() > 2;
    }

    function navIsVisible() {
        if (!nav) return false;
        // display:none → offsetParent null; також ловимо visibility через розміри
        return nav.offsetParent !== null && nav.getClientRects().length > 0;
    }

    function update() {
        const max = maxScroll();
        const x = track.scrollLeft;
        const overflow = canScroll();

        prev?.classList.toggle("swiper-button-disabled", !overflow || x <= 2);
        next?.classList.toggle("swiper-button-disabled", !overflow || x >= max - 2);
    }

    function markProgrammatic(duration = 700) {
        programmatic = true;
        clearTimeout(programmaticTimer);
        programmaticTimer = window.setTimeout(() => {
            programmatic = false;
        }, duration);
    }

    function go(dir, { loop = false } = {}) {
        const children = items();
        if (!children.length || !canScroll()) return;

        const from = currentIndex();
        let index = from + dir;

        if (loop) {
            if (dir > 0 && from >= children.length - 1) {
                // Миттєвий wrap на початок — smooth + scroll-snap часто «зависає» на останньому
                markProgrammatic(50);
                track.scrollTo({ left: 0, behavior: "auto" });
                update();
                return;
            }
            if (dir < 0 && from <= 0) {
                const last = children[children.length - 1];
                markProgrammatic(50);
                track.scrollTo({ left: itemOffset(last), behavior: "auto" });
                update();
                return;
            }
            index = (index + children.length) % children.length;
        } else {
            index = Math.min(children.length - 1, Math.max(0, index));
        }

        const target = children[index];
        if (!target) return;

        markProgrammatic();
        track.scrollTo({
            left: itemOffset(target),
            behavior: reduceMotion ? "auto" : "smooth",
        });
    }

    function shouldAutoplay() {
        return Boolean(
            autoplayMs &&
            !reduceMotion &&
            !document.hidden &&
            visible &&
            navIsVisible() &&
            canScroll(),
        );
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearTimeout(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function scheduleAutoplay() {
        stopAutoplay();
        if (!shouldAutoplay()) return;

        autoplayTimer = window.setTimeout(() => {
            autoplayTimer = null;
            if (!shouldAutoplay()) return;
            go(1, { loop: true });
            // Наступний тік плануємо завжди — навіть після wrap
            scheduleAutoplay();
        }, autoplayMs);
    }

    function syncAutoplay() {
        if (shouldAutoplay()) scheduleAutoplay();
        else stopAutoplay();
    }

    function bumpAutoplay() {
        // Ігноруємо програмний скрол, інакше автоплей глушиться після першого кроку
        if (programmatic) return;
        stopAutoplay();
        clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(syncAutoplay, autoplayMs);
    }

    prev?.addEventListener("click", (e) => {
        e.preventDefault();
        go(-1);
        bumpAutoplay();
    });

    next?.addEventListener("click", (e) => {
        e.preventDefault();
        go(1);
        bumpAutoplay();
    });

    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("pointerdown", bumpAutoplay);
    track.addEventListener(
        "touchstart",
        () => {
            bumpAutoplay();
        },
        { passive: true },
    );
    track.addEventListener("wheel", bumpAutoplay, { passive: true });

    document.addEventListener("visibilitychange", syncAutoplay);

    window.addEventListener("resize", () => {
        update();
        syncAutoplay();
    });

    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(() => {
            update();
            syncAutoplay();
        }).observe(track);
    }

    if (typeof IntersectionObserver !== "undefined") {
        const io = new IntersectionObserver(
            (entries) => {
                visible = entries.some(
                    (entry) => entry.isIntersecting && entry.intersectionRatio > 0.2,
                );
                syncAutoplay();
            },
            { threshold: [0, 0.2, 0.5] },
        );
        io.observe(root);
    }

    update();
    // Старт після layout / картинок
    requestAnimationFrame(() => {
        update();
        syncAutoplay();
    });
    window.addEventListener("load", syncAutoplay, { once: true });
}
