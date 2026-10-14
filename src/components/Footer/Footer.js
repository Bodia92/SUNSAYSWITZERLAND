export default class Footer {
    constructor() {
        const year = String(new Date().getFullYear());
        document.querySelectorAll("[data-year]").forEach((el) => {
            el.textContent = year;
        });
    }
}
