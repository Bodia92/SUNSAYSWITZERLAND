const REVIEW_POPUP_ID = "#review-popup";

function getImagesBase() {
    const sample = document.querySelector(".review-card img");
    if (sample?.src) {
        return sample.src.replace(/[^/]+$/, "");
    }
    return "/assets/images/";
}

function getSpritePath() {
    const use = document.querySelector('use[href*="sprite"]');
    if (use) {
        return use.getAttribute("href").split("#")[0];
    }
    return "/assets/images/sprite.svg";
}

function resolveAssetUrl(raw, base) {
    if (!raw) return "";

    const value = raw.trim();
    if (!value) return "";

    if (value.startsWith("http") || value.startsWith("/") || value.startsWith("./")) {
        return value;
    }

    return `${base}${value}`;
}

function resolveImages(raw, base) {
    if (!raw) return [];

    return raw
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => resolveAssetUrl(item, base));
}

function renderStars(rating = 5) {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    const sprite = getSpritePath();
    let html = "";

    for (let i = 1; i <= 5; i += 1) {
        const isFilled = i <= value;
        const icon = isFilled ? "icon-heart" : "icon-heart-outline";
        const cls = isFilled ? "icon" : "icon icon-disabled";
        html += `<svg class="${cls}" aria-hidden="true"><use href="${sprite}#${icon}"></use></svg>`;
    }

    return html;
}

function hydrateReviewStars() {
    document.querySelectorAll(".review-card__stars[data-rating]").forEach((el) => {
        const rating = el.dataset.rating || "5";
        el.innerHTML = renderStars(rating);
        el.setAttribute("aria-label", `${rating} out of 5`);
    });
}

function getReviewData(source) {
    if (!source) return null;

    const card = source.closest(".review-card");
    const mediaImg = card?.querySelector(".review-card__media img");
    const avatarImg = card?.querySelector(".review-card__avatar img");
    const mediaSrc = mediaImg?.currentSrc || mediaImg?.src || "";
    const avatarSrc = avatarImg?.currentSrc || avatarImg?.src || "";

    return {
        type: source.dataset.reviewMedia || (mediaSrc ? "single" : "none"),
        images: mediaSrc || source.dataset.reviewImages || "",
        videoUrl: source.dataset.reviewVideo || "",
        name: source.dataset.reviewName || "",
        avatar: avatarSrc || source.dataset.reviewAvatar || "",
        service: source.dataset.reviewService || "",
        date: source.dataset.reviewDate || "",
        rating: source.dataset.reviewRating || "5",
        text: source.dataset.reviewText || "",
    };
}

function buildMediaMarkup(type, images, videoUrl, base) {
    const resolved = resolveImages(images, base);
    const video = resolveAssetUrl(videoUrl, base);

    if (type === "none") {
        return "";
    }

    if (type === "gallery" && resolved.length >= 3) {
        return `
            <div class="review-popup__gallery">
                <img src="${resolved[0]}" alt="" />
                <div class="review-popup__gallery-side">
                    <img src="${resolved[1]}" alt="" />
                    <img src="${resolved[2]}" alt="" />
                </div>
            </div>
        `;
    }

    if (type === "double" && resolved.length >= 2) {
        return `
            <div class="review-popup__double">
                <img src="${resolved[0]}" alt="" />
                <img src="${resolved[1]}" alt="" />
            </div>
        `;
    }

    if (type === "video") {
        const poster = resolved[0] || "";

        if (video) {
            return `
                <div class="review-popup__video" data-review-video-wrap>
                    <video class="review-popup__player" playsinline preload="metadata"${poster ? ` poster="${poster}"` : ""}>
                        <source src="${video}" type="video/mp4" />
                    </video>
                    <button type="button" class="review-popup__play-btn js-review-video-btn" aria-label="Play video">
                        <span class="review-popup__play" aria-hidden="true"></span>
                    </button>
                </div>
            `;
        }

        if (poster) {
            return `
                <div class="review-popup__video review-popup__video--poster">
                    <img src="${poster}" alt="" />
                    <span class="review-popup__play" aria-hidden="true"></span>
                </div>
            `;
        }

        return "";
    }

    if (resolved[0]) {
        return `
            <div class="review-popup__single">
                <img src="${resolved[0]}" alt="" />
            </div>
        `;
    }

    return "";
}

function syncVideoButtonState(wrap, video, btn) {
    if (!wrap || !video || !btn) return;

    const isPlaying = !video.paused && !video.ended;
    wrap.dataset.playing = isPlaying ? "true" : "false";
    btn.setAttribute("aria-label", isPlaying ? "Pause video" : "Play video");
}

