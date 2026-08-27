export function initShowMore() {
    // 1. Знаходимо всі блоки з атрибутом data-showmore на сторінці
    const showMoreBlocks = document.querySelectorAll("[data-showmore]");

    // Якщо таких блоків немає - одразу припиняємо роботу скрипта (щоб не було помилок у консолі)
    if (!showMoreBlocks.length) return;

    // 2. Проходимося по кожному знайденому блоку окремо (щоб вони працювали незалежно)
    showMoreBlocks.forEach((block) => {
        // Шукаємо контент і кнопку тільки ВСЕРЕДИНІ поточного блоку
        const content = block.querySelector("[data-showmore-content]");
        const button = block.querySelector("[data-showmore-button]");

        // Якщо дизайнер забув додати клас контенту або кнопки - пропускаємо цей блок
        if (!content || !button) return;

        // Зчитуємо ліміт висоти з HTML (наприклад, 100). Якщо не вказано - беремо 150px
        const limitHeight = parseInt(block.dataset.showmore) || 150;

        // Змінна, що зберігає поточний стан (відкритий чи закритий)
        let isExpanded = false;

        // 3. Функція для перевірки висоти (запускається при старті та при зміні розміру вікна)
        const checkHeight = () => {
            // Тимчасово знімаємо обмеження висоти, щоб браузер показав реальну висоту всього тексту
            content.style.height = "auto";
            const fullHeight = content.scrollHeight;

            if (fullHeight > limitHeight) {
                // Якщо тексту багато - показуємо кнопку "Show more"
                button.removeAttribute("hidden");

                // Якщо блок наразі згорнутий, жорстко обрізаємо його по ліміту
                if (!isExpanded) {
                    content.style.height = `${limitHeight}px`;
                    content.style.overflow = "hidden";
                }
            } else {
                // Якщо тексту мало (влазить у ліміт) - ховаємо кнопку і показуємо весь текст
                button.setAttribute("hidden", "");
                content.style.height = "auto";
                content.style.overflow = "visible";
                block.classList.remove("_active");
                isExpanded = false;
            }
        };

        // 4. Обробник кліку по кнопці "Show more / Hide all"
        button.addEventListener("click", (e) => {
            e.preventDefault();
            isExpanded = !isExpanded; // Перемикаємо стан на протилежний

            // Додаємо/забираємо клас _active для CSS (щоб обернути стрілку і змінити текст кнопки)
            block.classList.toggle("_active", isExpanded);

            // Для доступності (скрінрідерів)
            button.setAttribute("aria-expanded", isExpanded);

            if (isExpanded) {
                // === ДІЯ: РОЗГОРТАННЯ ===
                // Задаємо точну висоту в пікселях, щоб спрацювала плавна CSS-анімація (transition)
                content.style.height = `${content.scrollHeight}px`;
            } else {
                // === ДІЯ: ЗГОРТАННЯ (ТУТ БУВ БАГ З НАКЛАДАННЯМ) ===

                // Крок А: оскільки зараз висота 'auto', задаємо їй точну висоту в пікселях
                content.style.height = `${content.scrollHeight}px`;

                // Крок Б: примусово змушуємо браузер перемалювати кадр. Без цього рядка анімації не буде!
                content.offsetHeight;

                // Крок В: НЕГАЙНО ховаємо зайвий текст, щоб він не вивалювався під час згортання
                content.style.overflow = "hidden";

                // Крок Г: Запускаємо плавну анімацію зменшення до ліміту
                content.style.height = `${limitHeight}px`;
            }
        });

        // 5. Відслідковуємо момент, коли CSS-анімація (transition) повністю завершилася
        content.addEventListener("transitionend", (e) => {
            // Реагуємо тільки на закінчення анімації висоти
            if (e.propertyName !== "height") return;

            // Коли блок ПОВНІСТЮ розгорнувся, скидаємо висоту в 'auto'
            // Це потрібно для того, щоб якщо користувач переверне телефон, текст перенісся і не обрізався знизу
            if (isExpanded) {
                content.style.height = "auto";
                content.style.overflow = "visible";
            }
        });

        // 6. Ініціалізуємо перевірку при завантаженні скрипта
        checkHeight();

        // 7. Обробка зміни розміру екрана (Debounce)
        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer); // Скидаємо таймер, поки користувач тягне вікно

            // Запускаємо перерахунок тільки через 150мс після того, як вікно перестали тягнути
            resizeTimer = setTimeout(() => {
                // Перераховуємо ліміти тільки якщо блок згорнутий
                // Якщо він розгорнутий - він має height: auto і сам підлаштується
                if (!isExpanded) {
                    checkHeight();
                }
            }, 150);
        });
    });
}
