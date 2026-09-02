import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// data-anim="fade-up"
// data-anim="fade-down"
// data-anim="fade-left"
// data-anim="fade-right"
// data-anim="scale"
// data-anim="reveal-up"
// data-anim-delay="0.5"
// data-anim-stagger="true"

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations() {
    const animElements = document.querySelectorAll("[data-anim]");

    animElements.forEach((el) => {
        if (el.closest(".hero")) return;

        const type = el.getAttribute("data-anim");
        const delay = parseFloat(el.getAttribute("data-anim-delay")) || 0;

        // ЗВІДКИ анімуємо (початковий стан)
        let fromVars = {
            autoAlpha: 0,
            duration: 1,
            ease: "power3.out", // power3 виглядає більш плавно для виїздів
            delay: delay,
        };

        // КУДИ анімуємо (кінцевий стан)
        let toVars = {
            autoAlpha: 1,
            y: 0,
            x: 0,
            scale: 1,
            scrollTrigger: {
                trigger: el,
                // Старт, щойно елемент з'являється знизу екрана,
                // щоб контент одразу за hero анімувався без скролу
                start: "top bottom",
                toggleActions: "play none none none",
                once: true,
            },
        };

        switch (type) {
            case "fade-up":
                fromVars.y = 50;
                break;
            case "fade-down":
                fromVars.y = -50;
                break;
            case "fade-left":
                fromVars.x = -100;
                break;
            case "fade-right":
                fromVars.x = 100;
                break;
            case "scale":
                fromVars.scale = 0;
                break;
            case "scale-y":
                fromVars.scaleY = 0;
                break;
            case "reveal-up":
                fromVars.y = "30px"; // невеликий зсув вниз для природності
                fromVars.autoAlpha = 1;
                fromVars.clipPath = "inset(100% 0% 0% 0%)"; // ховаємо знизу
                toVars.clipPath = "inset(0% 0% 0% 0%)"; // відкриваємо повністю
                break;
        }

        // Запуск анімації
        gsap.fromTo(el, fromVars, toVars);
    });

    // ... (Тут залишається твій код для data-anim-stagger без змін) ...
    const staggerContainers = document.querySelectorAll("[data-anim-stagger]");

    staggerContainers.forEach((container) => {
        const children = container.children;

        gsap.fromTo(
            children,
            { autoAlpha: 0, y: 30 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 1,
                ease: "power2.out",
                stagger: 0.15,
                scrollTrigger: {
                    trigger: container,
                    start: "top bottom",
                    once: true,
                },
            },
        );
    });

    // Перерахунок позицій після того, як зображення/шрифти змінили висоту сторінки,
    // інакше тригери можуть спрацьовувати не там, де треба
    ScrollTrigger.refresh();
}
