export function initFaqShowMore() {
    const faqSection = document.querySelector(".faq");
    if (!faqSection) return;

    const items = faqSection.querySelectorAll(".faq__item");
    const btn = faqSection.querySelector(".js-show-more-btn");
    const LIMIT = 5;

    // 1. Перевірка: Якщо елементів мало, кнопка не потрібна
    if (items.length <= LIMIT) {
        if (btn) btn.style.display = "none";
        return;
    }

    // 2. Ініціалізація: Ховаємо всі елементи після 5-го
    items.forEach((item, index) => {
        if (index >= LIMIT) {
            item.classList.add("is-hidden");
        }
    });

    // 3. Подія кліку
    if (btn) {
        btn.addEventListener("click", () => {
            // Показуємо приховані елементи
            items.forEach((item) => {
                if (item.classList.contains("is-hidden")) {
                    item.classList.remove("is-hidden");
                }
            });

            // Ховаємо кнопку, бо всі елементи показані
            btn.style.display = "none";
        });
    }
}
