/**
 * Вираховує реальну висоту вьюпорта на мобільних,
 * ігноруючи адресний рядок браузера.
 * Записує значення в CSS змінну --vh
 */
export function fixMobileVh() {
    const setVh = () => {
        // Беремо 1% від внутрішньої висоти вікна
        const vh = window.innerHeight * 0.01;
        // Записуємо в рут змінну
        document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Викликаємо одразу
    setVh();

    // Оновлюємо тільки при зміні орієнтації або сильному ресайзі
    // (на мобільних resize може спрацьовувати при скролі через приховання бару,
    // тому краще перевіряти ширину, щоб не було скачків)
    let width = window.innerWidth;

    window.addEventListener("resize", () => {
        if (window.innerWidth !== width) {
            width = window.innerWidth;
            setVh();
        }
    });
}
