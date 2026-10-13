function formatNumber(value, format) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    if (format === "space") {
        return Math.round(n)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    return String(n);
}

function padHour(h) {
    return `${String(h).padStart(2, "0")}:00`;
}

function getRadioValue(form, name) {
    const el = form.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
}

function stepMatchesWhen(step, system) {
    const when = step.getAttribute("data-quiz-when") || "*";
    if (when === "*") return true;
    return when
        .split(",")
        .map((s) => s.trim())
        .includes(system);
}

function stepMatchesIf(step, form) {
    const cond = step.getAttribute("data-quiz-if");
    if (!cond) return true;
    return cond.split(",").some((pair) => {
        const [name, value] = pair.trim().split(":");
        return getRadioValue(form, name) === value;
    });
}

function syncRange(wrap) {
    const input = wrap.querySelector(".quiz-range__input");
    const display = wrap.querySelector(".quiz-range__value");
    if (!input || !display) return;

    const update = () => {
        const min = Number(input.min) || 0;
        const max = Number(input.max) || 100;
        const val = Number(input.value);
        const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
        input.style.setProperty("--quiz-range-progress", `${pct}%`);
        const unit = input.getAttribute("data-quiz-unit") || "";
        const format = input.getAttribute("data-quiz-format") || "";
        display.value = `${formatNumber(val, format)}${unit ? ` ${unit}` : ""}`;
    };

    input.addEventListener("input", update);
    update();
}

function syncTimeline(wrap) {
    const display = wrap.querySelector(".quiz-timeline__display");
    const segments = [...wrap.querySelectorAll("[data-quiz-timeline-segment]")];

    const pairs = (segments.length
        ? segments
        : [wrap.querySelector(".quiz-timeline__track") || wrap]
    )
        .map((seg) => ({
            from: seg.querySelector(".quiz-timeline__from"),
            to: seg.querySelector(".quiz-timeline__to"),
            fill: seg.querySelector("[data-quiz-timeline-fill]"),
        }))
        .filter((p) => p.from && p.to);

    if (!pairs.length) return;

    const handles = pairs.flatMap((p) => [p.from, p.to]);

    const paint = () => {
        const parts = [];

        pairs.forEach(({ from, to, fill }) => {
            const a = Number(from.value);
            const b = Number(to.value);
            const min = Number(from.min) || 0;
            const max = Number(from.max) || 24;
            const left = ((a - min) / (max - min)) * 100;
            const right = ((b - min) / (max - min)) * 100;

            if (fill) {
                fill.style.left = `${left}%`;
                fill.style.width = `${Math.max(0, right - left)}%`;
            }

            parts.push(`${padHour(a)} — ${padHour(b)}`);
        });

        if (display) {
            display.value = parts.join(", ");
        }
    };

    const setActive = (el) => {
        handles.forEach((h) => h.classList.toggle("is-active", h === el));
    };

    pairs.forEach(({ from, to }) => {
        from.addEventListener("pointerdown", () => setActive(from));
        to.addEventListener("pointerdown", () => setActive(to));

        from.addEventListener("input", () => {
            if (Number(from.value) > Number(to.value)) {
                from.value = to.value;
            }
            paint();
        });

        to.addEventListener("input", () => {
            if (Number(to.value) < Number(from.value)) {
                to.value = from.value;
            }
            paint();
        });
    });

    paint();
}

function syncReveals(form) {
    form.querySelectorAll("[data-quiz-reveal]").forEach((el) => {
        const rules = el.getAttribute("data-quiz-reveal").split(",");
        const visible = rules.some((rule) => {
            const [name, value] = rule.trim().split(":");
            return getRadioValue(form, name) === value;
        });
        el.hidden = !visible;

        // Кастомні поля («Інше») — не відправляємо, коли приховані
        if (el.classList.contains("quiz-field__extra")) {
            el.querySelectorAll("input, textarea, select").forEach((field) => {
                field.disabled = !visible;
                if (!visible && field instanceof HTMLInputElement && !field.readOnly) {
                    field.value = "";
                }
            });
        }
    });
}

