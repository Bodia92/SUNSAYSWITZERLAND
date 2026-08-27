import fs from "fs";
import path from "path";
import ttf2woff2 from "ttf2woff2";

const srcFolder = "src/assets/fonts/src";
const distFolder = "src/assets/fonts";
const scssFile = "src/assets/scss/_fonts.scss";

const weights = {
    thin: 100,
    extralight: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    heavy: 800,
    black: 900,
};

async function convertFonts() {
    if (!fs.existsSync(srcFolder)) {
        console.error(`Папка ${srcFolder} не знайдена!`);
        return;
    }

    if (!fs.existsSync(distFolder)) {
        fs.mkdirSync(distFolder, { recursive: true });
    }

    const files = fs.readdirSync(srcFolder);
    let scssContent = "// Файл згенеровано автоматично\n";

    // Об'єкт для групування шрифтів за назвою
    // { "Muller-Bold": { family: "Muller", weight: 700, style: "normal", sources: [] } }
    const fontsCollection = {};

    files.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        const fileName = path.basename(file, ext); // Muller-Bold
        const inputPath = path.join(srcFolder, file);

        let outputName = "";
        let formatStr = "";

        // --- 1. ОБРОБКА ТА КОНВЕРТАЦІЯ ---

        if (ext === ".ttf" || ext === ".otf") {
            outputName = `${fileName}.woff2`;
            formatStr = "woff2";
            const outputPath = path.join(distFolder, outputName);
            const input = fs.readFileSync(inputPath);
            fs.writeFileSync(outputPath, ttf2woff2(input));
            console.log(`Converted: ${file} -> ${outputName}`);
        } else if (ext === ".woff2") {
            outputName = file;
            formatStr = "woff2";
            fs.copyFileSync(inputPath, path.join(distFolder, outputName));
            console.log(`Copied: ${file}`);
        } else if (ext === ".woff") {
            outputName = file;
            formatStr = "woff";
            fs.copyFileSync(inputPath, path.join(distFolder, outputName));
            console.log(`Copied: ${file}`);
        } else {
            return;
        }

        // --- 2. АНАЛІЗ ПАРАМЕТРІВ ---
        if (!fontsCollection[fileName]) {
            let weight = 400;
            let style = "normal";
            let familyName = fileName;
            const parts = fileName.split(/[- ]/);

            if (parts.length > 1) {
                const suffix = parts.pop().toLowerCase();
                if (suffix.includes("italic")) style = "italic";
                const cleanSuffix = suffix.replace("italic", "");
                if (weights[cleanSuffix]) {
                    weight = weights[cleanSuffix];
                    familyName = parts.join(" ");
                } else {
                    if (!suffix.includes("italic")) parts.push(suffix);
                    familyName = fileName;
                }
            }

            fontsCollection[fileName] = {
                family: familyName,
                weight: weight,
                style: style,
                sources: [],
            };
        }

        // Додаємо джерело у колекцію
        // WOFF2 ставимо першим (unshift), WOFF останнім (push) для пріоритету
        if (formatStr === "woff2") {
            fontsCollection[fileName].sources.unshift(
                `url('../fonts/${outputName}') format('${formatStr}')`,
            );
        } else {
            fontsCollection[fileName].sources.push(
                `url('../fonts/${outputName}') format('${formatStr}')`,
            );
        }
    });

    // --- 3. ГЕНЕРАЦІЯ CSS З КОЛЕКЦІЇ ---
    for (const key in fontsCollection) {
        const font = fontsCollection[key];
        // Об'єднуємо джерела через кому
        const srcString = font.sources.join(",\n\t\t");

        scssContent += `
@font-face {
    font-family: '${font.family}';
    src: ${srcString};
    font-weight: ${font.weight};
    font-style: ${font.style};
    font-display: swap;
}
`;
    }

    fs.writeFileSync(scssFile, scssContent);
    console.log(`Updated SCSS: ${scssFile}`);
}

convertFonts();
