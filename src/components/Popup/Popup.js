// попап логіка

import "./_popup.scss";

document.addEventListener("DOMContentLoaded", function () {
    const popupLinks = document.querySelectorAll("[data-popup-target]");
    const body = document.querySelector("body");
    const lockPadding = document.querySelectorAll(".lock-padding");

    let unlock = true;
    const timeout = 300;

    // --- ПУБЛІЧНІ ФУНКЦІЇ (доступні для бекенда) ---

    // Функція відкриття (приймає ID, клас або сам елемент)
    window.popupOpen = function (curentPopup) {
        // Якщо передали рядок (наприклад '#popup-success'), знаходимо елемент
        if (curentPopup && typeof curentPopup === "string") {
            curentPopup = document.querySelector(curentPopup);
        }

        if (curentPopup && unlock) {
            const popupActive = document.querySelector(".popup.is-open");
            if (popupActive) {
                popupClose(popupActive, false);
            } else {
                bodyLock();
            }
            curentPopup.classList.add("is-open");
            curentPopup.setAttribute("aria-hidden", "false");

            // Подія кліку на затемнення
            curentPopup.addEventListener("click", function (e) {
                if (!e.target.closest(".popup__content")) {
                    popupClose(e.target.closest(".popup"));
                }
            });
        }
    };

    // Функція закриття
    window.popupClose = function (popupActive, doUnlock = true) {
        // Якщо нічого не передали, закриваємо активний
        if (!popupActive) {
            popupActive = document.querySelector(".popup.is-open");
        }
        // Якщо передали селектор рядком
        if (popupActive && typeof popupActive === "string") {
            popupActive = document.querySelector(popupActive);
        }

        if (unlock && popupActive) {
            if (document.activeElement && popupActive.contains(document.activeElement)) {
                document.activeElement.blur();
            }

            popupActive.classList.remove("is-open");
            popupActive.setAttribute("aria-hidden", "true");
            if (doUnlock) {
                bodyUnLock();
            }
        }
    };

    // --- ВНУТРІШНЯ ЛОГІКА ---

    // Кліки по кнопках [data-popup-target]
    if (popupLinks.length > 0) {
        for (let index = 0; index < popupLinks.length; index++) {
            const popupLink = popupLinks[index];
            popupLink.addEventListener("click", function (e) {
                const popupName =
                    popupLink.getAttribute("data-popup-target") || popupLink.getAttribute("href");
                const curentPopup = document.querySelector(popupName);
                window.popupOpen(curentPopup);
                e.preventDefault();
            });
        }
    }

    // Кнопки закриття [data-close-popup]
    const popupCloseIcon = document.querySelectorAll("[data-close-popup]");
    if (popupCloseIcon.length > 0) {
        for (let index = 0; index < popupCloseIcon.length; index++) {
            const el = popupCloseIcon[index];
            el.addEventListener("click", function (e) {
                window.popupClose(el.closest(".popup"));
                e.preventDefault();
            });
        }
    }

    function bodyLock() {
        const lockPaddingValue = window.innerWidth - document.documentElement.clientWidth + "px";
        if (lockPadding.length > 0) {
            for (let index = 0; index < lockPadding.length; index++) {
                const el = lockPadding[index];
                el.style.paddingRight = lockPaddingValue;
            }
        }
        body.style.paddingRight = lockPaddingValue;
        body.classList.add("lock");

        unlock = false;
        setTimeout(function () {
            unlock = true;
        }, timeout);
    }

    function bodyUnLock() {
        setTimeout(function () {
            if (lockPadding.length > 0) {
                for (let index = 0; index < lockPadding.length; index++) {
                    const el = lockPadding[index];
                    el.style.paddingRight = "0px";
                }
            }
            body.style.paddingRight = "0px";
            body.classList.remove("lock");
        }, timeout);

        unlock = false;
        setTimeout(function () {
            unlock = true;
        }, timeout);
    }

    document.addEventListener("keydown", function (e) {
        if (e.which === 27) {
            const popupActive = document.querySelector(".popup.is-open");
            window.popupClose(popupActive);
        }
    });
});

document.addEventListener("wpcf7mailsent", function () {
    if (typeof window.popupOpen === "function") {
        window.popupOpen("#popup-success");
    }
});

document.addEventListener("wpcf7mailfailed", function () {
    if (typeof window.popupOpen === "function") {
        window.popupOpen("#popup-error");
    }
});
// скрол бар ширина
function setScrollbarWidth() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);
}

window.addEventListener("resize", setScrollbarWidth);
window.addEventListener("load", setScrollbarWidth);
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setScrollbarWidth);
} else {
    setScrollbarWidth();
}
