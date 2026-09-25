/**
 * Калькулятор окупності СЕС.
 *
 * annualGeneration = powerKw * specificYield(region)
 * monthly[i]       = annualGeneration * MONTH_SHARES[i]
 * savingsUah       = annualGeneration * effectiveTariff
 * costUsd          = powerKw * COST_PER_KW_USD
 * paybackYears     = costUsd / (savingsUah / USD_UAH)
 */

const MONTH_LABELS = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
];

/** Частки річної генерації по місяцях (сума ≈ 1) */
const MONTH_SHARES = Object.freeze([
    0.034, 0.048, 0.078, 0.1, 0.118, 0.126, 0.132, 0.122, 0.096, 0.07, 0.042, 0.034,
]);

const CHART_TICK_COUNT = 6;
const CHART_EMPTY_MAX = 18000;

/** Специфічна генерація, кВт·г / кВт / рік */
const REGION_YIELD = Object.freeze({
    vinnytsia: 1120,
    volyn: 980,
    dnipro: 1180,
    donetsk: 1160,
    zhytomyr: 1040,
    zakarpattia: 1080,
    zaporizhzhia: 1240,
    "ivano-frankivsk": 1020,
    kyiv: 1100,
    kirovohrad: 1160,
    luhansk: 1140,
    lviv: 1000,
    mykolaiv: 1280,
    odesa: 1300,
    poltava: 1120,
    rivne: 990,
    sumy: 1060,
    ternopil: 1040,
    kharkiv: 1120,
    kherson: 1320,
    khmelnytskyi: 1080,
    cherkasy: 1120,
    chernivtsi: 1060,
    chernihiv: 1020,
});

const COST_PER_KW_USD = 800;
const USD_UAH = 41;
const RDN_EFFECTIVE_FACTOR = 0.92;

const POWER_MIN = 0;
const POWER_MAX = 100000;
const TARIFF_MIN = 2.64;
const TARIFF_MAX = 20;

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

function formatDecimal(n, digits = 2) {
    return n.toFixed(digits).replace(".", ",");
}

function parseLocaleNumber(raw) {
    if (raw == null) return NaN;
    const cleaned = String(raw)
        .replace(/\s/g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, "");
    return Number(cleaned);
}

/**
 * @param {{ regionId: string, powerKw: number, tariffUah: number, tariffType: 'fixed'|'rdn' }} input
 */
export function calculateSolar(input) {
    const regionId = input.regionId;
    const specificYield = REGION_YIELD[regionId];
    const powerKw = clamp(Number(input.powerKw) || 0, POWER_MIN, POWER_MAX);
    const tariffUah = clamp(Number(input.tariffUah) || 0, TARIFF_MIN, TARIFF_MAX);
    const tariffType = input.tariffType === "rdn" ? "rdn" : "fixed";

    if (!specificYield || powerKw <= 0 || tariffUah <= 0) {
        return null;
    }

    const annualGeneration = powerKw * specificYield;
    const monthly = MONTH_SHARES.map((share) => round(annualGeneration * share, 0));
    const effectiveTariff = tariffType === "rdn" ? tariffUah * RDN_EFFECTIVE_FACTOR : tariffUah;
    const savingsUah = annualGeneration * effectiveTariff;
    const savingsUsd = savingsUah / USD_UAH;
    const costUsd = powerKw * COST_PER_KW_USD;
    const paybackYears = savingsUsd > 0 ? costUsd / savingsUsd : Infinity;

    return {
        regionId,
        powerKw,
        tariffUah,
        tariffType,
        specificYield,
        annualGeneration,
        monthly,
        savingsUah,
        savingsUsd,
        costUsd,
        paybackYears,
    };
}

function setSelectValue(select, value) {
    if (!select) return;
    select.value = value;

    const nice = select.nextElementSibling;
    if (nice?.classList.contains("nice-select")) {
        const option = [...select.options].find((o) => o.value === value);
        const current = nice.querySelector(".current");
        if (current && option) current.textContent = option.textContent;

        nice.querySelectorAll(".option").forEach((el) => {
            const match = el.dataset.value === value;
            el.classList.toggle("selected", match);
            el.classList.toggle("focus", match);
        });
    }

    select.dispatchEvent(new Event("change", { bubbles: true }));
}

function niceCeil(value) {
    if (!Number.isFinite(value) || value <= 0) return CHART_EMPTY_MAX;

    const exp = Math.floor(Math.log10(value));
    const mag = 10 ** exp;
    const norm = value / mag;

    let niceNorm;
    if (norm <= 1) niceNorm = 1;
    else if (norm <= 1.5) niceNorm = 1.5;
    else if (norm <= 2) niceNorm = 2;
    else if (norm <= 3) niceNorm = 3;
    else if (norm <= 5) niceNorm = 5;
    else niceNorm = 10;

    return niceNorm * mag;
}

