import fs from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Файли в `src/*.html`, які не показувати в панелі (лише імена файлів). */
const IGNORE_HTML = [];

/** Панель з’являється, якщо сторінок не менше цього числа. */
const MIN_PAGES = 2;

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function listRootHtmlPages(srcDir) {
    if (!fs.existsSync(srcDir)) return [];
    return fs
        .readdirSync(srcDir)
        .filter((f) => f.endsWith(".html") && !IGNORE_HTML.includes(f))
        .sort((a, b) => {
            if (a === "index.html") return -1;
            if (b === "index.html") return 1;
            return a.localeCompare(b);
        });
}

function pageLabel(filename) {
    if (filename === "index.html") return "Головна";
    return filename.replace(/\.html$/i, "");
}

function pageHref(filename) {
    if (filename === "index.html") return "/";
    return `/${filename}`;
}

function buildPanelMarkup(files) {
    const items = files
        .map((file) => {
            const href = pageHref(file);
            const label = pageLabel(file);
            return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
        })
        .join("");

    return `
<nav id="me-template-dev-pages" aria-label="Сторінки шаблону (лише dev)">
  <div id="me-template-dev-pages-title">Сторінки</div>
  <ul>${items}</ul>
</nav>
<style>
#me-template-dev-pages {
  position: fixed;
  right: 0;
  top: 12%;
  z-index: 99999;
  font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  color: #e8eaed;
  background: #1e1f23;
  border: 1px solid #3d4049;
  border-right: none;
  border-radius: 10px 0 0 10px;
  padding: 14px 18px 14px 14px;
  max-width: min(280px, 92vw);
  max-height: 78svh;
  overflow: auto;
  box-shadow: -4px 4px 24px rgba(0,0,0,.35);
  transform: translateX(calc(100% - 32px));
  transition: transform 0.22s ease;
}
#me-template-dev-pages:hover {
  transform: translateX(0);
}
#me-template-dev-pages-title {
  font-weight: 600;
  margin-bottom: 10px;
  padding-right: 8px;
  cursor: default;
  color: #A21C26;
}
#me-template-dev-pages ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
#me-template-dev-pages li:not(:last-child) { margin-bottom: 8px; }
#me-template-dev-pages a {
  color: #fff;
  text-decoration: none;
  word-break: break-word;
}
#me-template-dev-pages a:hover { text-decoration: underline; }
</style>`;
}

/**
 * Панель посилань на `src/*.html` лише в режимі `vite dev`.
 * Не підключається до production build (`apply: "serve"`).
 */
export function devPagesNavPlugin(options = {}) {
    const srcDir = options.srcDir ?? resolve(__dirname, "../src");

    return {
        name: "dev-pages-nav",
        apply: "serve",
        transformIndexHtml(html) {
            const files = listRootHtmlPages(srcDir);
            if (files.length < (options.minPages ?? MIN_PAGES)) {
                return html;
            }
            const markup = buildPanelMarkup(files);
            if (html.includes("</body>")) {
                return html.replace("</body>", `${markup}\n</body>`);
            }
            return html + markup;
        },
    };
}
