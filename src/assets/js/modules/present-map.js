/**
 * "We are present in" map — open contact popup on pin click
 */
const MOBILE_MQ = "(max-width: 991.98px)";

export function initPresentMap(root = document) {
    const sections = [...root.querySelectorAll("[data-present-map]")];
    sections.forEach((section) => setupMap(section));
}

function setupMap(section) {
    const canvas = section.querySelector(".map__canvas");
    const viewport = section.querySelector("[data-map-viewport]") || section.querySelector(".map__viewport");
    const container = section.querySelector(".map__container");
    const popup = section.querySelector("[data-map-popup]");
    const points = [...section.querySelectorAll("[data-map-point]")];
    if (!canvas || !popup || !points.length) return;

    const closeBtn = popup.querySelector("[data-map-close]");
    const media = window.matchMedia(MOBILE_MQ);
    const els = {
        photo: popup.querySelector("[data-map-photo]"),
        name: popup.querySelector("[data-map-name]"),
        role: popup.querySelector("[data-map-role]"),
        phone: popup.querySelector("[data-map-phone]"),
        phoneLink: popup.querySelector("[data-map-phone-link]"),
        email: popup.querySelector("[data-map-email]"),
        emailLink: popup.querySelector("[data-map-email-link]"),
        location: popup.querySelector("[data-map-location]"),
    };

    let active = null;
    let hintPlayed = false;

    function fillPopup(point) {
        const { dataset } = point;
        if (els.photo && dataset.photo) {
            els.photo.src = dataset.photo;
            els.photo.alt = dataset.name || "";
        }
        if (els.name) els.name.textContent = dataset.name || "";
        if (els.role) els.role.textContent = dataset.role || "";
        if (els.phone) els.phone.textContent = dataset.phone || "";
        if (els.phoneLink) {
            els.phoneLink.href = dataset.phoneHref || `tel:${(dataset.phone || "").replace(/\s+/g, "")}`;
        }
        if (els.email) els.email.textContent = dataset.email || "";
        if (els.emailLink) {
            els.emailLink.href = dataset.email ? `mailto:${dataset.email}` : "#";
        }
        if (els.location) els.location.textContent = dataset.location || "";
    }

    function open(point) {
        if (active && active !== point) {
            active.classList.remove("is-active");
            active.setAttribute("aria-expanded", "false");
        }

        fillPopup(point);
        active = point;
        point.classList.add("is-active");
        point.setAttribute("aria-expanded", "true");

        popup.hidden = false;
        popup.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() => popup.classList.add("is-open"));
    }

    function close() {
        if (!active && !popup.classList.contains("is-open")) return;

        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");

        points.forEach((point) => {
            point.classList.remove("is-active");
            point.setAttribute("aria-expanded", "false");
        });
        active = null;

        const onEnd = () => {
            if (!popup.classList.contains("is-open")) popup.hidden = true;
            popup.removeEventListener("transitionend", onEnd);
        };
        popup.addEventListener("transitionend", onEnd);
    }

    function updateEdgeFades() {
        if (!viewport || !container || !media.matches) {
            container?.classList.add("is-at-start", "is-at-end");
            return;
        }

        const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const left = viewport.scrollLeft;
        container.classList.toggle("is-at-start", left <= 2);
        container.classList.toggle("is-at-end", left >= max - 2);
    }

    /** Center on pins (average --x), fallback to map middle */
    function centerMap(instant = true) {
        if (!viewport || !media.matches) return;

        const xs = points
            .map((point) => {
                const item = point.closest(".map__points-item");
                const raw = item?.style.getPropertyValue("--x") || "";
                return parseFloat(raw);
            })
            .filter((n) => !Number.isNaN(n));

        const focusRatio = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length / 100 : 0.5;
        const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const target = Math.max(0, Math.min(max, viewport.scrollWidth * focusRatio - viewport.clientWidth / 2));

        if (instant) {
            const prev = viewport.style.scrollBehavior;
            viewport.style.scrollBehavior = "auto";
            viewport.scrollLeft = target;
            viewport.style.scrollBehavior = prev;
        } else {
            viewport.scrollTo({ left: target, behavior: "smooth" });
        }

        updateEdgeFades();
        return target;
    }

    /** Soft ease-in-out nudge: center → side → center */
    function playScrollHint() {
        if (hintPlayed || !viewport || !media.matches) return;
        hintPlayed = true;

        const center = centerMap(true);
        const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        if (max < 40) return;

        const amplitude = Math.min(72, max * 0.1);
        const duration = 1800;
        const start = performance.now();

        function frame(now) {
            const t = Math.min(1, (now - start) / duration);
            // Half-sine: gently out and back to center
            const wave = Math.sin(t * Math.PI);
            viewport.scrollLeft = Math.max(0, Math.min(max, center + amplitude * wave));
            updateEdgeFades();

            if (t < 1) requestAnimationFrame(frame);
            else {
                viewport.scrollLeft = center;
                updateEdgeFades();
            }
        }

        requestAnimationFrame(frame);
    }

    points.forEach((point) => {
        point.addEventListener("click", (e) => {
            e.stopPropagation();
            if (point === active && popup.classList.contains("is-open")) {
                close();
                return;
            }
            open(point);
        });
    });

    closeBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        close();
    });

    document.addEventListener("click", (e) => {
        if (!popup.classList.contains("is-open")) return;
        if (popup.contains(e.target) || e.target.closest("[data-map-point]")) return;
        close();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
    });

    if (viewport) {
        viewport.addEventListener("scroll", updateEdgeFades, { passive: true });
        window.addEventListener("resize", () => {
            centerMap(true);
            updateEdgeFades();
        });

        // Wait for SVG layout, then center + hint when section is visible
        requestAnimationFrame(() => {
            centerMap(true);
            updateEdgeFades();
        });

        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        centerMap(true);
                        updateEdgeFades();
                        window.setTimeout(playScrollHint, 280);
                        io.disconnect();
                    });
                },
                { threshold: 0.35 },
            );
            io.observe(section);
        } else {
            window.setTimeout(playScrollHint, 600);
        }
    }
}
