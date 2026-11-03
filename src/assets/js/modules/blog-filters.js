/**
 * Insights listing filters — show/hide .blog-card by data-blog-category
 * + Insights slider filters on about (updates Swiper slides)
 */
export function initBlogFilters(root = document) {
    const sections = [...root.querySelectorAll("[data-blog-listing]")];
    sections.forEach((section) => setupFilters(section));

    const sliders = [...root.querySelectorAll("[data-insights-slider]")];
    sliders.forEach((section) => setupInsightsSliderFilters(section));
}

function setupFilters(section) {
    const buttons = [...section.querySelectorAll("[data-blog-filter]")];
    const cards = [...section.querySelectorAll(".blog-card[data-blog-category]")];
    if (!buttons.length || !cards.length) return;

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.blogFilter || "all";

            buttons.forEach((btn) => btn.classList.toggle("is-active", btn === button));

            cards.forEach((card) => {
                const match = filter === "all" || card.dataset.blogCategory === filter;
                card.hidden = !match;
            });
        });
    });
}

function setupInsightsSliderFilters(section) {
    const buttons = [...section.querySelectorAll("[data-insights-filter]")];
    const sliderEl = section.querySelector(".js-blog-slider");
    const slides = [...section.querySelectorAll(".swiper-slide")];
    if (!buttons.length || !slides.length) return;

    const applyFilter = (filter) => {
        slides.forEach((slide) => {
            const card = slide.querySelector(".blog-card[data-blog-category]");
            const category = card?.dataset.blogCategory || "";
            const match = filter === "all" || category === filter;
            slide.classList.toggle("is-filtered-out", !match);
        });

        const swiper = sliderEl?._insightsSwiper;
        if (swiper) {
            swiper.update();
            swiper.slideTo(0, 0);
        }
    };

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.insightsFilter || "all";
            buttons.forEach((btn) => btn.classList.toggle("is-active", btn === button));
            applyFilter(filter);
        });
    });
}
