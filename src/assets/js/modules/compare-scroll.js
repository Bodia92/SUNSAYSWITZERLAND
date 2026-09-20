export function initCompareScroll() {
    document.querySelectorAll("[data-compare-scroll]").forEach(initOne);
}

function initOne(root) {
    const track = root.querySelector("[data-compare-track]");
    const bar = root.querySelector("[data-compare-bar]");
    const thumb = root.querySelector("[data-compare-thumb]");
    const fill = root.querySelector("[data-compare-fill]");
    if (!track || !bar || !thumb) return;

    let dragging = false;

    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);

    const update = () => {
        const max = maxScroll();
        const progress = max > 0 ? track.scrollLeft / max : 0;
        const range = Math.max(0, bar.clientWidth - thumb.offsetWidth);
        const x = progress * range;

        thumb.style.left = `${x}px`;
        if (fill) {
            fill.style.width = `${x + thumb.offsetWidth / 2}px`;
        }

        root.classList.toggle("is-scrollable", max > 2);
    };

    const setFromClientX = (clientX) => {
        const max = maxScroll();
        if (max <= 0) return;

        const rect = bar.getBoundingClientRect();
        const thumbW = thumb.offsetWidth;
        const range = Math.max(0, rect.width - thumbW);
        const x = Math.min(Math.max(clientX - rect.left - thumbW / 2, 0), range);
        const progress = range > 0 ? x / range : 0;

        track.scrollLeft = progress * max;
        update();
    };

    const onPointerDown = (e) => {
        if (e.button != null && e.button !== 0) return;
        dragging = true;
        thumb.setPointerCapture?.(e.pointerId);
        setFromClientX(e.clientX);
        e.preventDefault();
    };

    const onPointerMove = (e) => {
        if (!dragging) return;
        setFromClientX(e.clientX);
    };

    const onPointerUp = (e) => {
        if (!dragging) return;
        dragging = false;
        try {
            thumb.releasePointerCapture?.(e.pointerId);
        } catch {
            // ignore
        }
    };

    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    bar.addEventListener("pointerdown", onPointerDown);
    thumb.addEventListener("pointermove", onPointerMove);
    thumb.addEventListener("pointerup", onPointerUp);
    thumb.addEventListener("pointercancel", onPointerUp);
    bar.addEventListener("pointermove", onPointerMove);
    bar.addEventListener("pointerup", onPointerUp);
    bar.addEventListener("pointercancel", onPointerUp);

    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(update).observe(track);
        new ResizeObserver(update).observe(bar);
    }

    requestAnimationFrame(update);
    window.addEventListener("load", update, { once: true });
}
