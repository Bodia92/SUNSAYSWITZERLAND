import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Letter fill for [data-text-fill].
 * Starts once when the block enters the viewport (not scrubbed by scroll).
 * Base: #B9B9B9 → #141414; nested <span> → brand yellow.
 * Spaces are preserved as characters in the fill sequence.
 */
export function initTextFill(root = document) {
    const blocks = [...root.querySelectorAll("[data-text-fill]")];
    if (!blocks.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    blocks.forEach((block) => {
        const chars = splitIntoChars(block);
        if (!chars.length) return;

        if (reduceMotion) {
            chars.forEach((char) => char.classList.add("is-filled"));
            return;
        }

        ScrollTrigger.create({
            trigger: block,
            start: "top 80%",
            once: true,
            onEnter: () => playFill(chars),
        });
    });
}

function playFill(chars) {
    const total = Math.max(chars.length * 0.028, 1.2);
    const step = total / chars.length;

    const tl = gsap.timeline({ defaults: { ease: "none" } });

    chars.forEach((char, index) => {
        tl.call(() => char.classList.add("is-filled"), null, index * step);
    });
}

function splitIntoChars(block) {
    const sourceNodes = [...block.childNodes];
    const fragment = document.createDocumentFragment();
    const chars = [];

    const appendChar = (ch, accent) => {
        const span = document.createElement("span");
        span.className = accent ? "we-are__char we-are__char--accent" : "we-are__char";
        span.setAttribute("aria-hidden", "true");

        if (ch === " " || ch === "\n" || ch === "\t") {
            // Regular space so the line can wrap on mobile (nbsp would lock one long row)
            span.classList.add("we-are__char--space");
            span.textContent = " ";
        } else {
            span.textContent = ch;
        }

        fragment.appendChild(span);
        chars.push(span);
    };

    const walk = (node, accent = false) => {
        if (node.nodeType === Node.TEXT_NODE) {
            // Collapse markup whitespace so fill tracks real letters/spaces only
            const text = (node.textContent ?? "").replace(/\s+/g, " ");
            for (const ch of text) appendChar(ch, accent);
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const nextAccent = accent || node.tagName === "SPAN";
        [...node.childNodes].forEach((child) => walk(child, nextAccent));
    };

    sourceNodes.forEach((node) => walk(node, false));

    while (chars[0]?.classList.contains("we-are__char--space")) {
        chars.shift()?.remove();
    }
    while (chars.at(-1)?.classList.contains("we-are__char--space")) {
        chars.pop()?.remove();
    }

    const accessible = document.createElement("span");
    accessible.className = "visually-hidden";
    accessible.textContent = block.textContent.replace(/\s+/g, " ").trim();

    block.replaceChildren(accessible, fragment);
    return chars;
}
