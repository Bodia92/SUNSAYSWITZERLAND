export function initScrollSliders() {
    document.querySelectorAll("[data-scroll-slider]").forEach(initOne);
}

function initOne(root) {
    const track = root.querySelector("[data-scroll-track]");
    const prev = root.querySelector("[data-scroll-prev]");
    const next = root.querySelector("[data-scroll-next]");
    const nav = root.querySelector("[data-scroll-nav]");

    if (!track) return;

    const autoplayAttr = root.getAttribute("data-scroll-autoplay");
    const autoplayMs =
        autoplayAttr === "false" ? 0 : Number.parseInt(autoplayAttr || "4000", 10) || 4000;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let autoplayTimer = null;
    let resumeTimer = null;

    const items = () => [...track.children];

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
        return Boolean(nav && nav.offsetParent !== null);
    }

    function update() {
        const max = maxScroll();
        const x = track.scrollLeft;
        const overflow = canScroll();

        prev?.classList.toggle("swiper-button-disabled", !overflow || x <= 2);
        next?.classList.toggle("swiper-button-disabled", !overflow || x >= max - 2);
    }

    function go(dir, { loop = false } = {}) {
        const children = items();
        if (!children.length) return;

        let index = currentIndex() + dir;
        if (loop) {
            index = (index + children.length) % children.length;
        } else {
            index = Math.min(children.length - 1, Math.max(0, index));
        }

        const target = children[index];
        if (!target) return;

        track.scrollTo({
            left: itemOffset(target),
            behavior: "smooth",
        });
    }

    function shouldAutoplay() {
        return Boolean(
            autoplayMs && !reduceMotion && !document.hidden && navIsVisible() && canScroll(),
        );
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function startAutoplay() {
        if (autoplayTimer || !shouldAutoplay()) return;

        autoplayTimer = window.setInterval(() => {
            if (!shouldAutoplay()) {
                stopAutoplay();
                return;
            }
            go(1, { loop: true });
        }, autoplayMs);
    }

    function syncAutoplay() {
        if (shouldAutoplay()) startAutoplay();
        else stopAutoplay();
    }

    function bumpAutoplay() {
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

    update();
    syncAutoplay();
}