function initPopupVideoControls(popup) {
    const wrap = popup.querySelector("[data-review-video-wrap]");
    if (!wrap || wrap._videoInit) return;

    const video = wrap.querySelector(".review-popup__player");
    const btn = wrap.querySelector(".js-review-video-btn");

    if (!video || !btn) return;

    const togglePlayback = () => {
        if (video.paused || video.ended) {
            video
                .play()
                .then(() => {
                    btn.blur();
                    syncVideoButtonState(wrap, video, btn);
                })
                .catch((error) => {
                    console.warn("Review video play failed:", error);
                });
            return;
        }

        video.pause();
        syncVideoButtonState(wrap, video, btn);
    };

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePlayback();
    });

    video.addEventListener("click", (e) => {
        e.preventDefault();
        togglePlayback();
    });

    video.addEventListener("play", () => syncVideoButtonState(wrap, video, btn));
    video.addEventListener("pause", () => syncVideoButtonState(wrap, video, btn));
    video.addEventListener("ended", () => syncVideoButtonState(wrap, video, btn));

    syncVideoButtonState(wrap, video, btn);
    wrap._videoInit = true;
}

function stopPopupVideo(popup) {
    const wrap = popup?.querySelector("[data-review-video-wrap]");
    if (!wrap) return;

    const video = wrap.querySelector(".review-popup__player");
    const btn = wrap.querySelector(".js-review-video-btn");

    if (!video) return;

    video.pause();
    video.currentTime = 0;
    syncVideoButtonState(wrap, video, btn);
}

function fillReviewPopup(source, options = {}) {
    const popup = document.querySelector(REVIEW_POPUP_ID);
    const data = getReviewData(source);

    if (!popup || !data) return;

    const base = getImagesBase();
    const { type, images, videoUrl, name, avatar, service, date, rating, text } = data;

    const mediaEl = popup.querySelector("[data-review-popup-media]");
    const nameEl = popup.querySelector("[data-review-popup-name]");
    const avatarEl = popup.querySelector("[data-review-popup-avatar]");
    const badgeEl = popup.querySelector("[data-review-popup-badge]");
    const dateEl = popup.querySelector("[data-review-popup-date]");
    const starsEl = popup.querySelector("[data-review-popup-stars]");
    const textEl = popup.querySelector("[data-review-popup-text]");
    const layoutEl = popup.querySelector("[data-review-popup-layout]");

    if (mediaEl) {
        mediaEl.innerHTML = buildMediaMarkup(type, images, videoUrl, base);
        mediaEl.className = "review-popup__media";
        if (type !== "none") {
            mediaEl.classList.add(`review-popup__media--${type}`);
        } else {
            mediaEl.classList.add("review-popup__media--empty");
        }
    }

    if (layoutEl) {
        layoutEl.classList.toggle("review-popup__layout--no-media", type === "none");
    }

    if (nameEl) nameEl.textContent = name;
    if (avatarEl) {
        const avatarUrl = resolveAssetUrl(avatar, base);
        avatarEl.innerHTML = avatarUrl ? `<img src="${avatarUrl}" alt="" />` : "";
    }
    if (badgeEl) {
        badgeEl.textContent = service;
        badgeEl.hidden = !service;
    }
    if (dateEl) {
        dateEl.textContent = date;
        dateEl.hidden = !date;
    }
    if (starsEl) {
        starsEl.innerHTML = renderStars(rating);
        starsEl.setAttribute("aria-label", `${rating} out of 5`);
    }
    if (textEl) textEl.textContent = text;

    initPopupVideoControls(popup);

    if (options.autoplayVideo && type === "video" && videoUrl) {
        const video = popup.querySelector(".review-popup__player");
        if (video) {
            video.play().catch((error) => {
                console.warn("Review video autoplay failed:", error);
            });
        }
    }
}

function openReviewPopup(source, options = {}) {
    const popup = document.querySelector(REVIEW_POPUP_ID);
    if (!popup || !source) return;

    fillReviewPopup(source, options);

    if (typeof window.popupOpen === "function") {
        window.popupOpen(popup);
    }
}

function getReviewTrigger(card) {
    return card?.querySelector("[data-review-trigger]") || null;
}

export function initReviewsPopup() {
    hydrateReviewStars();

    const popup = document.querySelector(REVIEW_POPUP_ID);
    if (!popup) return;

    const observer = new MutationObserver(() => {
        if (!popup.classList.contains("is-open")) {
            stopPopupVideo(popup);
        }
    });

    observer.observe(popup, {
        attributes: true,
        attributeFilter: ["class"],
    });

    document.addEventListener("click", (e) => {
        const readMoreTrigger = e.target.closest("[data-review-trigger]");
        if (readMoreTrigger) {
            e.preventDefault();
            openReviewPopup(readMoreTrigger);
            return;
        }

        const videoMedia = e.target.closest(".review-card__media--video");
        if (videoMedia) {
            e.preventDefault();
            const card = videoMedia.closest(".review-card");
            const trigger = getReviewTrigger(card);

            if (trigger) {
                openReviewPopup(trigger, { autoplayVideo: true });
            }
        }
    });

    document.addEventListener("keydown", (e) => {
        const videoMedia = e.target.closest(".review-card__media--video");
        if (!videoMedia || (e.key !== "Enter" && e.key !== " ")) return;

        e.preventDefault();
        const card = videoMedia.closest(".review-card");
        const trigger = getReviewTrigger(card);

        if (trigger) {
            openReviewPopup(trigger, { autoplayVideo: true });
        }
    });
}
