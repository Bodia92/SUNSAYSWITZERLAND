import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";

export function initLightbox() {
    const lightbox = GLightbox({
        selector: ".glightbox",
        touchNavigation: true,
        loop: true,
        autoplayVideos: true,
    });
}
