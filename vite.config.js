/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ШПАРГАЛКА: команди та змінні збірки
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Розробка
 *   npm run dev
 *     Локальний сервер (HMR), без production-збірки.
 *     Якщо в src/ кілька *.html — зправа панель «Сторінки» для швидкого переходу (лише dev).
 *
 * Збірка
 *   npm run build
 *     Один CSS + main + vendor; JS мінімізований (Terser), імена *.min.js.
 *
 *   npm run build:wp
 *     Чанки для WordPress (окремі файли по компонентах/модулях).
 *     Еквівалент: vite build --mode wp
 *
 *   npm run build:js-readable
 *     Як build, але JS без мінімізації (читабельний код, імена *.js).
 *     Еквівалент: VITE_MINIFY_JS=false vite build
 *
 *   npm run build:wp:readable
 *     Режим wp + JS без мінімізації.
 *
 * Змінні середовища (перед vite build або в .env)
 *   VITE_ASSET_SPLIT=single | wp
 *     single — злиті асети (дефолт у build.config.mjs).
 *     wp     — розбиття чанків (альтернатива до --mode wp).
 *
 *   VITE_MINIFY_JS=true | false
 *     true  — Terser, drop_console, *.min.js (дефолт).
 *     false — без стиснення JS, *.js (дебаг у темі WP).
 *
 * build.config.mjs — ASSET_SPLIT; MINIFY_JS_PRESET (boolean або null) перекриває env.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import sassGlobImports from "vite-plugin-sass-glob-import";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";
import fs from "fs";
import { readdirSync } from "fs";
import { exec } from "child_process";

import { ASSET_SPLIT, MINIFY_JS } from "./build.config.mjs";

// Імпортуємо скрипт генерації sprite
import { generateIconsPage } from "./scripts/generate-icons-page.js";
import { devPagesNavPlugin } from "./scripts/dev-pages-nav.js";

// --- 1. ЗАПУСКАЄМО ГЕНЕРАЦІЮ ІКОНОК ПРИ СТАРТІ ---
generateIconsPage();

const pagesDir = resolve(__dirname, "src");
const pages = {};

// Збираємо HTML сторінки
readdirSync(pagesDir).forEach((file) => {
    if (file.endsWith(".html") && file !== "icons.html") {
        let name = file.replace(".html", "");
        if (name === "index") name = "main";
        pages[name] = resolve(pagesDir, file);
    }
});

const USE_ICONS = true;
const USE_LOCAL_FONTS = true;

/**
 * Розбиття чанків для WordPress: окремі JS (і при cssCodeSplit — CSS) по компонентах і модулях.
 * Увімкнення: npm run build:wp або VITE_ASSET_SPLIT=wp vite build
 */
function wpManualChunks(id) {
    if (id.includes("node_modules")) {
        return "vendor";
    }
    const componentMatch = id.match(/[/\\]components[/\\]([^/\\]+)[/\\]/);
    if (componentMatch) {
        return componentMatch[1].replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();
    }
    const moduleMatch = id.match(/[/\\]assets[/\\]js[/\\]modules[/\\]([^/\\]+)\.js$/);
    if (moduleMatch) {
        return `module-${moduleMatch[1]}`;
    }
}

/** Для WP-режиму: база (main) → бібліотеки (vendor) → стилі компонентів. */
function wpReorderStylesheetLinks() {
    return {
        name: "wp-reorder-stylesheets",
        transformIndexHtml: {
            order: "post",
            handler(html) {
                const linkRe =
                    /<link\s+[^>]*rel="stylesheet"[^>]*>\s*|<link\s+rel="stylesheet"[^>]*>\s*/gi;
                const tags = html.match(linkRe);
                if (!tags || tags.length < 2) return html;

                const rankHref = (tag) => {
                    const href = /href="([^"]+)"/i.exec(tag)?.[1] ?? "";
                    if (/\/main\.min\.css/i.test(href)) return 0;
                    if (/\/vendor\.min\.css/i.test(href)) return 1;
                    return 2;
                };
                const sorted = [...tags].sort((a, b) => {
                    const d = rankHref(a) - rankHref(b);
                    if (d !== 0) return d;
                    const ha = /href="([^"]+)"/i.exec(a)?.[1] ?? "";
                    const hb = /href="([^"]+)"/i.exec(b)?.[1] ?? "";
                    return ha.localeCompare(hb);
                });

                let stripped = html;
                for (const t of tags) {
                    stripped = stripped.replace(t, "");
                }
                const block = sorted.join("\n  ");
                return stripped.replace("</head>", `  ${block}\n</head>`);
            },
        },
    };
}

