/**
 * FAQ "Show more" — show first 5 items; button only if total > 5
 */
const FAQ_VISIBLE = 5;

export function initFaqMore(root = document) {
    const sections = [...root.querySelectorAll("[data-faq]")];

    sections.forEach((section) => {
        const button = section.querySelector("[data-faq-more]");
        const actions = button?.closest(".faq__actions") || button?.parentElement;
        const items = [...section.querySelectorAll(".faq__item")];
        const label = button?.querySelector("[data-faq-more-label]");

        if (!button) return;

        // ≤5 items — no "Show more"
        if (items.length <= FAQ_VISIBLE) {
            items.forEach((item) => {
                item.hidden = false;
                item.classList.remove("faq__item--extra");
            });
            button.setAttribute("hidden", "");
            actions?.setAttribute("hidden", "");
            return;
        }

        const extras = items.slice(FAQ_VISIBLE);
        extras.forEach((item) => {
            item.classList.add("faq__item--extra");
            item.hidden = true;
        });

        button.removeAttribute("hidden");
        actions?.removeAttribute("hidden");

        let expanded = false;

        button.addEventListener("click", () => {
            expanded = !expanded;
            button.classList.toggle("is-open", expanded);
            button.setAttribute("aria-expanded", String(expanded));

            extras.forEach((item) => {
                if (expanded) {
                    item.hidden = false;
                } else {
                    item.hidden = true;
                    item.classList.remove("is-open");
                    const trigger = item.querySelector(".js-faq-trigger");
                    const body = item.querySelector(".js-faq-body");
                    trigger?.classList.remove("is-active");
                    trigger?.setAttribute("aria-expanded", "false");
                    if (body) body.style.maxHeight = null;
                }
            });

            if (label) {
                label.textContent = expanded ? "Show less" : "Show more";
            }
        });
    });
}
