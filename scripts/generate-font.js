import webfont from 'webfont'
import fs from 'fs'
import path from 'path'

webfont
    .default({
        // 1. ВИПРАВЛЕНО: Додано 'src/' на початок
        files: 'src/assets/icons/*.svg',

        fontName: 'my-icons',
        dest: 'src/assets/fonts/',
        template: 'scss',
        templateClassName: 'icon',

        // 2. ВИПРАВЛЕНО: Абсолютний шлях для надійності
        templateFontPath: '/assets/fonts/',

        templateFontName: 'my-icons',
    })
    .then((result) => {
        // Зберігаємо SCSS
        fs.writeFileSync('src/assets/scss/_icons.scss', result.template)

        // Створюємо папку, якщо немає
        const dest = 'src/assets/fonts/'
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })

        // Зберігаємо шрифти
        // ВАЖЛИВО: Перевіряємо, чи є результат, перед записом
        if (result.woff2) {
            fs.writeFileSync(path.join(dest, 'my-icons.woff2'), result.woff2)
        }
        if (result.woff) {
            fs.writeFileSync(path.join(dest, 'my-icons.woff'), result.woff)
        }
        // Додай ttf/eot/svg якщо вони тобі потрібні (але woff2/woff зазвичай достатньо)
        // fs.writeFileSync(path.join(dest, 'my-icons.ttf'), result.ttf);

        console.log('✅ Icon font generated successfully!')
    })
    .catch((error) => {
        console.error('❌ Error generating icons:', error)
    })
