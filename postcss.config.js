export default {
    plugins: {
        'postcss-pxtorem': {
            rootValue: 16, // 1rem = 16px (базовий розмір шрифту браузера)
            propList: ['*'], // Конвертувати всі властивості (font-size, margin, padding, width...)
            unitPrecision: 5, // Кількість знаків після коми (0.12345rem)
            selectorBlackList: [], // Селектори, які ігнорувати (наприклад, ['.no-rem'])
            replace: true, // Замінювати px на rem, а не дублювати
            mediaQuery: false, // Чи конвертувати px у медіа-запитах (@media (min-width: 768px)...)
            minPixelValue: 2, // Мінімальне значення. 1px не буде конвертуватись (щоб рамки залишались чіткими)
        },
    },
}
