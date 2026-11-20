const DESKTOP_MQ = "(min-width: 992px)";

/**
 * Govern timeline mouse interaction (desktop):
 * - yellow progress fill follows the cursor along the line
 * - nearest step gets .is-active (text scale, marker glow)
 * - other steps soften while interacting
 */
export function initGovernTimeline(root = document) {
    const rows = [...root.querySelectorAll(".govern__row")];
    if (!rows.length) return;

    rows.forEach((row) => setupRow(row));
}

function setupRow(row) {
    const steps = [...row.querySelectorAll(".govern__step")];
    if (!steps.length) return;

    const media = window.matchMedia(DESKTOP_MQ);
    let raf = 0;
    let pointerX = 0;

    const clear = () => {
        row.classList.remove("is-interacting");
        row.style.setProperty("--govern-progress", "0%");
        steps.forEach((step) => step.classList.remove("is-active"));
    };

    const apply = () => {
        raf = 0;
        if (!media.matches) {
            clear();
            return;
        }

        const rowRect = row.getBoundingClientRect();
        if (rowRect.width <= 0) return;

        const ratio = Math.min(1, Math.max(0, (pointerX - rowRect.left) / rowRect.width));
        row.style.setProperty("--govern-progress", `${(ratio * 100).toFixed(2)}%`);
        row.classList.add("is-interacting");

        let nearest = steps[0];
        let nearestDist = Infinity;

        steps.forEach((step) => {
            const marker = step.querySelector(".govern__marker") || step;
            const rect = marker.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const dist = Math.abs(centerX - pointerX);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = step;
            }
        });

        steps.forEach((step) => {
            step.classList.toggle("is-active", step === nearest);
        });
    };

    const onMove = (event) => {
        if (!media.matches) return;
        pointerX = event.clientX;
        if (!raf) raf = requestAnimationFrame(apply);
    };

    row.addEventListener("pointermove", onMove, { passive: true });
    row.addEventListener("pointerleave", clear);
    media.addEventListener?.("change", () => {
        if (!media.matches) clear();
    });
}
