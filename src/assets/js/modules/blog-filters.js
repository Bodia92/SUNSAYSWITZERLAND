/**
 * Insights listing filters — show/hide .blog-card by data-blog-category
 */
export function initBlogFilters(root = document) {
    const sections = [...root.querySelectorAll("[data-blog-listing]")];
    sections.forEach((section) => setupFilters(section));
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
