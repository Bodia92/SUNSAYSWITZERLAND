import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initScrollAnimations } from "./animations.js";

export function initLoader() {
    const loader = document.querySelector(".page-loader");
    const percentEl = document.querySelector(".page-loader__percent-value");
    const visual = document.querySelector(".page-loader__visual");
    const loaderLogo = document.querySelector(".page-loader__logo .logo-loader");

    // Елементи куди летимо / що показуємо
    const headerLogo =
        document.querySelector(".header__logo img") || document.querySelector(".header__logo");
    const header = document.querySelector(".header");
    const heroItems = document.querySelectorAll(
        ".hero__title-top, .hero__text-italic, .hero__subtitle, .hero__btn",
    );

    // --- 1. БЛОКУВАННЯ СКРОЛУ ---
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    document.documentElement.classList.add("lock-scroll");
    document.body.classList.add("lock-scroll");
    window.scrollTo(0, 0);

    const unlockScroll = () => {
        document.documentElement.classList.remove("lock-scroll");
        document.body.classList.remove("lock-scroll");
    };

    // --- 2. ПІДГОТОВКА СТАНУ (Ховаємо Hero) ---
    // Це гарантує, що при оновленні сторінки контент не мигне
    if (header) gsap.set(header, { autoAlpha: 0, y: -20 });
    if (heroItems.length) gsap.set(heroItems, { autoAlpha: 0, y: 30 });

    // Якщо лоадера немає (інша сторінка)
    if (!loader || !percentEl) {
        unlockScroll();
        if (header) gsap.set(header, { autoAlpha: 1, y: 0 });
        if (heroItems.length) gsap.set(heroItems, { autoAlpha: 1, y: 0 });
        initScrollAnimations();
        return;
    }

    // --- 3. АНІМАЦІЯ ---
    let progress = { value: 0 };

    const tl = gsap.timeline({
        onComplete: () => {
            loader.classList.add("is-hidden"); // CSS зробить visibility: hidden
            unlockScroll();
            initScrollAnimations();

            // Важливо: дати браузеру час на рендер перед refresh
            requestAnimationFrame(() => ScrollTrigger.refresh());
        },
    });

    // A) Лічильник
    tl.to(progress, {
        value: 100,
        duration: 2.0,
        ease: "power2.inOut",
        onUpdate: () => (percentEl.textContent = Math.round(progress.value)),
    });

    // B) Ховаємо текст лоадера
    tl.to(
        [".page-loader__title", ".page-loader__text"],
        {
            autoAlpha: 0, // opacity 0 + visibility hidden
            y: -30,
            duration: 0.5,
            ease: "power2.in",
        },
        "-=0.5",
    );

    // C) РОЗШИРЕННЯ КОЛА (Width/Height)
    // Рахуємо розмір, щоб покрити весь екран (діагональ)
    const finalSize = Math.max(window.innerWidth, window.innerHeight) * 1.5;

    tl.to(visual, {
        width: finalSize,
        height: finalSize,
        duration: 2,
        ease: "expo.inOut", // Ефект різкого, але плавного старту і фінішу
    });

    tl.to(
        ".page-loader__image",
        {
            autoAlpha: 0, // opacity: 0 + visibility: hidden
            duration: 1,
        },
        "-=0.5",
    );

    tl.to(
        ".logo-mountains",
        {
            autoAlpha: 0, // opacity: 0 + visibility: hidden
            duration: 1,
        },
        "-=0.5",
    );

    // В цей момент фон лоадера зникає, залишається тільки картинка
    tl.to(loader, { backgroundColor: "transparent", duration: 0.3 }, "<+=0.1");

    // D) Політ логотипа
    if (headerLogo && loaderLogo) {
        const startRect = loaderLogo.getBoundingClientRect();
        const endRect = headerLogo.getBoundingClientRect();

        const deltaX = endRect.left - startRect.left + (endRect.width / 2 - startRect.width / 2);
        const deltaY = endRect.top - startRect.top + (endRect.height / 2 - startRect.height / 2);

        tl.to(
            loaderLogo,
            {
                x: deltaX,
                y: deltaY,
                scale: 0.4, // Зменшуємо
                autoAlpha: 0, // Зникає в кінці
                duration: 1.0,
                ease: "power3.inOut",
            },
            "<",
        );
    } else {
        tl.to(loaderLogo, { autoAlpha: 0 }, "<");
    }

    // E) ПОЯВА КОНТЕНТУ (Header + Hero)
    // Хедер
    if (header) {
        tl.to(
            header,
            {
                autoAlpha: 1, // Плавно проявляємо
                y: 0, // Ставимо на місце
                duration: 0.8,
                ease: "power2.out",
            },
            "-=0.6",
        ); // Починаємо трохи раніше, ніж закінчиться розширення кола
    }

    // Б) Hero елементи виїжджають знизу (Stagger)
    if (heroItems.length) {
        tl.to(
            heroItems,
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15, // Затримка 0.15с між елементами
                ease: "power2.out",
            },
            "-=0.4",
        ); // Починаємо через 0.2с після хедера
    }

    tl.to(
        ".hero__aside",
        {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15, // Затримка 0.15с між елементами
            ease: "power2.out",
        },
        "-=0.5",
    );
}