export default defineConfig(({ mode, command }) => {
    const isProd = mode !== "development";
    const isWpSplit =
        command === "build" && (mode === "wp" || ASSET_SPLIT === "wp");
    const jsSuffix = MINIFY_JS ? ".min" : "";

    const iconsPath = resolve(__dirname, "src/assets/scss/_icons.scss");
    const fontsPath = resolve(__dirname, "src/assets/scss/_fonts.scss");
    const emptyPath = resolve(__dirname, "src/assets/scss/_empty.scss");

    const iconsAlias = USE_ICONS && fs.existsSync(iconsPath) ? iconsPath : emptyPath;
    const fontsAlias = USE_LOCAL_FONTS && fs.existsSync(fontsPath) ? fontsPath : emptyPath;

    return {
        root: "src",
        base: "./",

        server: {
            open: false,
            port: 5173,
        },

        build: {
            outDir: "../dist",
            emptyOutDir: true,
            cssCodeSplit: isWpSplit,
            sourcemap: !isProd,
            // MINIFY_JS=false у build.config.mjs / VITE_MINIFY_JS=false — без Terser, для дебагу
            minify: MINIFY_JS ? "terser" : false,
            terserOptions: MINIFY_JS
                ? {
                      compress: {
                          drop_console: true,
                          drop_debugger: true,
                      },
                      format: {
                          comments: false,
                      },
                  }
                : undefined,

            rollupOptions: {
                input: pages,

                output: {
                    entryFileNames: `assets/js/[name]${jsSuffix}.js`,
                    chunkFileNames: `assets/js/[name]${jsSuffix}.js`,

                    manualChunks(id) {
                        if (isWpSplit) {
                            return wpManualChunks(id);
                        }
                        if (id.includes("node_modules")) {
                            return "vendor";
                        }
                    },

                    assetFileNames: (assetInfo) => {
                        const info = assetInfo.name.split(".");
                        const ext = info[info.length - 1].toLowerCase();

                        if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                            return "assets/images/[name][extname]";
                        }
                        if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
                            return "assets/fonts/[name][extname]";
                        }
                        if (/css/i.test(ext)) {
                            return "assets/css/[name].min[extname]";
                        }
                        return "assets/[name][extname]";
                    },
                },
            },
        },

        css: {
            // --- ПОКРАЩЕННЯ 4: CSS міксіни ---
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: ["legacy-js-api", "import"],
                    additionalData: (content, filename) => {
                        if (filename.includes("_vars.scss") || filename.includes("_mixins.scss"))
                            return content;
                        return (
                            `@use "@/assets/scss/_vars.scss" as *; @use "@/assets/scss/_mixins.scss" as *;` +
                            content
                        );
                    },
                },
            },
        },

        plugins: [
            devPagesNavPlugin(),
            ...(isWpSplit ? [wpReorderStylesheetLinks()] : []),
            sassGlobImports(),
            handlebars({
                partialDirectory: resolve(__dirname, "src/components"),
                reloadOnPartialChange: true,
            }),
            viteStaticCopy({
                targets: [
                    {
                        src: "assets/images",
                        dest: "assets",
                    },
                    // Шрифти прибрали, бо Vite їх сам тягне з CSS
                ],
            }),
            {
                name: "hot-reload-components",
                handleHotUpdate({ file, server }) {
                    if (file.includes("components") && file.endsWith(".html")) {
                        server.ws.send({ type: "full-reload" });
                        return [];
                    }
                },
            },
            {
                name: "html-transform-img-alias",
                transformIndexHtml(html) {
                    return html.replace(/@img\//g, "./assets/images/");
                },
            },
            // --- 3. ПЛАГІН ДЛЯ ВІДКРИТТЯ icons.html ---
            {
                name: "open-pages-on-start",
                configureServer(server) {
                    const _printUrls = server.printUrls;
                    server.printUrls = () => {
                        _printUrls();

                        const port = server.config.server.port || 5173;
                        const mainUrl = `http://localhost:${port}/`;
                        const iconsUrl = `http://localhost:${port}/icons.html`;

                        // Команда залежно від ОС
                        const start =
                            process.platform == "darwin"
                                ? "open"
                                : process.platform == "win32"
                                  ? "start"
                                  : "xdg-open";

                        // 1. Спочатку відкриваємо іконки (щоб вони були у вкладці зліва/ззаду)
                        if (fs.existsSync(resolve(__dirname, "src/icons.html"))) {
                            exec(`${start} ${iconsUrl}`);
                        }

                        // 2. З невеликою затримкою відкриваємо головну, щоб вона отримала фокус
                        setTimeout(() => {
                            exec(`${start} ${mainUrl}`);
                            console.log(`  ➜  Opened: ${mainUrl} (and icons.html)`);
                        }, 500);
                    };
                },
            },
        ],

        resolve: {
            alias: {
                "@": resolve(__dirname, "src"),
                "@assets": resolve(__dirname, "src/assets"),
                "@img": resolve(__dirname, "src/assets/images"),
                "@scss": resolve(__dirname, "src/assets/scss"),
                "@js": resolve(__dirname, "src/assets/js"),
                "@fonts": resolve(__dirname, "src/assets/fonts"),
                "@components": resolve(__dirname, "src/components"),
                "@icons-style": iconsAlias,
                "@fonts-style": fontsAlias,
            },
        },
    };
});
