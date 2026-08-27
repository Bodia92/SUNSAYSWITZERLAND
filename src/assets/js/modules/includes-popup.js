const POPUP_ID = "#includes-popup";

function fillIncludesPopup(card) {
    const popup = document.querySelector(POPUP_ID);
    if (!popup || !card) return false;

    const title = card.dataset.includesTitle || card.querySelector(".includes-card__title")?.textContent?.trim() || "";
    const lead = card.dataset.includesLead || "";
    const text = card.dataset.includesText || "";
    const image = card.querySelector(".includes-card__media img")?.getAttribute("src") || "";

    const titleEl = popup.querySelector("[data-includes-popup-title]");
    const leadEl = popup.querySelector("[data-includes-popup-lead]");
    const textEl = popup.querySelector("[data-includes-popup-text]");
    const imageEl = popup.querySelector("[data-includes-popup-image]");

    if (titleEl) titleEl.textContent = title;
    if (leadEl) leadEl.textContent = lead;
    if (textEl) textEl.textContent = text;

    if (imageEl) {
        imageEl.src = image;
        imageEl.alt = title;
    }

    return true;
}

export function initIncludesPopup() {
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-includes-open]");
        if (!trigger) return;

        e.preventDefault();

        const card = trigger.closest(".includes-card");
        if (!card || !fillIncludesPopup(card)) return;

        if (typeof window.popupOpen === "function") {
            window.popupOpen(POPUP_ID);
        }
    });
}
