/**
 * What we do tabs:
 * - mobile (≤991): active title follows scroll (viewport center)
 * - desktop (≥992): active title follows hover
 */
const SELECTOR = ".what-we-do__tabs .what-we-do__title";
const ACTIVE = "active";
const MQ_DESKTOP = "(min-width: 992px)";

export function initHome(root = document) {
    const items = [...root.querySelectorAll(SELECTOR)];
    if (!items.length) return;

    const mq = window.matchMedia(MQ_DESKTOP);
    let current = items.find((el) => el.classList.contains(ACTIVE)) || items[0];
    let ticking = false;

    if (!current.classList.contains(ACTIVE)) {
        current.classList.add(ACTIVE);
    }

    function setActive(next) {
        if (!next || next === current) return;
        current.classList.remove(ACTIVE);
        next.classList.add(ACTIVE);
        current = next;
    }

    function syncScrollActive() {
        if (mq.matches) return;

        const mid = window.innerHeight / 2;
        let next = null;

        for (const item of items) {
            const { top, bottom } = item.getBoundingClientRect();
            if (top <= mid && bottom >= mid) {
                next = item;
                break;
            }
        }

        if (next) setActive(next);
    }

    function onScroll() {
        if (mq.matches || ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            syncScrollActive();
        });
    }

    items.forEach((item) => {
        item.addEventListener("mouseenter", () => {
            if (!mq.matches) return;
            setActive(item);
        });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", () => {
        if (!mq.matches) syncScrollActive();
    });

    syncScrollActive();
}