function initOne(root) {
    const quiz = root.matches("form[data-quiz]") ? root : root.querySelector("[data-quiz]");
    const track = quiz?.querySelector("[data-quiz-track]");
    const viewport = quiz?.querySelector(".quiz-form__viewport");
    if (!quiz || !track || !viewport) return;

    const allSteps = [...track.querySelectorAll("[data-quiz-step]")];
    let visible = [];
    let index = 0;
    let animating = false;

    quiz.querySelectorAll("[data-quiz-range]").forEach(syncRange);
    quiz.querySelectorAll("[data-quiz-timeline]").forEach(syncTimeline);

    const startBtn = quiz.querySelector("[data-quiz-start]");

    function syncStartButton() {
        if (!startBtn) return;
        startBtn.disabled = !getRadioValue(quiz, "system");
    }

    // Вибір опцій не має підвантажувати наступні кроки в layout —
    // лише оновлюємо умовні поля всередині поточного кроку.
    quiz.addEventListener("change", (e) => {
        if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLSelectElement)) return;
        if (e.target.name === "system") syncStartButton();
        syncReveals(quiz);
        syncViewportHeight(false);
    });
    syncReveals(quiz);
    syncStartButton();

    function syncSelectSpace() {
        quiz.querySelectorAll(".quiz-field .nice-select").forEach((nice) => {
            const field = nice.closest(".quiz-field");
            const dropdown = nice.querySelector(".nice-select-dropdown");
            if (!field) return;

            if (nice.classList.contains("open") && dropdown) {
                field.style.paddingBottom = `${dropdown.offsetHeight + 8}px`;
            } else {
                field.style.paddingBottom = "";
            }
        });
        syncViewportHeight(false);
    }

    quiz.addEventListener("click", (e) => {
        if (!e.target.closest(".nice-select")) return;
        requestAnimationFrame(syncSelectSpace);
    });

    document.addEventListener("click", () => {
        requestAnimationFrame(syncSelectSpace);
    });

    function rebuildVisible() {
        const system = getRadioValue(quiz, "system");
        const currentId = visible[index]?.getAttribute("data-quiz-step");

        visible = allSteps.filter((step) => {
            if (!system) {
                return step.getAttribute("data-quiz-step") === "intro";
            }
            return stepMatchesWhen(step, system) && stepMatchesIf(step, quiz);
        });

        allSteps.forEach((step) => {
            const on = visible.includes(step);
            step.hidden = !on;
            step.style.display = on ? "" : "none";
        });

        const nextIdx = currentId
            ? visible.findIndex((s) => s.getAttribute("data-quiz-step") === currentId)
            : 0;
        index = nextIdx >= 0 ? nextIdx : 0;
    }

    function syncViewportHeight(animate) {
        const step = visible[index];
        if (!step) return;

        viewport.classList.toggle("is-animating-height", Boolean(animate));
        viewport.style.height = `${step.offsetHeight}px`;
    }

    function paint(animate) {
        if (!visible.length) return;

        track.classList.toggle("is-animating", Boolean(animate));
        track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;

        visible.forEach((step, i) => {
            const active = i === index;
            step.classList.toggle("is-active", active);
            step.setAttribute("aria-hidden", active ? "false" : "true");
        });

        syncViewportHeight(animate);
    }

    function scrollFormIntoView() {
        const anchor = quiz.closest(".quiz__form") || quiz;
        const header = document.querySelector(".header");
        const headerH = header ? Math.round(header.getBoundingClientRect().height) : 0;
        const top = anchor.getBoundingClientRect().top + window.scrollY - headerH - 16;
        const needsScroll = Math.abs(window.scrollY - top) > 8;

        if (!needsScroll) return;

        window.scrollTo({
            top: Math.max(0, top),
            behavior: "smooth",
        });
    }

    function goTo(nextIndex, animate = true) {
        if (!visible.length || animating) return;

        const target = Math.max(0, Math.min(nextIndex, visible.length - 1));
        if (target === index) {
            paint(false);
            return;
        }

        quiz.querySelectorAll(".nice-select.open").forEach((el) => {
            el.classList.remove("open");
        });
        quiz.querySelectorAll(".quiz-field").forEach((field) => {
            field.style.paddingBottom = "";
        });

        if (!animate) {
            index = target;
            paint(false);
            scrollFormIntoView();
            return;
        }

        animating = true;
        index = target;
        paint(true);
        scrollFormIntoView();

        window.setTimeout(() => {
            animating = false;
            track.classList.remove("is-animating");
            viewport.classList.remove("is-animating-height");
            syncViewportHeight(false);
        }, 480);
    }

    function validateCurrent() {
        const step = visible[index];
        if (!step) return true;

        if (step.getAttribute("data-quiz-step") === "intro" && !getRadioValue(quiz, "system")) {
            quiz.querySelector('input[name="system"]')?.focus();
            return false;
        }

        if (step.getAttribute("data-quiz-step") === "contacts") {
            const phone = quiz.querySelector("#quiz-phone");
            if (phone && !phone.checkValidity()) {
                phone.reportValidity();
                return false;
            }
        }

        return true;
    }

    quiz.addEventListener("click", (e) => {
        const nextBtn = e.target.closest("[data-quiz-next]");
        const prevBtn = e.target.closest("[data-quiz-prev]");

        if (nextBtn) {
            e.preventDefault();
            if (!validateCurrent()) return;

            const fromId = visible[index]?.getAttribute("data-quiz-step");
            rebuildVisible();

            // Після rebuild індекс може змінитися — шукаємо наступний від поточного id
            const fromIdx = fromId
                ? visible.findIndex((s) => s.getAttribute("data-quiz-step") === fromId)
                : index;
            index = fromIdx >= 0 ? fromIdx : 0;
            paint(false);
            goTo(index + 1, true);
        }

        if (prevBtn) {
            e.preventDefault();
            goTo(index - 1, true);
        }
    });

    quiz.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validateCurrent()) return;

        if (typeof window.popupOpen === "function") {
            window.popupOpen("#popup-success");
        }
    });

    window.addEventListener("resize", () => syncViewportHeight(false));

    rebuildVisible();
    paint(false);
}

export function initQuiz() {
    document.querySelectorAll("[data-quiz]").forEach(initOne);
}
