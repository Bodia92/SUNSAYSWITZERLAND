const PIN_PATH =
    "M12 0c-4.793 0-8.692 3.899-8.692 8.692 0 5.948 7.778 14.68 8.11 15.049 0.311 0.346 0.854 0.346 1.165 0 0.331-0.369 8.11-9.101 8.11-15.049-0-4.793-3.899-8.692-8.692-8.692zM12 13.065c-2.411 0-4.373-1.962-4.373-4.373s1.962-4.373 4.373-4.373c2.411 0 4.373 1.962 4.373 4.373s-1.962 4.373-4.373 4.373z";

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

    itemsByRegion.forEach((_, region) => {
        const path = svg.querySelector(`.objects-map__region[data-region="${region}"]`);
        if (!path) return;

        path.classList.add("is-interactive");
        path.setAttribute("tabindex", "0");
        path.setAttribute("role", "button");
        path.setAttribute("aria-expanded", "false");

        if (pinsGroup) {
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

        const pin = svg.querySelector(`.objects-map__pin[data-region="${region}"]`);
        pin?.classList.add("is-active");

        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");
    }

    root.addEventListener("click", (e) => {
        if (e.target.closest("[data-map-close]")) {
            e.preventDefault();
            close();
            return;
        }

        const target = e.target.closest("[data-region]");
        if (!target || !root.contains(target)) return;
        if (!target.classList.contains("is-interactive") && !target.classList.contains("objects-map__pin")) {
            return;
        }

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
    const size = 22;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "objects-map__pin is-interactive");
    g.setAttribute("data-region", region);
    g.setAttribute("transform", `translate(${cx - size / 2} ${cy - size + 2})`);

    const pin = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pin.setAttribute("d", PIN_PATH);
    pin.setAttribute("transform", `scale(${size / 24})`);
    g.appendChild(pin);

    return g;
}
