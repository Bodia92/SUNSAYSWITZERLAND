export function initProjectsFilter() {
    const roots = document.querySelectorAll("[data-projects-filter]");
    if (!roots.length) return;

    roots.forEach((root) => initOne(root));
}

function initOne(root) {
    const trigger = root.querySelector("[data-filter-trigger]");
    const panel = root.querySelector("[data-filter-panel]");
    const list = root.querySelector("[data-filter-list]");
    const empty = root.querySelector("[data-filter-empty]");
    const resetBtn = root.querySelector("[data-filter-reset]");
    const items = [...root.querySelectorAll(".projects-page__item")];

    if (!trigger || !panel || !list || !items.length) return;

    const state = {
        location: "all",
        service: "all",
    };

    function isFiltered() {
        return state.location !== "all" || state.service !== "all";
    }

    function setOpen(open) {
        trigger.classList.toggle("is-active", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        panel.hidden = !open;
        panel.classList.toggle("is-open", open);
    }

    function applyFilter() {
        let visible = 0;

        items.forEach((item) => {
            const locationOk =
                state.location === "all" || item.dataset.location === state.location;
            const serviceOk =
                state.service === "all" || item.dataset.service === state.service;
            const match = locationOk && serviceOk;

            item.hidden = !match;
            item.classList.toggle("is-hidden", !match);
            if (match) visible += 1;
        });

        if (empty) empty.hidden = visible > 0;
        if (resetBtn) resetBtn.hidden = !isFiltered();
        trigger.classList.toggle("is-filtered", isFiltered());
    }

    function setChipActive(group, value) {
        const chips = root.querySelectorAll(`[data-filter-group="${group}"] [data-filter-value]`);
        chips.forEach((chip) => {
            chip.classList.toggle("is-active", chip.dataset.filterValue === value);
        });
    }

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        setOpen(panel.hidden);
    });

    panel.addEventListener("click", (e) => {
        const chip = e.target.closest("[data-filter-value]");
        if (!chip || !panel.contains(chip)) return;

        const group = chip.closest("[data-filter-group]")?.dataset.filterGroup;
        const value = chip.dataset.filterValue;
        if (!group || !value) return;

        state[group] = value;
        setChipActive(group, value);
        applyFilter();
    });

    resetBtn?.addEventListener("click", () => {
        state.location = "all";
        state.service = "all";
        setChipActive("location", "all");
        setChipActive("service", "all");
        applyFilter();
    });

    document.addEventListener("click", (e) => {
        if (panel.hidden) return;
        if (e.target.closest("[data-projects-filter] .projects-page__filter-wrap")) return;
        setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !panel.hidden) {
            setOpen(false);
            trigger.focus();
        }
    });
}
