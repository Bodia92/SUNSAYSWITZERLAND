import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DECOR_SELECTOR = [
    ".quote__decor-item",
    ".about__decor",
    ".different__decor",
    ".area-intro__square",
    ".area-services__decor",
    ".quality__photo",
    ".features__star",
].join(", ");

const PRESETS = [
    { x: -1, y: 1, xRange: 34, yRange: 50, lag: 1.35 },
    { x: 1, y: -0.7, xRange: 42, yRange: 38, lag: 1.15 },
    { x: -0.8, y: -1, xRange: 30, yRange: 54, lag: 1.5 },
    { x: 1, y: 0.85, xRange: 38, yRange: 46, lag: 1.25 },
    { x: -0.55, y: 1, xRange: 36, yRange: 44, lag: 1.4 },
    { x: 0.9, y: -0.6, xRange: 40, yRange: 42, lag: 1.2 },
];

function getParallaxTarget(el) {
    return el.querySelector("img") || el;
}

function getTrigger(el) {
    return (
        el.closest(".quality__row") ||
        el.closest(".area-intro") ||
        el.closest(".area-services") ||
        el.closest(".different") ||
        el.closest(".section") ||
        el.closest(".quote") ||
        el.closest(".about") ||
        el.closest(".features") ||
        el.parentElement
    );
}

function readNumber(el, key, fallback) {
    const value = Number(el.dataset[key]);
    return Number.isFinite(value) ? value : fallback;
}

function getPreset(el, index) {
    const base = PRESETS[index % PRESETS.length];

    return {
        x: readNumber(el, "parallaxX", base.x),
        y: readNumber(el, "parallaxY", base.y),
        xRange: readNumber(el, "parallaxXRange", base.xRange),
        yRange: readNumber(el, "parallaxYRange", base.yRange),
        lag: readNumber(el, "parallaxLag", base.lag),
    };
}

export function initDecorParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const elements = document.querySelectorAll(DECOR_SELECTOR);

    if (!elements.length) {
        return;
    }

    const rangeMultiplier = window.innerWidth < 768 ? 0.45 : 1;

    elements.forEach((el, index) => {
        const target = getParallaxTarget(el);
        const preset = getPreset(el, index);
        const section = getTrigger(el);

        if (!section) {
            return;
        }

        gsap.set(target, { force3D: true, x: 0, y: 0 });

        // quickTo + power3.out = рух проти скролу з легким доїздом після зупинки
        const quickX = gsap.quickTo(target, "x", {
            duration: preset.lag,
            ease: "power3.out",
        });
        const quickY = gsap.quickTo(target, "y", {
            duration: preset.lag * 1.15,
            ease: "power3.out",
        });

        ScrollTrigger.create({
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                // progress 0→1; зміщення протилежне напрямку скролу
                const offset = (0.5 - self.progress) * 2;

                quickX(offset * preset.x * preset.xRange * rangeMultiplier);
                quickY(offset * preset.y * preset.yRange * rangeMultiplier);
            },
        });
    });

    ScrollTrigger.refresh();
}
