import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

export function initFancybox() {
    Fancybox.bind("[data-fancybox], .glightbox", {
        closeButton: true,
        Carousel: {
            Thumbs: false,
            Toolbar: false,
            Video: {
                autoplay: true,
            },
        },
    });
}
