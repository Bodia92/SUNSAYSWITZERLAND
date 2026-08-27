export default class Footer {
    constructor() {
        const yearEl = document.querySelector("[data-year]");
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }
}
