{
    /* <div class="marquee">
        data-marquee: ініціалізує скрипт
        data-marquee-speed="60": швидкість у пікселях на секунду (опціонально, дефолт 50)
        data-marquee-space="30": відступ між елементами в пікселях (опціонально, дефолт 30)
    <div class="marquee__content" data-marquee data-marquee-speed="60" data-marquee-space="40">
        
       Твої елементи (скільки завгодно) 
        <img src="@img/brands/01.svg" alt="logo">
        <img src="@img/brands/02.svg" alt="logo">
        <img src="@img/brands/03.svg" alt="logo">
        <img src="@img/brands/04.svg" alt="logo">
        
      Можна вставляти не тільки картинки, а й блоки 
        <div class="item">Text</div> 

    </div>
</div> */
}

export function initMarquee() {
    const marquees = document.querySelectorAll("[data-marquee]");

    if (!marquees.length) return;

    // Зберігаємо попередню ширину екрану для перевірки
    let windowWidth = window.innerWidth;

    const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
            // ФІКС 1: Оновлюємо тривалість ТІЛЬКИ якщо змінилася ШИРИНА екрану (наприклад, перевернули телефон).
            // Ігноруємо зміну висоти при скролі на мобільних!
            if (window.innerWidth !== windowWidth) {
                windowWidth = window.innerWidth;
                calculateDuration(entry.target);
            }
        });
    });

    const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            // ФІКС 2: Ставити на паузу треба трек, а не обгортку, бо анімація висить на треку!
            const track = entry.target.querySelector(".marquee-track");
            if (track) {
                if (entry.isIntersecting) {
                    track.style.animationPlayState = "running";
                } else {
                    track.style.animationPlayState = "paused";
                }
            }
        });
    });

    marquees.forEach((wrapper) => {
        buildMarquee(wrapper);

        // Чекаємо завантаження картинок, щоб правильно порахувати ширину
        Promise.all(
            Array.from(wrapper.querySelectorAll("img")).map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = img.onerror = resolve;
                });
            }),
        ).then(() => {
            calculateDuration(wrapper);
            wrapper.classList.add("is-initialized"); // Показуємо тільки коли все готово
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
    // ФІКС 3: Забираємо gap з треку, він тут ламає математику -50%
    // track.style.gap = `${gap}px`;

    const group = document.createElement("div");
    group.classList.add("marquee-group");
    group.style.gap = `${gap}px`;

    // ФІКС 4: Додаємо padding-right рівний gap, щоб друга група приклеїлась ідеально рівно
    group.style.paddingRight = `${gap}px`;

    while (wrapper.firstChild) {
        group.appendChild(wrapper.firstChild);
    }

    const originalChildren = Array.from(group.children);
    const fragment = document.createDocumentFragment();

    const minWidth = window.innerWidth * 1.5;
    let currentWidth = 0;
    let cloneCount = 0;

    // Створюємо достатньо клонів
    while (cloneCount < 2 || currentWidth < minWidth) {
        originalChildren.forEach((child) => {
            fragment.appendChild(child.cloneNode(true));
            currentWidth += 150 + gap; // Приблизна ширина, цього достатньо
        });
        cloneCount++;
    }
    group.appendChild(fragment);
    track.appendChild(group);

    const groupClone = group.cloneNode(true);
    groupClone.setAttribute("aria-hidden", "true");
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
