import NiceSelect from "nice-select2";
// Імпорт стилів обов'язковий (можна в JS, можна в SCSS)
import "nice-select2/dist/css/nice-select2.css";

export function initSelects() {
    const selects = document.querySelectorAll(".js-select");

    selects.forEach((select) => {
        new NiceSelect(select, {
            searchable: false, // Можна включити true, якщо треба пошук
            // placeholder: "Service",
        });
    });
}
