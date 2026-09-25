import Accordion from "./accordion.js";

export function initCatalogListing() {
    const roots = document.querySelectorAll("[data-catalog-listing]");
    if (!roots.length) return;

    roots.forEach((root) => initOne(root));
}

function initOne(root) {
    const filters = root.querySelector("[data-catalog-filters]");
    const form = root.querySelector("[data-catalog-filters-form]");
    const overlay = root.querySelector("[data-catalog-filters-overlay]");
    const openBtn = root.querySelector("[data-catalog-filters-open]");
    const closeBtns = root.querySelectorAll("[data-catalog-filters-close]");
    const sortRoot = root.querySelector("[data-catalog-sort]");

    if (!filters) return;

    new Accordion(".js-catalog-filter", {
        triggerSelector: ".js-catalog-filter-trigger",
        bodySelector: ".js-catalog-filter-body",
        oneOpen: false,
    });

    initChosenPlacement(root);
    initFilterSearch(filters);
    initDrawer({ root, filters, overlay, openBtn, closeBtns });
    initChips({ root, form });
    initSort(sortRoot);

    form?.addEventListener("submit", (e) => {
        if (form.getAttribute("action") === "#" || !form.getAttribute("action")) {
            e.preventDefault();
        }
        closeDrawer(root, overlay);
    });

    form?.addEventListener("reset", () => {
        window.setTimeout(() => {
            const chosen = root.querySelector("[data-catalog-chosen]");
            syncChipsFromForm(form, chosen);
            filters.querySelectorAll("[data-catalog-filter-search]").forEach((input) => {
                input.value = "";
                input.dispatchEvent(new Event("input", { bubbles: true }));
            });
        }, 0);
    });
}

function initChosenPlacement(root) {
    const chosen = root.querySelector("[data-catalog-chosen]");
    const desktop = root.querySelector("[data-catalog-chosen-desktop]");
    const mobile = root.querySelector("[data-catalog-chosen-mobile]");
    if (!chosen || !desktop || !mobile) return;

    const mq = window.matchMedia("(max-width: 991.98px)");

    function place() {
        if (mq.matches) {
            if (chosen.parentElement !== mobile) mobile.appendChild(chosen);
        } else if (chosen.parentElement !== desktop) {
            desktop.appendChild(chosen);
        }
    }

    place();
    mq.addEventListener("change", place);
}

function initFilterSearch(filters) {
    filters.querySelectorAll("[data-catalog-filter-search]").forEach((input) => {
        const group = input.closest(".js-catalog-filter");
        const list = group?.querySelector("[data-catalog-filter-list]");
        if (!list) return;

        const items = [...list.querySelectorAll("li")];

        input.addEventListener("input", () => {
            const q = input.value.trim().toLowerCase();

            items.forEach((li) => {
                const text = li.textContent.trim().toLowerCase();
                li.hidden = Boolean(q) && !text.includes(q);
            });

            if (group?.classList.contains("is-open")) {
                const body = group.querySelector(".js-catalog-filter-body");
                if (body && body.style.maxHeight && body.style.maxHeight !== "none") {
                    body.style.maxHeight = `${body.scrollHeight}px`;
                }
            }
        });
    });
}

function initDrawer({ root, filters, overlay, openBtn, closeBtns }) {
    const mq = window.matchMedia("(max-width: 991.98px)");

    function open() {
        if (!mq.matches) return;
        root.classList.add("is-filters-open");
        document.body.classList.add("is-catalog-filters-open");
        if (overlay) overlay.hidden = false;
        openBtn?.setAttribute("aria-expanded", "true");
    }

    function close() {
        closeDrawer(root, overlay);
        openBtn?.setAttribute("aria-expanded", "false");
    }

    openBtn?.setAttribute("aria-expanded", "false");
    openBtn?.addEventListener("click", open);
    closeBtns.forEach((btn) => btn.addEventListener("click", close));
    overlay?.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && root.classList.contains("is-filters-open")) {
            close();
            openBtn?.focus();
        }
    });

    mq.addEventListener("change", (e) => {
        if (!e.matches) close();
    });
}

function closeDrawer(root, overlay) {
    root.classList.remove("is-filters-open");
    document.body.classList.remove("is-catalog-filters-open");
    if (overlay) {
        window.setTimeout(() => {
            if (!root.classList.contains("is-filters-open")) overlay.hidden = true;
        }, 300);
    }
}

