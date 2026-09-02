import Swiper from "swiper";
import { FreeMode } from "swiper/modules";

const SVG_NS = "http://www.w3.org/2000/svg";
const DESKTOP_MQ = "(min-width: 992px)";
const MIN_FILL = 0.22;
const CORNER_T = 0.4477;

function isDesktop() {
    return window.matchMedia(DESKTOP_MQ).matches;
}

function getTranslateX(el) {
    const transform = getComputedStyle(el).transform;
    if (!transform || transform === "none") return 0;
    return new DOMMatrixReadOnly(transform).m41;
}

function localRect(el, origin, shiftX = 0) {
    const rect = el.getBoundingClientRect();
    return {
        left: rect.left - origin.left - shiftX,
        top: rect.top - origin.top,
        right: rect.right - origin.left - shiftX,
        bottom: rect.bottom - origin.top,
        width: rect.width,
        height: rect.height,
    };
}

function round(value) {
    return Math.round(value * 10) / 10;
}

function buildTrackPath({ xLeft, xRight, xLogo, xOff, yTopL, yTopR, yBottom, r }) {
    const t = r * CORNER_T;

    if (xRight > xOff - r) {
        return [
            `M${round(xLogo)} ${round(yTopL)}`,
            `L${round(xLeft + r)} ${round(yTopL)}`,
            `C${round(xLeft + t)} ${round(yTopL)} ${round(xLeft)} ${round(yTopL + t)} ${round(xLeft)} ${round(yTopL + r)}`,
            `L${round(xLeft)} ${round(yBottom - r)}`,
            `C${round(xLeft)} ${round(yBottom - t)} ${round(xLeft + t)} ${round(yBottom)} ${round(xLeft + r)} ${round(yBottom)}`,
            `L${round(xOff)} ${round(yBottom)}`,
        ].join(" ");
    }

    return [
        `M${round(xOff)} ${round(yTopR)}`,
        `L${round(xRight + r)} ${round(yTopR)}`,
        `C${round(xRight + t)} ${round(yTopR)} ${round(xRight)} ${round(yTopR + t)} ${round(xRight)} ${round(yTopR + r)}`,
        `L${round(xRight)} ${round(yBottom - r)}`,
        `C${round(xRight)} ${round(yBottom - t)} ${round(xRight - t)} ${round(yBottom)} ${round(xRight - r)} ${round(yBottom)}`,
        `L${round(xLeft + r)} ${round(yBottom)}`,
        `C${round(xLeft + t)} ${round(yBottom)} ${round(xLeft)} ${round(yBottom - t)} ${round(xLeft)} ${round(yBottom - r)}`,
        `L${round(xLeft)} ${round(yTopL + r)}`,
        `C${round(xLeft)} ${round(yTopL + t)} ${round(xLeft + t)} ${round(yTopL)} ${round(xLeft + r)} ${round(yTopL)}`,
        `L${round(xLogo)} ${round(yTopL)}`,
    ].join(" ");
}

