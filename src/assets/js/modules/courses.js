const POPUP_ID = "#course-popup";
const LIMIT = 4;

function fillCoursePopup(card) {
    const popup = document.querySelector(POPUP_ID);
    if (!popup || !card) return false;

    const title = card.querySelector(".course-card__title")?.textContent?.trim() || "";
    const badge = card.querySelector(".course-card__badge")?.textContent?.trim() || "";
    const price = card.dataset.coursePrice || "";
    const text = card.dataset.courseText || "";
    const image = card.querySelector(".course-card__media img")?.getAttribute("src") || "";

    const titleEl = popup.querySelector("[data-course-popup-title]");
    const badgeEl = popup.querySelector("[data-course-popup-badge]");
    const priceEl = popup.querySelector("[data-course-popup-price]");
    const textEl = popup.querySelector("[data-course-popup-text]");
    const imageEl = popup.querySelector("[data-course-popup-image]");

    if (titleEl) titleEl.textContent = title;
    if (badgeEl) {
        badgeEl.textContent = badge;
        badgeEl.hidden = !badge;
    }
    if (priceEl) priceEl.textContent = price;
    if (textEl) textEl.textContent = text;

    if (imageEl) {
        imageEl.src = image;
        imageEl.alt = title;
    }

    return true;
}

export function initCourses() {
    const root = document.querySelector(".courses");
    if (!root) return;

    const cards = [...root.querySelectorAll(".course-card")];
    const filters = [...root.querySelectorAll("[data-course-filter]")];
    const moreBtn = root.querySelector("[data-courses-more]");

    let filter = "all";
    let expanded = false;

    function matchingCards() {
        return cards.filter((card) => filter === "all" || card.dataset.courseCat === filter);
    }

    function render() {
        const visible = matchingCards();

        cards.forEach((card) => {
            card.hidden = true;
        });

        visible.forEach((card, index) => {
            card.hidden = !expanded && index >= LIMIT;
        });

        if (moreBtn) {
            moreBtn.hidden = expanded || visible.length <= LIMIT;
        }
    }

    filters.forEach((btn) => {
        btn.addEventListener("click", () => {
            filter = btn.dataset.courseFilter || "all";
            expanded = false;
            filters.forEach((item) => item.classList.toggle("is-active", item === btn));
            render();
        });
    });

    moreBtn?.addEventListener("click", () => {
        expanded = true;
        render();
    });

    root.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-course-open]");
        if (!trigger) return;

        e.preventDefault();

        const card = trigger.closest(".course-card");
        if (!card || !fillCoursePopup(card)) return;

        if (typeof window.popupOpen === "function") {
            window.popupOpen(POPUP_ID);
        }
    });

    render();
}
