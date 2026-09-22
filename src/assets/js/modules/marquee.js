{
    /* <div class="marquee">
        data-marquee: ініціалізує скрипт
        data-marquee-speed="60": швидкість у пікселях на секунду (опціонально, дефолт 50)
        data-marquee-space="30": відступ між елементами в пікселях (опціонально, дефолт 30)
        data-marquee-reverse: рух у зворотний бік (опціонально)
    <div class="marquee__content" data-marquee data-marquee-speed="60" data-marquee-space="40">

       Твої елементи (скільки завгодно)
        <img src="@img/brands/01.svg" alt="logo">
        <img src="@img/brands/02.svg" alt="logo">

    </div>
</div> */
}

export function initMarquee() {
    const marquees = document.querySelectorAll("[data-marquee]");

    if (!marquees.length) return;

    let windowWidth = window.innerWidth;

    const resizeObserver = new ResizeObserver(() => {
        // Оновлюємо тривалість лише при зміні ширини (не висоти при моб. скролі)
        if (window.innerWidth === windowWidth) return;
        windowWidth = window.innerWidth;
        marquees.forEach((wrapper) => calculateDuration(wrapper));
    });

    const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const track = entry.target.querySelector(".marquee-track");
            if (!track) return;
            track.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
        });
    });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    marquees.forEach((wrapper) => {
        buildMarquee(wrapper);

        if (wrapper.hasAttribute("data-marquee-reverse")) {
            wrapper.classList.add("is-reverse");
        }

        Promise.all(
            Array.from(wrapper.querySelectorAll("img")).map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = img.onerror = resolve;
                });
            }),
        ).then(() => {
            calculateDuration(wrapper);
            if (reducedMotion.matches) {
                const track = wrapper.querySelector(".marquee-track");
                if (track) track.style.animationPlayState = "paused";
            }
            wrapper.classList.add("is-initialized");
        });

        resizeObserver.observe(wrapper);
        intersectionObserver.observe(wrapper);
    });
}

function buildMarquee(wrapper) {
    if (wrapper.classList.contains("is-built")) return;
    wrapper.classList.add("is-built");

    const gap = parseFloat(wrapper.getAttribute("data-marquee-space")) || 0;

    const track = document.createElement("div");
    track.classList.add("marquee-track");

    const group = document.createElement("div");
    group.classList.add("marquee-group");
    group.style.gap = `${gap}px`;
    // padding-right = gap, щоб друга група стикувалась без ривка
    group.style.paddingRight = `${gap}px`;

    while (wrapper.firstChild) {
        if (wrapper.firstChild.nodeType === Node.TEXT_NODE && !wrapper.firstChild.textContent.trim()) {
            wrapper.removeChild(wrapper.firstChild);
            continue;
        }
        group.appendChild(wrapper.firstChild);
    }

    const originalChildren = Array.from(group.children);
    if (!originalChildren.length) return;

    // Дублюємо елементи всередині групи, поки стрічка не буде ширша за в’юпорт
    const minWidth = Math.max(window.innerWidth * 1.5, 600);
    let guard = 0;

    while (guard < 12) {
        // Тимчасово в DOM для вимірювання
        wrapper.appendChild(track);
        track.appendChild(group);
        const width = group.scrollWidth;
        track.removeChild(group);
        wrapper.removeChild(track);

        if (width >= minWidth && guard >= 1) break;

        originalChildren.forEach((child) => {
            group.appendChild(child.cloneNode(true));
        });
        guard += 1;
    }

    track.appendChild(group);

    const groupClone = group.cloneNode(true);
    groupClone.setAttribute("aria-hidden", "true");
    // Прибираємо фокус з клонованих лінків
    groupClone.querySelectorAll("a, button, [tabindex]").forEach((el) => {
        el.setAttribute("tabindex", "-1");
        if (el.tagName === "A") el.setAttribute("aria-hidden", "true");
    });
    track.appendChild(groupClone);

    wrapper.appendChild(track);
}

function calculateDuration(wrapper) {
    const track = wrapper.querySelector(".marquee-track");
    const group = wrapper.querySelector(".marquee-group");

    if (!track || !group) return;

    const speed = parseFloat(wrapper.getAttribute("data-marquee-speed")) || 50;
    const width = group.scrollWidth;

    if (width === 0) return;

    const duration = width / speed;
    wrapper.style.setProperty("--marquee-duration", `${duration}s`);
}
