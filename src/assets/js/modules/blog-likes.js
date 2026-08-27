export function initBlogLikes() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-like-btn]");
        if (!btn) return;

        const liked = btn.classList.toggle("is-liked");
        btn.setAttribute("aria-pressed", liked ? "true" : "false");
        btn.setAttribute("aria-label", liked ? "Unlike post" : "Like post");
    });
}