/** Тіки зверху вниз: max … 0 (як на макеті — 6 рівнів) */
function buildChartTicks(maxValue) {
    const max = niceCeil(maxValue);
    const ticks = [];

    for (let i = CHART_TICK_COUNT - 1; i >= 0; i -= 1) {
        ticks.push(Math.round((max * i) / (CHART_TICK_COUNT - 1)));
    }

    return { max, ticks };
}

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
}

function renderChart(root, monthly, { animate = false } = {}) {
    const barsWrap = root.querySelector("[data-solar-chart-bars]");
    const gridWrap = root.querySelector("[data-solar-chart-grid]");
    const xWrap = root.querySelector("[data-solar-chart-x]");
    const yWrap = root.querySelector("[data-solar-chart-y]");
    if (!barsWrap || !xWrap || !yWrap) return;

    const hasData = monthly.some((v) => v > 0);
    const peak = hasData ? Math.max(...monthly) : CHART_EMPTY_MAX;
    const { max, ticks } = buildChartTicks(peak);
    const heights = monthly.map((value) =>
        hasData ? Math.max(0, Math.min(100, (value / max) * 100)) : 0,
    );

    yWrap.innerHTML = ticks.map((t) => `<span>${formatInt(t)}</span>`).join("");

    if (gridWrap) {
        gridWrap.innerHTML = ticks
            .map(() => `<span class="solar-calc__chart-line"></span>`)
            .join("");
    }

    xWrap.innerHTML = `
        <span class="solar-calc__chart-x-spacer" aria-hidden="true">${formatInt(ticks[0])}</span>
        <div class="solar-calc__chart-x-months">
            ${MONTH_LABELS.map((m) => `<span>${m}</span>`).join("")}
        </div>
    `;
    barsWrap.innerHTML = monthly
        .map((value, i) => {
            return `<div class="solar-calc__bar" style="--bar-h:0%" title="${MONTH_LABELS[i]}: ${formatInt(value)} кВт·г"><span></span></div>`;
        })
        .join("");

    const applyHeights = () => {
        barsWrap.querySelectorAll(".solar-calc__bar").forEach((bar, i) => {
            bar.style.setProperty("--bar-h", `${heights[i]}%`);
        });
    };

    if (!animate || !hasData || prefersReducedMotion()) {
        applyHeights();
        return;
    }

    // подвійний rAF — щоб браузер встиг намалювати нульову висоту
    requestAnimationFrame(() => {
        requestAnimationFrame(applyHeights);
    });
}

function formatPayback(years) {
    if (!Number.isFinite(years) || years <= 0) return "—";
    if (years > 40) return "> 40 років";
    return `${String(round(years, 1)).replace(".", ",")} років`;
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
        generation: root.querySelector('[data-solar-metric="generation"]'),
        savings: root.querySelector('[data-solar-metric="savings"]'),
        cost: root.querySelector('[data-solar-metric="cost"]'),
        payback: root.querySelector('[data-solar-metric="payback"]'),
    };

    if (root._solarMetricStops) {
        root._solarMetricStops.forEach((stop) => stop?.());
        root._solarMetricStops = [];
    }

    if (!result) {
        Object.values(els).forEach((el) => {
            if (el) el.textContent = "0";
        });
        return;
    }

    const formats = {
        generation: (v) => `${formatInt(v)} кВт·г`,
        savings: (v) => `$ ${formatInt(v)}`,
        cost: (v) => `$ ${formatInt(v)}`,
        payback: (v) => formatPayback(v),
    };

    const values = {
        generation: result.annualGeneration,
        savings: result.savingsUsd,
        cost: result.costUsd,
        payback: result.paybackYears,
    };

    if (!animate) {
        Object.keys(els).forEach((key) => {
            if (els[key]) els[key].textContent = formats[key](values[key]);
        });
        return;
    }

    root._solarMetricStops = Object.keys(els).map((key) =>
        animateMetricValue(els[key], values[key], formats[key]),
    );
}

function fillLeadHidden(root, result, regionLabel) {
    const map = {
        "[data-solar-lead-region]": regionLabel || "",
        "[data-solar-lead-power]": result ? String(result.powerKw) : "",
        "[data-solar-lead-tariff]": result ? String(result.tariffUah) : "",
        "[data-solar-lead-tariff-type]": result?.tariffType || "",
        "[data-solar-lead-generation]": result ? String(Math.round(result.annualGeneration)) : "",
        "[data-solar-lead-payback]": result ? String(round(result.paybackYears, 2)) : "",
    };

    Object.entries(map).forEach(([sel, value]) => {
        const el = root.querySelector(sel);
        if (el) el.value = value;
    });
}

function updateSliderProgress(input) {
    if (!input) return;
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const val = Number(input.value);
    const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
    input.style.setProperty("--solar-range-progress", `${pct}%`);
}

