export function initVacancies() {
    const roots = document.querySelectorAll("[data-vacancies]");
    if (!roots.length) return;

    roots.forEach((root) => initOne(root));
}

const LIMIT = 5;

function initOne(root) {
    const list = root.querySelector("[data-vacancies-list]");
    const moreBtn = root.querySelector("[data-vacancies-more]");
    const moreWrap = moreBtn?.closest(".vacancies__more-wrap") || moreBtn?.parentElement;
    const deptBtns = [...root.querySelectorAll("[data-vacancy-department]")];
    const tagBtns = [...root.querySelectorAll("[data-vacancy-tag]")];

    if (!list) return;

    const cards = [...list.querySelectorAll("[data-vacancy-card]")];
    if (!cards.length) return;

    const state = {
        department: "all",
        tag: "all",
        expanded: false,
    };

    const activeDept = deptBtns.find((b) => b.classList.contains("is-active"));
    if (activeDept) state.department = activeDept.dataset.vacancyDepartment || "all";

    const activeTag = tagBtns.find((b) => b.classList.contains("is-active"));
    if (activeTag) state.tag = activeTag.dataset.vacancyTag || "all";

    let animating = false;

    function matches(card) {
        const dept = card.dataset.department || "";
        const tags = (card.dataset.tags || "").split(/\s+/).filter(Boolean);

        const deptOk = state.department === "all" || dept === state.department;
        const tagOk = state.tag === "all" || tags.includes(state.tag);

        return deptOk && tagOk;
    }

    function getVisiblePool() {
        return cards.filter(matches);
    }

    function applyVisibility() {
        const pool = getVisiblePool();
        const needMore = pool.length > LIMIT;
        const limit = state.expanded || !needMore ? pool.length : LIMIT;

        cards.forEach((card) => {
            const show = matches(card);
            card.classList.toggle("is-filtered-out", !show);
            card.hidden = !show;
            card.classList.remove("is-collapsed");
        });

        pool.forEach((card, index) => {
            const collapsed = index >= limit;
            card.classList.toggle("is-collapsed", collapsed);
            if (collapsed) card.hidden = true;
        });

        if (moreBtn) {
            const hideMore = !needMore;
            moreBtn.hidden = hideMore;
            if (moreWrap) moreWrap.hidden = hideMore;
            moreBtn.classList.toggle("is-expanded", state.expanded);
            moreBtn.setAttribute("aria-expanded", state.expanded ? "true" : "false");
            const label = moreBtn.querySelector("span:not(.arrow-icon)");
            if (label) {
                label.textContent = state.expanded ? "Згорнути" : "Дивитись більше";
            }
        }

        return { pool, needMore };
    }

    function render({ animate = false } = {}) {
        if (!animate || animating) {
            applyVisibility();
            list.style.height = "auto";
            list.style.overflow = "";
            return;
        }

        const startH = list.getBoundingClientRect().height;
        applyVisibility();

        list.style.height = `${startH}px`;
        list.style.overflow = "hidden";
        void list.offsetHeight;

        const endH = list.scrollHeight;

        if (Math.abs(endH - startH) < 1) {
            list.style.height = "auto";
            list.style.overflow = "";
            return;
        }

        animating = true;
        list.style.height = `${endH}px`;

        const onEnd = (e) => {
            if (e.target !== list || e.propertyName !== "height") return;
            list.style.height = "auto";
            list.style.overflow = "";
            animating = false;
            list.removeEventListener("transitionend", onEnd);
        };

        list.addEventListener("transitionend", onEnd);

        // Fallback if transitionend doesn't fire
        window.setTimeout(() => {
            if (!animating) return;
            list.style.height = "auto";
            list.style.overflow = "";
            animating = false;
            list.removeEventListener("transitionend", onEnd);
        }, 500);
    }

    deptBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const value = btn.dataset.vacancyDepartment || "all";
            if (value === state.department) return;

            state.department = value;
            state.expanded = false;

            deptBtns.forEach((b) => {
                const active = b === btn;
                b.classList.toggle("is-active", active);
                b.setAttribute("aria-pressed", active ? "true" : "false");
            });

            render({ animate: true });
        });
    });

    tagBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const value = btn.dataset.vacancyTag || "all";
            if (value === state.tag) return;

            state.tag = value;
            state.expanded = false;

            tagBtns.forEach((b) => {
                const active = b === btn;
                b.classList.toggle("is-active", active);
                b.setAttribute("aria-pressed", active ? "true" : "false");
            });

            render({ animate: true });
        });
    });

    moreBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        state.expanded = !state.expanded;
        render({ animate: true });
    });

    render({ animate: false });
}
