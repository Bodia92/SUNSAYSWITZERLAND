const MQ_DESKTOP = "(min-width: 992px)";

function getSlideWidth(track) {
    const slide = track.querySelector(":scope > *");
    if (!slide) return track.clientWidth;
    return slide.getBoundingClientRect().width;
}

function updateNav(root, track) {
    const prev = root.querySelector("[data-scroll-prev]");
    const next = root.querySelector("[data-scroll-next]");
    if (!prev || !next) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft >= maxScroll - 2;

    prev.toggleAttribute("disabled", atStart);
    next.toggleAttribute("disabled", atEnd);
}

function bindScrollSlider(root) {
    const track = root.querySelector("[data-scroll-track]");
    const prev = root.querySelector("[data-scroll-prev]");
    const next = root.querySelector("[data-scroll-next]");
    if (!track || !prev || !next) return;

    const media = window.matchMedia(MQ_DESKTOP);

    const onPrev = () => {
        if (media.matches) return;
        track.scrollBy({ left: -getSlideWidth(track), behavior: "smooth" });
    };

    const onNext = () => {
        if (media.matches) return;
        track.scrollBy({ left: getSlideWidth(track), behavior: "smooth" });
    };

    const onScroll = () => updateNav(root, track);

    prev.addEventListener("click", onPrev);
    next.addEventListener("click", onNext);
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    updateNav(root, track);
}

export function initScrollSliders() {
    const roots = document.querySelectorAll("[data-scroll-slider]");
    if (!roots.length) return;

    roots.forEach(bindScrollSlider);
}