function initChips({ root, form }) {
    if (!form) return;

    root.addEventListener("click", (e) => {
        const chip = e.target.closest("[data-chip-remove]");
        if (chip) {
            const chosen = chip.closest("[data-catalog-chosen]");
            if (!chosen || !root.contains(chosen)) return;

            const group = chip.dataset.chipGroup;
            const value = chip.dataset.chipValue;
            if (!group || value == null) return;

            const name = `${group}[]`;
            const input = form.querySelector(
                `input[name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`,
            );
            if (input) {
                input.checked = false;
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }

            chip.closest("li")?.remove();
            updateChosenVisibility(chosen);
            return;
        }

        const clearBtn = e.target.closest("[data-catalog-clear]");
        if (!clearBtn || !root.contains(clearBtn)) return;

        const chosen = clearBtn.closest("[data-catalog-chosen]");
        form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
            input.checked = false;
        });
        form.querySelectorAll('input[type="number"]').forEach((input) => {
            input.value = "0";
        });
        chosen?.querySelector(".catalog-listing__chips")?.replaceChildren();
        if (chosen) updateChosenVisibility(chosen);
    });
}

function syncChipsFromForm(form, chosen) {
    if (!form || !chosen) return;

    const chips = chosen.querySelector(".catalog-listing__chips");
    if (!chips) return;

    chips.replaceChildren();

    form.querySelectorAll('input[type="checkbox"]:checked').forEach((input) => {
        const label = input
            .closest("label")
            ?.querySelector(".catalog-filters__check-text")
            ?.textContent.trim();
        const name = (input.name || "").replace(/\[\]$/, "");
        if (!label || !name) return;

        const li = document.createElement("li");
        li.innerHTML = `
            <button type="button" class="catalog-listing__chip" data-chip-remove data-chip-group="${name}" data-chip-value="${input.value}">
                <span>${escapeHtml(label)}</span>
                <svg class="icon" width="12" height="12" aria-hidden="true"><use href="#icon-close"></use></svg>
            </button>
        `;
        const btn = li.querySelector("button");
        const iconUse = btn?.querySelector("use");
        if (iconUse) {
            iconUse.setAttribute("href", `${getSpriteHref()}#icon-close`);
        }
        chips.appendChild(li);
    });

    updateChosenVisibility(chosen);
}

function getSpriteHref() {
    const existing = document.querySelector('svg use[href*="sprite.svg"]');
    const href = existing?.getAttribute("href") || existing?.getAttribute("xlink:href") || "";
    const idx = href.indexOf("#");
    return idx > 0 ? href.slice(0, idx) : "@img/sprite.svg";
}

function updateChosenVisibility(chosen) {
    const hasChips = Boolean(chosen.querySelector(".catalog-listing__chips li"));
    chosen.hidden = !hasChips;
    chosen.style.display = hasChips ? "" : "none";
}

function initSort(sortRoot) {
    if (!sortRoot) return;

    const select = sortRoot.querySelector("[data-catalog-sort-select]");

    function syncNiceSelect(value) {
        if (!select) return;
        select.value = value;
        const nice = select.nextElementSibling;
        if (!nice?.classList.contains("nice-select")) return;

        const optIndex = [...select.options].findIndex((o) => o.value === value);
        if (optIndex < 0) return;

        nice.querySelectorAll(".option").forEach((o, i) => {
            o.classList.toggle("selected", i === optIndex);
            o.classList.toggle("focus", i === optIndex);
        });
        const current = nice.querySelector(".current");
        if (current) current.textContent = select.options[optIndex].textContent;
    }

    function setActive(value) {
        sortRoot.querySelectorAll("[data-sort]").forEach((el) => {
            const active = el.dataset.sort === value;
            el.classList.toggle("is-active", active);
            if (active) el.setAttribute("aria-current", "true");
            else el.removeAttribute("aria-current");
        });

        if (select && select.value !== value) {
            syncNiceSelect(value);
        }
    }

    sortRoot.addEventListener("click", (e) => {
        const link = e.target.closest("[data-sort]");
        if (!link || !sortRoot.contains(link)) return;
        e.preventDefault();
        setActive(link.dataset.sort);
    });

    select?.addEventListener("change", () => {
        setActive(select.value);
    });
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
