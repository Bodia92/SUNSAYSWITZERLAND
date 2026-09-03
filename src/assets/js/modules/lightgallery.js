import lightGallery from "lightgallery";
import lgThumbnail from "lightgallery/plugins/thumbnail/lg-thumbnail.min.js";
import lgZoom from "lightgallery/plugins/zoom/lg-zoom.min.js";
import lgVideo from "lightgallery/plugins/video/lg-video.min.js"; // ОБОВ'ЯЗКОВО для відео!
// --- Плагіни (Логіка) ---
// import lgThumbnail from "lightgallery/plugins/thumbnail/lg-thumbnail.min.js"; // Мініатюри внизу
// import lgZoom from "lightgallery/plugins/zoom/lg-zoom.min.js";                // Збільшення/зменшення фото (лупа)
// import lgVideo from "lightgallery/plugins/video/lg-video.min.js";             // Підтримка YouTube, Vimeo, MP4
// import lgAutoplay from "lightgallery/plugins/autoplay/lg-autoplay.min.js";    // Слайдшоу (автоматичне перемикання)
// import lgFullscreen from "lightgallery/plugins/fullscreen/lg-fullscreen.min.js"; // Розгортання на весь екран браузера
// import lgHash from "lightgallery/plugins/hash/lg-hash.min.js";                // Додає #id-слайду в URL (для прямих посилань на фото)
// import lgPager from "lightgallery/plugins/pager/lg-pager.min.js";             // Крапочки-пагінація (як у звичайних слайдерах)
// import lgShare from "lightgallery/plugins/share/lg-share.min.js";             // Кнопки "Поділитися" (FB, Twitter, Pinterest)
// import lgRotate from "lightgallery/plugins/rotate/lg-rotate.min.js";          // Поворот картинки на 90 градусів

import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-thumbnail.css";
import "lightgallery/css/lg-video.css"; // ОБОВ'ЯЗКОВО стилі для відео!
// import "lightgallery/css/lg-thumbnail.css";
// import "lightgallery/css/lg-zoom.css";
// import "lightgallery/css/lg-video.css";
// import "lightgallery/css/lg-autoplay.css";
// import "lightgallery/css/lg-fullscreen.css";
// import "lightgallery/css/lg-pager.css";
// import "lightgallery/css/lg-share.css";
// import "lightgallery/css/lg-rotate.css";
// import "lightgallery/css/lg-transitions.css"; // Додаткові красиві анімації переходу
const KEY = "7EC452A9-0CFD441C-BD984C7C-17C8456E";

export function initGallery() {
    const galleries = document.querySelectorAll("[data-gallery]");

    if (galleries.length) {
        galleries.forEach((gallery) => {
            lightGallery(gallery, {
                licenseKey: KEY,
                speed: 500, // Швидкість анімації переходу між слайдами (мс)

                selector: ".js-gallery-link", // Що саме клікаємо всередині контейнера (клас або тег)
                mode: "lg-slide", // Тип анімації (lg-slide, lg-fade, lg-zoom-in та ін. якщо підключено lg-transitions.css)
                // 3. Підключаємо плагін відео
                plugins: [lgZoom, lgThumbnail, lgVideo],
                counter: false, // Показувати лічильник "1/4" (true/false)
                // Налаштування мініатюр
                thumbnail: true,
                download: false, // Показувати кнопку "Скачати" (true/false)
                // Налаштування для відео (щоб грало автоматично при відкритті)
                autoplayVideoOnSlide: true,
                gotoNextSlideOnVideoEnd: false,
                closable: true, // Чи закривати галерею при кліку на темний фон (true/false)
                hideBarsDelay: 3000, // Через скільки мс бездіяльності ховати кнопки управління (0 - ніколи не ховати)
                //swipeThreshold: 50,          // Довжина свайпу для перемикання на мобільних (в пікселях)
                //backdropDuration: 300,       // Швидкість появи темного фону при відкритті

                // =========================================================
                // ПІДКЛЮЧЕННЯ ПЛАГІНІВ (Перелічити ті, що імпортовані зверху)
                // =========================================================
                // plugins: [lgThumbnail, lgZoom, lgVideo, lgAutoplay, lgFullscreen, lgHash, lgPager, lgShare, lgRotate],

                // =========================================================
                // НАЛАШТУВАННЯ МІНІАТЮР (lgThumbnail)
                // =========================================================
                // thumbnail: true,             // Увімкнути/вимкнути
                // animateThumb: true,          // Анімація прокрутки мініатюр
                // toggleThumb: true,           // Кнопка, щоб сховати/показати мініатюри
                // thumbWidth: 100,             // Ширина однієї мініатюри (px)
                // thumbHeight: "80px",         // Висота мініатюри
                // thumbMargin: 5,              // Відстань між мініатюрами (px)

                // =========================================================
                // НАЛАШТУВАННЯ ЗУМУ (lgZoom)
                // =========================================================
                // zoom: true,                  // Увімкнути/вимкнути
                // scale: 1,                    // Початковий масштаб зуму по кліку
                // actualSize: true,            // Кнопка "Оригінальний розмір 1:1"

                // =========================================================
                // НАЛАШТУВАННЯ ВІДЕО (lgVideo)
                // =========================================================
                // autoplayVideoOnSlide: true,  // Автоматично запускати відео, коли до нього догортали
                // gotoNextSlideOnVideoEnd: false,// Автоматично перемикати на наступний фото/відео після завершення відео
                // videojs: false,              // Якщо використовуєте плеєр Video.js замість стандартного HTML5

                // =========================================================
                // НАЛАШТУВАННЯ СЛАЙДШОУ (lgAutoplay)
                // =========================================================
                // autoplay: true,              // Автозапуск слайдшоу одразу після відкриття
                // pause: 5000,                 // Затримка між слайдами (5 секунд)
                // progressBar: true,           // Показувати лінію прогресу слайдшоу зверху
                // autoplayControls: true,      // Кнопка Play/Pause на панелі

                // =========================================================
                // НАЛАШТУВАННЯ HASH (lgHash) URL-посилання
                // =========================================================
                // hash: true,                  // Змінювати URL при гортанні (напр. site.com/#lg=1&slide=2)
                // galleryId: "1",              // Унікальний ID для URL (корисно, якщо кілька галерей на сторінці)

                // =========================================================
                // МОБІЛЬНІ НАЛАШТУВАННЯ (Перевизначення)
                // =========================================================

                mobileSettings: {
                    controls: false,
                    showCloseIcon: true,
                    download: false,
                },
            });
        });
    }

    document.querySelectorAll("[data-gallery-more]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            event.preventDefault();

            const root =
                btn.closest("[data-gallery-root]") ||
                btn.closest(".gallery") ||
                btn.closest("[data-tabs-panel]");
            const viewport = root?.querySelector(".gallery__viewport");
            const list = root?.querySelector("[data-gallery]");

            root?.classList.add("is-expanded");
            viewport?.classList.add("is-expanded");
            list?.classList.add("is-expanded");
            btn.hidden = true;
        });
    });
}
