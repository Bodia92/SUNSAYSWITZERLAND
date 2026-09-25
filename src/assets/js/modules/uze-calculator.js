/**
 * Калькулятор окупності УЗЕ.
 *
 * Потужність ≈ 50% ємності.
 * Показники масштабуються від норм на 1 кВт·год ємності за сценарієм.
 *
 * costUsd    = capacityKwh * costPerKwh
 * annualUsd  = capacityKwh * annualPerKwh
 * payback    = costUsd / annualUsd
 */

/** Норми з кейсів: $ / кВт·год ємності */
const SCENARIOS = Object.freeze({
    self: Object.freeze({
        id: "self",
        label: "Самоспоживання",
        costPerKwhUsd: 35,
        annualPerKwhUsd: 7.5,
    }),
    arbitrage: Object.freeze({
        id: "arbitrage",
        label: "Арбітраж",
        costPerKwhUsd: 35,
        annualPerKwhUsd: 9.2,
    }),
});

const CAPACITY_MIN = 0;
const CAPACITY_MAX = 20000;
const POWER_RATIO = 0.5;

function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}

function round(n, digits = 0) {
    const f = 10 ** digits;
    return Math.round(n * f) / f;
}

function formatInt(n) {
    return Math.round(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseLocaleNumber(raw) {
    if (raw == null) return NaN;
    const cleaned = String(raw)
        .replace(/\s/g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, "");
    return Number(cleaned);
}

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
}

/**
 * @param {{ capacityKwh: number, scenarioId: 'self'|'arbitrage' }} input
 */
export function calculateUze(input) {
    const capacityKwh = clamp(Number(input.capacityKwh) || 0, CAPACITY_MIN, CAPACITY_MAX);
    const scenario = SCENARIOS[input.scenarioId] || SCENARIOS.self;

    if (capacityKwh <= 0) return null;

    const powerKw = round(capacityKwh * POWER_RATIO, 0);
    const costUsd = capacityKwh * scenario.costPerKwhUsd;
    const annualUsd = capacityKwh * scenario.annualPerKwhUsd;
    const paybackYears = annualUsd > 0 ? costUsd / annualUsd : Infinity;

    return {
        capacityKwh,
        powerKw,
        scenario,
        costUsd,
        annualUsd,
        paybackYears,
    };
}

function formatPayback(years) {
    if (!Number.isFinite(years) || years <= 0) return "—";
    if (years > 40) return "> 40 років";
    return `${String(round(years, 1)).replace(".", ",")} років`;
}

function updateSliderProgress(input) {
    if (!input) return;
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const val = Number(input.value);
    const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
    input.style.setProperty("--solar-range-progress", `${pct}%`);
}

function animateMetricValue(el, toValue, formatFn, duration = 900) {
    if (!el) return null;

    if (prefersReducedMotion() || !Number.isFinite(toValue)) {
        el.textContent = formatFn(toValue);
        return null;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = formatFn(toValue * easeOutCubic(t));
        if (t < 1) {
            raf = requestAnimationFrame(tick);
        } else {
            el.textContent = formatFn(toValue);
        }
    };

    el.textContent = formatFn(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
}

function updateMetrics(root, result, { animate = false } = {}) {
    const els = {
        cost: root.querySelector('[data-uze-metric="cost"]'),
        annual: root.querySelector('[data-uze-metric="annual"]'),
        payback: root.querySelector('[data-uze-metric="payback"]'),
    };

    if (root._uzeMetricStops) {
        root._uzeMetricStops.forEach((stop) => stop?.());
        root._uzeMetricStops = [];
    }

    if (!result) {
        Object.values(els).forEach((el) => {
            if (el) el.textContent = "0";
        });
        return;
    }

    const formats = {
        cost: (v) => `$ ${formatInt(v)}`,
        annual: (v) => `$ ${formatInt(v)} / рік`,
        payback: (v) => formatPayback(v),
    };

    const values = {
        cost: result.costUsd,
        annual: result.annualUsd,
        payback: result.paybackYears,
    };

    if (!animate) {
        Object.keys(els).forEach((key) => {
            if (els[key]) els[key].textContent = formats[key](values[key]);
        });
        return;
    }

    root._uzeMetricStops = Object.keys(els).map((key) =>
        animateMetricValue(els[key], values[key], formats[key]),
    );
}

function fillLeadHidden(root, result) {
    const map = {
        "[data-uze-lead-capacity]": result ? String(result.capacityKwh) : "",
        "[data-uze-lead-power]": result ? String(result.powerKw) : "",
        "[data-uze-lead-scenario]": result?.scenario?.id || "",
        "[data-uze-lead-cost]": result ? String(Math.round(result.costUsd)) : "",
        "[data-uze-lead-annual]": result ? String(Math.round(result.annualUsd)) : "",
        "[data-uze-lead-payback]": result ? String(round(result.paybackYears, 2)) : "",
    };

    Object.entries(map).forEach(([sel, value]) => {
        const el = root.querySelector(sel);
        if (el) el.value = value;
    });
}

function initOne(root) {
    const capacityInput = root.querySelector("[data-uze-capacity]");
    const capacityDisplay = root.querySelector("[data-uze-capacity-display]");
    const powerEl = root.querySelector("[data-uze-power]");
    const powerInput = root.querySelector("[data-uze-power-input]");
    const calcBtn = root.querySelector("[data-uze-calculate]");
    const leadForm = root.querySelector("[data-uze-lead]");

    let lastResult = null;

    const readCapacity = () =>
        clamp(
            parseLocaleNumber(capacityDisplay?.value) || Number(capacityInput?.value) || 0,
            CAPACITY_MIN,
            CAPACITY_MAX,
        );

    const readScenario = () => root.querySelector("[data-uze-scenario]:checked")?.value || "self";

    function writeCapacity(value) {
        const v = clamp(round(value, 0), CAPACITY_MIN, CAPACITY_MAX);
        if (capacityInput) capacityInput.value = String(v);
        if (capacityDisplay) capacityDisplay.value = formatInt(v);
        updateSliderProgress(capacityInput);
        syncPower(v);
        syncCalculateEnabled();
    }

    function syncPower(capacityKwh) {
        const powerKw = round(capacityKwh * POWER_RATIO, 0);
        if (powerEl) powerEl.textContent = formatInt(powerKw);
        if (powerInput) powerInput.value = String(powerKw);
    }

    function canCalculate() {
        return readCapacity() > 0 && Boolean(readScenario());
    }

    function syncCalculateEnabled() {
        if (calcBtn) calcBtn.disabled = !canCalculate();
    }

    function runCalculate() {
        if (!canCalculate()) {
            syncCalculateEnabled();
            return;
        }

        const result = calculateUze({
            capacityKwh: readCapacity(),
            scenarioId: readScenario(),
        });

        lastResult = result;
        updateMetrics(root, result, { animate: true });
        fillLeadHidden(root, result);
        root.classList.add("is-calculated");
    }

    capacityInput?.addEventListener("input", () => {
        writeCapacity(Number(capacityInput.value));
    });

    capacityDisplay?.addEventListener("change", () => {
        writeCapacity(parseLocaleNumber(capacityDisplay.value));
    });

    capacityDisplay?.addEventListener("blur", () => {
        writeCapacity(parseLocaleNumber(capacityDisplay.value) || Number(capacityInput?.value));
    });

    root.querySelectorAll("[data-uze-scenario]").forEach((el) => {
        el.addEventListener("change", syncCalculateEnabled);
    });

    const tipBtn = root.querySelector("[data-uze-tip]");
    const tipHoverMq = window.matchMedia("(hover: hover) and (pointer: fine)");

    function setTipOpen(open) {
        if (!tipBtn) return;
        tipBtn.classList.toggle("is-open", open);
        tipBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    tipBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // На десктопі достатньо hover; клік лишаємо для touch / coarse pointer
        if (tipHoverMq.matches) return;
        setTipOpen(!tipBtn.classList.contains("is-open"));
    });

    document.addEventListener("click", (e) => {
        if (!tipBtn?.classList.contains("is-open")) return;
        if (tipBtn.contains(e.target)) return;
        setTipOpen(false);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setTipOpen(false);
    });

    calcBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        runCalculate();
    });

    leadForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = leadForm.querySelector("#uze-calc-name");
        const phone = leadForm.querySelector("#uze-calc-phone");

        if (name && !name.value.trim()) {
            name.reportValidity();
            return;
        }
        if (phone && !phone.checkValidity()) {
            phone.reportValidity();
            return;
        }

        fillLeadHidden(root, lastResult);

        if (typeof window.popupOpen === "function") {
            window.popupOpen("#popup-success");
        }
        leadForm.reset();
    });

    writeCapacity(Number(capacityInput?.value) || 10000);
    updateMetrics(root, null);
    syncCalculateEnabled();
}

export function initUzeCalculator() {
    document.querySelectorAll("[data-uze-calc]").forEach(initOne);
}
