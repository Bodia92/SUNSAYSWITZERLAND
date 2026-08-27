import fs from "fs";
import path from "path";

// Шлях до твого спрайта
const spritePath = "src/assets/images/sprite.svg";
// Куди зберегти HTML файл для перегляду
const outputHtmlPath = "src/icons.html";

export function generateIconsPage() {
    if (!fs.existsSync(spritePath)) {
        console.log("Спрайт не знайдено!");
        return;
    }

    const svgContent = fs.readFileSync(spritePath, "utf-8");

    // Шукаємо всі ID символів за допомогою регулярки
    const regex = /<symbol[^>]*id=["']([^"']+)["'][^>]*>/g;
    let match;
    let iconsHtml = "";

    while ((match = regex.exec(svgContent)) !== null) {
        const id = match[1];
        iconsHtml += `
            <div class="icon-card" onclick="copyToClipboard('${id}')">
                <svg class="icon">
                    <use href="assets/images/sprite.svg#${id}"></use>
                </svg>
                <div class="icon-name">${id}</div>
            </div>
        `;
    }

    const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Icons Preview</title>
        <style>
            body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
            h1 { text-align: center; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
            .icon-card { 
                background: white; padding: 20px; border-radius: 8px; 
                display: flex; flex-direction: column; align-items: center; 
                cursor: pointer; transition: transform 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .icon-card:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .icon { width: 40px; height: 40px; margin-bottom: 10px; fill: #333; }
            .icon-name { font-size: 12px; color: #666; word-break: break-all; text-align: center; }
        </style>
    </head>
    <body>
        <h1>Icons Preview (Click to copy ID)</h1>
        <div class="grid">
            ${iconsHtml}
        </div>
        <script>
            function copyToClipboard(id) {
                navigator.clipboard.writeText(id).then(() => {
                    alert('Copied: ' + id);
                });
            }
        </script>
    </body>
    </html>
    `;

    fs.writeFileSync(outputHtmlPath, fullHtml);
    console.log(`Icons page generated: ${outputHtmlPath}`);
}

// generateIconsPage();
