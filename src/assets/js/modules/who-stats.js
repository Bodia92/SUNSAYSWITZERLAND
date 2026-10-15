import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const RING_RADIUS = 114;
const RING_CENTER = 120;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * WHO WE ARE stats:
 * - numbers count from 0 when section enters viewport
 * - yellow tip travels a full circle (drawing the ring), then rests at data-angle
 *
 * data-value / data-suffix / data-angle (degrees clockwise from 12 o'clock)
 */
export function initWhoStats(root = document) {
    const sections = [...root.querySelectorAll("[data-who]")];
    sections.forEach((section) => setupSection(section));
}

function setupSection(section) {
    const items = [...section.querySelectorAll("[data-who-stat]")];
    if (!items.length) return;

    items.forEach((item) => prepareItem(item));

    ScrollTrigger.create({
        trigger: section.querySelector(".who__list") || section,
        start: "top 75%",
        once: true,
        onEnter: () => {
            items.forEach((item, index) => animateItem(item, index * 0.1));
        },
    });
}

function prepareItem(item) {
    const progress = item.querySelector(".who__ring-progress");
    const dot = item.querySelector(".who__ring-dot");
    const countEl = item.querySelector("[data-who-count]");
    const suffix = item.dataset.suffix ?? "";
    const value = Number.parseFloat(item.dataset.value) || 0;

    if (progress) {
        progress.style.strokeDasharray = `${CIRCUMFERENCE}`;
        progress.style.strokeDashoffset = `${CIRCUMFERENCE}`;
        progress.style.opacity = "1";
    }

    if (dot) setDotAngle(dot, 0);

    if (countEl) {
        countEl.textContent = formatValue(0, suffix, Number.isInteger(value));
    }
}

function animateItem(item, delay = 0) {
    if (item.dataset.animated === "true") return;
    item.dataset.animated = "true";

    const progress = item.querySelector(".who__ring-progress");
    const dot = item.querySelector(".who__ring-dot");
    const countEl = item.querySelector("[data-who-count]");
    const value = Number.parseFloat(item.dataset.value) || 0;
    const suffix = item.dataset.suffix ?? "";
    const restAngle = normalizeAngle(Number.parseFloat(item.dataset.angle));
    const isInt = Number.isInteger(value);
    const duration = 1.8;

    const state = { n: 0, a: 0 };

    // Yellow tip travels a full loop (draws the circle), ending at restAngle.
    const travelAngle = 360 + restAngle;

    gsap.to(state, {
        n: value,
        a: travelAngle,
        duration,
        delay,
        ease: "power2.out",
        onUpdate: () => {
            if (countEl) {
                countEl.textContent = formatValue(state.n, suffix, isInt);
            }

            const loopAngle = state.a % 360;
            const drawn = Math.min(state.a, 360);

            if (progress) {
                progress.style.strokeDashoffset = `${CIRCUMFERENCE - (drawn / 360) * CIRCUMFERENCE}`;
            }

            if (dot) {
                setDotAngle(dot, loopAngle === 0 && state.a > 0 ? 360 : loopAngle);
            }
        },
        onComplete: () => {
            if (countEl) {
                countEl.textContent = formatValue(value, suffix, isInt);
            }

            if (dot) setDotAngle(dot, restAngle);

            // Final look matches mockup: grey track + yellow resting dot
            if (progress) {
                gsap.to(progress, {
                    opacity: 0,
                    duration: 0.35,
                    ease: "power1.out",
                    onComplete: () => {
                        progress.style.strokeDashoffset = `${CIRCUMFERENCE}`;
                    },
                });
            }
        },
    });
}

function setDotAngle(dot, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const x = RING_CENTER + RING_RADIUS * Math.cos(rad);
    const y = RING_CENTER + RING_RADIUS * Math.sin(rad);
    dot.setAttribute("cx", x.toFixed(2));
    dot.setAttribute("cy", y.toFixed(2));
}

function normalizeAngle(angle) {
    if (!Number.isFinite(angle)) return 360;
    let a = angle % 360;
    if (a < 0) a += 360;
    return a === 0 ? 360 : a;
}

function formatValue(n, suffix, isInt) {
    const rounded = isInt ? Math.round(n) : Math.round(n * 10) / 10;
    return `${rounded}${suffix}`;
}
