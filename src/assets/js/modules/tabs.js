/**
 * Universal Tabs
 *
 * HTML structure:
 *
 * <div data-tabs>
 *   <div data-tabs-nav>
 *     <button data-tab="about" data-tabs-btn class="is-active">About</button>
 *     <button data-tab="services" data-tabs-btn>Services</button>
 *     <button data-tab="contacts" data-tabs-btn>Contacts</button>
 *   </div>
 *
 *   <div data-tab="about" data-tabs-panel class="is-active">
 *     Content About
 *   </div>
 *   <div data-tab="services" data-tabs-panel>
 *     Content Services
 *   </div>
 *   <div data-tab="contacts" data-tabs-panel>
 *     Content Contacts
 *   </div>
 * </div>
 */

const ACTIVE_CLASS = "is-active";
const VISIBLE_CLASS = "is-visible"; // Новий клас для плавного opacity

/**
 * Init one tabs instance
 */
function initTabs(root, options = {}) {
    if (!root || root._tabsInit) return;

    // Рекомендую ставити 200-250ms для послідовної анімації, щоб вона відчувалась швидкою
    const duration = options.duration ?? 250;
    const onChange = options.onChange ?? null;

    const btns = [...root.querySelectorAll("[data-tabs-btn]")];
    const panels = [...root.querySelectorAll("[data-tabs-panel]")];

    if (!btns.length || !panels.length) return;

    root.style.setProperty("--tabs-duration", `${duration}ms`);

    // Блокування під час анімації (щоб швидкі кліки не ламали верстку)
    let isAnimating = false;

    // ── Activate tab by name ──────────────────────────────────────────────
    function activate(tabName, animate = true) {
        if (isAnimating) return;

        const targetPanels = panels.filter((p) => p.dataset.tab === tabName);
        const targetBtn = btns.find((b) => b.dataset.tab === tabName);

        if (!targetPanels.length || !targetBtn) return;

        const currentPanels = panels.filter((p) => p.classList.contains(ACTIVE_CLASS));
        const alreadyActive =
            targetPanels.length === currentPanels.length &&
            targetPanels.every((panel) => currentPanels.includes(panel));

        if (alreadyActive) return;

        btns.forEach((b) => {
            b.classList.toggle(ACTIVE_CLASS, b === targetBtn);
            b.setAttribute("aria-selected", b === targetBtn ? "true" : "false");
            b.setAttribute("tabindex", b === targetBtn ? "0" : "-1");
        });

        if (animate && currentPanels.length) {
            isAnimating = true;

            currentPanels.forEach((panel) => panel.classList.remove(VISIBLE_CLASS));

            setTimeout(() => {
                currentPanels.forEach((panel) => {
                    panel.classList.remove(ACTIVE_CLASS);
                    panel.setAttribute("aria-hidden", "true");
                });

                targetPanels.forEach((panel) => {
                    panel.classList.add(ACTIVE_CLASS);
                    panel.setAttribute("aria-hidden", "false");
                });

                targetPanels[0]?.getBoundingClientRect();

                targetPanels.forEach((panel) => panel.classList.add(VISIBLE_CLASS));

                setTimeout(() => {
                    isAnimating = false;
                }, duration);
            }, duration);
        } else {
            panels.forEach((panel) => {
                panel.classList.remove(ACTIVE_CLASS, VISIBLE_CLASS);
                panel.setAttribute("aria-hidden", "true");
            });
            targetPanels.forEach((panel) => {
                panel.classList.add(ACTIVE_CLASS, VISIBLE_CLASS);
                panel.setAttribute("aria-hidden", "false");
            });
        }

        onChange?.(tabName, targetPanels[0], targetBtn);
    }

    // ── Click handler ─────────────────────────────────────────────────────
    function onClick(e) {
        const btn = e.target.closest("[data-tabs-btn]");
        if (!btn || !root.contains(btn)) return;
        e.preventDefault();
        activate(btn.dataset.tab);
    }

    // ── Keyboard handler (arrow keys) ─────────────────────────────────────
    function onKeydown(e) {
        const btn = e.target.closest("[data-tabs-btn]");
        if (!btn || !root.contains(btn)) return;

        const idx = btns.indexOf(btn);

        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = btns[(idx + 1) % btns.length];
            next.focus();
            activate(next.dataset.tab);
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const prev = btns[(idx - 1 + btns.length) % btns.length];
            prev.focus();
            activate(prev.dataset.tab);
        }
        if (e.key === "Home") {
            e.preventDefault();
            btns[0].focus();
            activate(btns[0].dataset.tab);
        }
        if (e.key === "End") {
            e.preventDefault();
            btns[btns.length - 1].focus();
            activate(btns[btns.length - 1].dataset.tab);
        }
    }

    // ── Aria attributes setup ─────────────────────────────────────────────
    function setupAria() {
        btns.forEach((btn) => {
            btn.setAttribute("role", "tab");
            const isActive = btn.classList.contains(ACTIVE_CLASS);
            btn.setAttribute("aria-selected", isActive ? "true" : "false");
            btn.setAttribute("tabindex", isActive ? "0" : "-1");
        });

        panels.forEach((panel) => {
            panel.setAttribute("role", "tabpanel");
            const isActive = panel.classList.contains(ACTIVE_CLASS);
            panel.setAttribute("aria-hidden", isActive ? "false" : "true");

            // Якщо таб був активний з HTML, додаємо йому клас видимості
            if (isActive) panel.classList.add(VISIBLE_CLASS);
        });

        const nav = root.querySelector("[data-tabs-nav]");
        if (nav) nav.setAttribute("role", "tablist");
    }

    // ── Init ──────────────────────────────────────────────────────────────
    setupAria();
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeydown);
    root._tabsInit = true;

    return {
        activate,
        destroy() {
            root.removeEventListener("click", onClick);
            root.removeEventListener("keydown", onKeydown);
            root._tabsInit = false;
        },
    };
}

export function initAllTabs(selector = "[data-tabs]", options = {}) {
    const roots = [...document.querySelectorAll(selector)];
    if (!roots.length) return [];
    return roots.map((root) => initTabs(root, options));
}

export { initTabs };
