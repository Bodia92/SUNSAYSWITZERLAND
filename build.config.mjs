/**
 * Режим збірки асетів (JS/CSS).
 *
 * "single" — один злитий CSS і мінімум JS-файлів (лендінг, одна сторінка, швидкий огляд).
 * "wp"     — чанки по папках components/* та assets/js/modules/* + vendor; зручно під WordPress.
 *
 * Перекривається змінною середовища VITE_ASSET_SPLIT (single | wp).
 *
 * Мінімізація JS: MINIFY_JS (див. нижче) або VITE_MINIFY_JS=false.
 */
export const ASSET_SPLIT =
    process.env.VITE_ASSET_SPLIT === "wp" || process.env.VITE_ASSET_SPLIT === "single"
        ? process.env.VITE_ASSET_SPLIT
        : "single";

/**
 * Мінімізація JS (Terser) і суфікс імен файлів (.min.js vs .js).
 * null — брати з VITE_MINIFY_JS; true/false — зафіксувати для всього репозиторію.
 */
export const MINIFY_JS_PRESET = null;

const minifyJsRaw = process.env.VITE_MINIFY_JS?.toLowerCase();
const minifyJsFromEnv =
    minifyJsRaw === "false" || minifyJsRaw === "0" || minifyJsRaw === "no" ? false : true;

export const MINIFY_JS =
    typeof MINIFY_JS_PRESET === "boolean" ? MINIFY_JS_PRESET : minifyJsFromEnv;
