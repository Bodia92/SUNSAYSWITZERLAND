export function initVideoBannerControls() {
    // Шукаємо всі відео-банери (раптом їх буде кілька на сторінці)
    const videoBanners = document.querySelectorAll(".video-banner");

    videoBanners.forEach((banner) => {
        const video = banner.querySelector("video");
        const btn = banner.querySelector(".js-video-banner-btn");

        if (!video || !btn) return; // Базовий захист

        // 1. Логіка кліку (Тільки дає команду відео, ніяких класів не міняє)
        btn.addEventListener("click", () => {
            if (video.paused) {
                // play() повертає Promise, тому ловимо помилки (напр. якщо браузер блокує)
                video.play().catch((error) => {
                    console.warn("Video play failed:", error);
                });
            } else {
                video.pause();
            }
        });

        // 2. СИНХРОНІЗАЦІЯ UI: Слухаємо саме відео.
        // Це гарантує, що кнопка покаже правильну іконку, навіть якщо відео
        // зупинив сам браузер (наприклад, iOS у режимі економії заряду).

        video.addEventListener("play", () => {
            btn.classList.add("is-playing");
            btn.classList.remove("is-paused");
            btn.setAttribute("aria-label", "Pause video"); // Для скрінрідерів
        });

        video.addEventListener("pause", () => {
            btn.classList.add("is-paused");
            btn.classList.remove("is-playing");
            btn.setAttribute("aria-label", "Play video"); // Для скрінрідерів
        });

        // 3. Перевірка початкового стану (при завантаженні сторінки)
        // Робимо невелику затримку, щоб браузер встиг вирішити, чи дозволяє він autoplay
        setTimeout(() => {
            if (video.paused) {
                btn.classList.add("is-paused");
                btn.setAttribute("aria-label", "Play video");
            } else {
                btn.classList.add("is-playing");
                btn.setAttribute("aria-label", "Pause video");
            }
        }, 150);
    });
}
