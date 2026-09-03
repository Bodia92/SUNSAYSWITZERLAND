const PIN_PATH =
    "M0 0c-6.39 0-11.59 5.199-11.59 11.589 0 7.931 10.372 19.573 10.814 20.065 0.415 0.462 1.139 0.461 1.553 0C1.218 31.162 11.59 19.52 11.59 11.589 11.589 5.199 6.391 0 0 0Zm0 17.42c-3.215 0-5.83-2.616-5.83-5.831S-3.215 5.758 0 5.758 5.831 8.374 5.831 11.589 3.215 17.42 0 17.42Z";
const PIN_HEIGHT = 31.654;

export function initObjectsMap() {
    document.querySelectorAll("[data-objects-map]").forEach(initOne);
}

function initOne(root) {
    const svg = root.querySelector(".objects-map__svg");
    const pinsGroup = root.querySelector("[data-map-pins]");
    const popup = root.querySelector("[data-map-popup]");
    const items = [...root.querySelectorAll("[data-map-item]")];

    if (!svg || !popup || !items.length) return;

    const itemsByRegion = new Map();
    items.forEach((item) => {
        const region = item.dataset.region;
        if (!region || itemsByRegion.has(region)) return;
        itemsByRegion.set(region, item);
    });

    svg.querySelectorAll(".objects-map__pin[data-region]").forEach((pin) => {
        const region = pin.dataset.region;
        if (!itemsByRegion.has(region)) return;

        pin.classList.add("is-interactive");
        pin.setAttribute("tabindex", "0");
        pin.setAttribute("role", "button");
    });

    itemsByRegion.forEach((_, region) => {
        const path = svg.querySelector(`.objects-map__region[data-region="${region}"]`);
        if (!path) return;

        path.classList.add("is-interactive");
        path.setAttribute("tabindex", "0");
        path.setAttribute("role", "button");
        path.setAttribute("aria-expanded", "false");

        const hasPin = svg.querySelector(`.objects-map__pin[data-region="${region}"]`);
        if (!hasPin && pinsGroup) {
            pinsGroup.appendChild(createPin(path, region));
        }
    });

    function currentItem(region) {
        return itemsByRegion.get(region) || null;
    }

    function isOpen() {
        return popup.classList.contains("is-open");
    }

    function close() {
        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");
        root.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
        svg.querySelectorAll('[aria-expanded="true"]').forEach((el) => {
            el.setAttribute("aria-expanded", "false");
        });
    }

    function open(region) {
        const item = currentItem(region);
        const path = svg.querySelector(`.objects-map__region[data-region="${region}"]`);
        if (!item || !path) return;

        const title = item.dataset.title || "";
        const location = item.dataset.location || "";
        const href = item.dataset.href || "#";
        const image = item.querySelector("img");

        popup.querySelector("[data-map-title]").textContent = title;
        popup.querySelector("[data-map-location]").textContent = location;

        const link = popup.querySelector("[data-map-link]");
        if (link) link.setAttribute("href", href);

        const img = popup.querySelector("[data-map-image]");
        if (img) {
            img.src = image?.getAttribute("src") || "";
            img.alt = title;
        }

        root.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
        path.classList.add("is-active");
        path.parentNode.appendChild(path);
        path.setAttribute("aria-expanded", "true");

        svg.querySelectorAll(`.objects-map__pin[data-region="${region}"]`).forEach((pin) => {
            pin.classList.add("is-active");
        });

        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");
    }

    root.addEventListener("click", (e) => {
        if (e.target.closest("[data-map-close]")) {
            e.preventDefault();
            close();
            return;
        }

        const target = e.target.closest("[data-region].is-interactive");
        if (!target || !root.contains(target)) return;

        const region = target.dataset.region;
        if (!currentItem(region)) return;

        open(region);
    });

    root.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) {
            close();
            return;
        }

        const regionEl = e.target.closest(".objects-map__region.is-interactive");
        if (!regionEl || (e.key !== "Enter" && e.key !== " ")) return;

        e.preventDefault();
        open(regionEl.dataset.region);
    });

    document.addEventListener("click", (e) => {
        if (!isOpen()) return;
        if (root.contains(e.target)) return;
        close();
    });
}

function createPin(path, region) {
    const box = path.getBBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    const pin = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pin.setAttribute("class", "objects-map__pin is-interactive");
    pin.setAttribute("data-region", region);
    pin.setAttribute("transform", `translate(${cx} ${cy - PIN_HEIGHT})`);
    pin.setAttribute("d", PIN_PATH);

    return pin;
}