function initOne(root) {
    const regionSelect = root.querySelector("[data-solar-region]");
    const powerInput = root.querySelector("[data-solar-power]");
    const powerDisplay = root.querySelector("[data-solar-power-display]");
    const tariffInput = root.querySelector("[data-solar-tariff]");
    const tariffDisplay = root.querySelector("[data-solar-tariff-display]");
    const calcBtn = root.querySelector("[data-solar-calculate]");
    const leadForm = root.querySelector("[data-solar-lead]");
    const chartRoot = root.querySelector("[data-solar-chart]");

    let lastResult = null;

    const readPower = () =>
        clamp(
            parseLocaleNumber(powerDisplay?.value) || Number(powerInput?.value) || 0,
            POWER_MIN,
            POWER_MAX,
        );
    const readTariff = () =>
        clamp(
            parseLocaleNumber(tariffDisplay?.value) || Number(tariffInput?.value) || 0,
            TARIFF_MIN,
            TARIFF_MAX,
        );
    const readTariffType = () =>
        root.querySelector('input[name="solar_tariff_type"]:checked')?.value || "fixed";

    function writePower(value) {
        const v = clamp(round(value, 0), POWER_MIN, POWER_MAX);
        if (powerInput) powerInput.value = String(v);
        if (powerDisplay) powerDisplay.value = formatInt(v);
        updateSliderProgress(powerInput);
    }

    function writeTariff(value) {
        const v = clamp(round(value, 2), TARIFF_MIN, TARIFF_MAX);
        if (tariffInput) tariffInput.value = String(v);
        if (tariffDisplay) tariffDisplay.value = formatDecimal(v, 2);
        updateSliderProgress(tariffInput);
    }

    function canCalculate() {
        return Boolean(regionSelect?.value) && readPower() > 0 && readTariff() > 0;
    }

    function syncCalculateEnabled() {
        if (calcBtn) calcBtn.disabled = !canCalculate();
    }

    function runCalculate() {
        if (!canCalculate()) {
            syncCalculateEnabled();
            return;
        }

        const result = calculateSolar({
            regionId: regionSelect.value,
            powerKw: readPower(),
            tariffUah: readTariff(),
            tariffType: readTariffType(),
        });

        lastResult = result;
        updateMetrics(root, result, { animate: true });
        if (result) renderChart(chartRoot, result.monthly, { animate: true });

        const regionLabel = regionSelect.options[regionSelect.selectedIndex]?.textContent || "";
        fillLeadHidden(root, result, regionLabel);
        root.classList.add("is-calculated");
    }

    powerInput?.addEventListener("input", () => {
        writePower(Number(powerInput.value));
        syncCalculateEnabled();
    });

    powerDisplay?.addEventListener("change", () => {
        writePower(parseLocaleNumber(powerDisplay.value));
        syncCalculateEnabled();
    });

    powerDisplay?.addEventListener("blur", () => {
        writePower(parseLocaleNumber(powerDisplay.value) || Number(powerInput?.value));
    });

    tariffInput?.addEventListener("input", () => {
        writeTariff(Number(tariffInput.value));
        syncCalculateEnabled();
    });

    tariffDisplay?.addEventListener("change", () => {
        writeTariff(parseLocaleNumber(tariffDisplay.value));
        syncCalculateEnabled();
    });

    tariffDisplay?.addEventListener("blur", () => {
        writeTariff(parseLocaleNumber(tariffDisplay.value) || Number(tariffInput?.value));
    });

    regionSelect?.addEventListener("change", syncCalculateEnabled);

    root.querySelectorAll("[data-solar-tariff-type]").forEach((el) => {
        el.addEventListener("change", syncCalculateEnabled);
    });

    root.querySelectorAll("[data-solar-quick]").forEach((btn) => {
        btn.addEventListener("click", () => {
            setSelectValue(regionSelect, btn.getAttribute("data-solar-quick"));
            syncCalculateEnabled();
        });
    });

    root.querySelectorAll("[data-solar-preset]").forEach((btn) => {
        btn.addEventListener("click", () => {
            writePower(Number(btn.getAttribute("data-solar-preset")));
            root.querySelectorAll("[data-solar-preset]").forEach((b) => {
                b.classList.toggle("is-active", b === btn);
            });
            syncCalculateEnabled();
        });
    });

    calcBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        runCalculate();
    });

    leadForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = leadForm.querySelector("#solar-calc-name");
        const phone = leadForm.querySelector("#solar-calc-phone");

        if (name && !name.value.trim()) {
            name.reportValidity();
            return;
        }
        if (phone && !phone.checkValidity()) {
            phone.reportValidity();
            return;
        }

        const regionLabel = regionSelect?.options[regionSelect.selectedIndex]?.textContent || "";
        fillLeadHidden(root, lastResult, regionLabel);

        if (typeof window.popupOpen === "function") {
            window.popupOpen("#popup-success");
        }
        leadForm.reset();
    });

    writePower(Number(powerInput?.value) || 10000);
    writeTariff(Number(tariffInput?.value) || 6.5);
    renderChart(
        chartRoot,
        MONTH_SHARES.map(() => 0),
    );
    updateMetrics(root, null);
    syncCalculateEnabled();
}

export function initSolarCalculator() {
    document.querySelectorAll("[data-solar-calc]").forEach(initOne);
}
