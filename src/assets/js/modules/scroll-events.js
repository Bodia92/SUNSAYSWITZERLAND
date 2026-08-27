export function initScrollObserver() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            document.body.classList.add('is-scrolled')
        } else {
            document.body.classList.remove('is-scrolled')
        }
    })
}
