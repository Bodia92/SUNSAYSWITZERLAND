/**
 * "We are present in" map — open contact popup on pin click
 */
export function initPresentMap(root = document) {
    const sections = [...root.querySelectorAll("[data-present-map]")];
    sections.forEach((section) => setupMap(section));
}

function setupMap(section) {
    const canvas = section.querySelector(".map__canvas");
    const popup = section.querySelector("[data-map-popup]");
    const points = [...section.querySelectorAll("[data-map-point]")];
    if (!canvas || !popup || !points.length) return;

    const closeBtn = popup.querySelector("[data-map-close]");
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
}