function layoutAboutPath(section) {
    const pathRoot = section.querySelector(".about-us__path");
    const svg = pathRoot?.querySelector(".about-us__path-svg");
    const path = svg?.querySelector(".about-us__path-line");
    const decor = section.querySelector(".about-us__decor");
    const slider = section.querySelector(".about-us__slider");
    const wrapper = slider?.querySelector(".swiper-wrapper");
    const slides = [...(section.querySelectorAll(".about-us .swiper-slide") || [])];

    if (!pathRoot || !svg || !path || !decor || !slider || slides.length < 1) return;

    const origin = pathRoot.getBoundingClientRect();
    const width = origin.width;
    const height = origin.height;
    if (width < 10 || height < 10) return;

    svg.setAttribute("viewBox", `0 0 ${round(width)} ${round(height)}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));

    const shiftX = wrapper ? getTranslateX(wrapper) : 0;
    const desktop = isDesktop();
    const stroke = desktop ? 24 : 16;
    const half = stroke / 2;

    const decorBox = localRect(decor, origin);
    const card1 = slides[0].querySelector(".about-us-card__body");
    const card2 = slides[1]?.querySelector(".about-us-card__body");
    const mediaBoxes = slides
        .slice(0, 2)
        .map((slide) => slide.querySelector(".about-us-card__media"))
        .filter(Boolean)
        .map((el) => localRect(el, origin, shiftX));

    if (!card1) return;

    const body1 = localRect(card1, origin, shiftX);
    const body2 = card2 ? localRect(card2, origin, shiftX) : null;

    const xLeft = body1.left + body1.width / 2;
    const xRight = body2 ? body2.left + body2.width / 2 : width * 0.76;
    const xLogo = decorBox.left + decorBox.width;
    const xOff = width + stroke;
    const yCenter = decorBox.top + decorBox.height / 2;
    const yTopL = yCenter;
    const yTopR = yCenter;

    const bottoms = [
        body1.bottom,
        body2?.bottom,
        ...mediaBoxes.map((box) => box.bottom),
        slider.getBoundingClientRect().bottom - origin.top,
    ].filter((value) => Number.isFinite(value));

    const gap = desktop ? 72 : 40;
    const yBottom = Math.max(...bottoms) + half + gap;

    const r = Math.min(
        desktop ? 48 : 28,
        Math.abs(xRight - xLeft) / 4,
        Math.max(16, (yBottom - yTopL) / 5),
        Math.max(16, (yBottom - yTopR) / 5),
    );

    path.setAttribute(
        "d",
        buildTrackPath({
            xLeft,
            xRight,
            xLogo,
            xOff,
            yTopL,
            yTopR,
            yBottom,
            r,
        }),
    );
}

function ensureDots(svg, count, radius) {
    const existing = [...svg.querySelectorAll(".about-us__dot")];
    existing.forEach((dot) => dot.remove());

    for (let i = 0; i < count; i += 1) {
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.classList.add("about-us__dot");
        circle.setAttribute("r", String(radius));
        circle.setAttribute("fill", "#ffd100");
        svg.appendChild(circle);
    }

    return [...svg.querySelectorAll(".about-us__dot")];
}

function initPathDots(section) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rafId = 0;
    let start = performance.now();

    const render = (now) => {
        const svg = section.querySelector(".about-us__path-svg");
        const path = svg?.querySelector(".about-us__path-line");

        if (!svg || !path || !path.getAttribute("d")) {
            rafId = requestAnimationFrame(render);
            return;
        }

        const count = isDesktop() ? 10 : 6;
        const radius = isDesktop() ? 8 : 6;
        let dots = [...svg.querySelectorAll(".about-us__dot")];

        if (dots.length !== count) {
            dots = ensureDots(svg, count, radius);
        }

        const length = path.getTotalLength();
        if (!length) {
            rafId = requestAnimationFrame(render);
            return;
        }

        if (reduced) {
            dots.forEach((dot, index) => {
                const point = path.getPointAtLength(((index + 0.5) / count) * length);
                dot.setAttribute("cx", String(point.x));
                dot.setAttribute("cy", String(point.y));
            });
            return;
        }

        const duration = 22000;
        const t = ((now - start) % duration) / duration;

        dots.forEach((dot, index) => {
            const offset = (t + index / count) % 1;
            const point = path.getPointAtLength(offset * length);
            dot.setAttribute("cx", String(point.x));
            dot.setAttribute("cy", String(point.y));
        });

        rafId = requestAnimationFrame(render);
    };

    const io = new IntersectionObserver(
        (entries) => {
            const visible = entries.some((entry) => entry.isIntersecting);
            cancelAnimationFrame(rafId);

            if (!visible) return;

            start = performance.now();
            rafId = requestAnimationFrame(render);
        },
        { threshold: 0.05 },
    );

    io.observe(section);
}

function buildSticks(track) {
    const maxCount = isDesktop() ? 40 : 22;
    const stickWidth = isDesktop() ? 6 : 5;
    const minGap = isDesktop() ? 10 : 8;
    const count = Math.max(
        12,
        Math.min(maxCount, Math.floor((track.clientWidth + minGap) / (stickWidth + minGap))),
    );

    track.replaceChildren();

    for (let i = 0; i < count; i += 1) {
        const stick = document.createElement("span");
        stick.className = "about-us__stick";
        track.appendChild(stick);
    }

    return count;
}

function updateSticks(track, progress) {
    const sticks = [...track.querySelectorAll(".about-us__stick")];
    if (!sticks.length) return;

    const fill = Math.min(1, Math.max(MIN_FILL, MIN_FILL + progress * (1 - MIN_FILL)));
    const filled = Math.round(fill * sticks.length);

    sticks.forEach((stick, index) => {
        stick.classList.toggle("is-filled", index < filled);
    });
}

function initAboutSlider(section) {
    const sliderEl = section.querySelector(".about-us__slider");
    const sticksEl = section.querySelector("[data-about-sticks]");
    if (!sliderEl || !sticksEl) return null;

    const rebuild = () => {
        buildSticks(sticksEl);
    };

    rebuild();

    const swiper = new Swiper(sliderEl, {
        modules: [FreeMode],
        slidesPerView: "auto",
        spaceBetween: 16,
        speed: 700,
        grabCursor: true,
        watchOverflow: true,
        watchSlidesProgress: true,
        freeMode: {
            enabled: true,
            momentum: true,
            momentumRatio: 0.65,
        },
        breakpoints: {
            992: {
                spaceBetween: 48,
            },
        },
        on: {
            progress(instance, progress) {
                updateSticks(sticksEl, Number.isFinite(progress) ? progress : 0);
            },
            setTranslate(instance) {
                updateSticks(sticksEl, Number.isFinite(instance.progress) ? instance.progress : 0);
            },
        },
    });

    updateSticks(sticksEl, swiper.progress || 0);

    const resizeObserver = new ResizeObserver(() => {
        rebuild();
        swiper.update();
        updateSticks(sticksEl, swiper.progress || 0);
        layoutAboutPath(section);
    });

    resizeObserver.observe(sticksEl);
    resizeObserver.observe(section.querySelector(".about-us__wrapper") || section);

    return swiper;
}

export function initAboutUs() {
    const sections = [...document.querySelectorAll(".about-us")];
    if (!sections.length) return;

    sections.forEach((section) => {
        initAboutSlider(section);
        layoutAboutPath(section);
        requestAnimationFrame(() => layoutAboutPath(section));
        initPathDots(section);
    });

    window.addEventListener("resize", () => {
        sections.forEach((section) => layoutAboutPath(section));
    });
}
