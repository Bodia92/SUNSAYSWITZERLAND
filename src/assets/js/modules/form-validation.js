/**
 * Frontend contact-form validation + light anti-spam (honeypot, min fill time).
 */

const MIN_FILL_MS = 2500;
const NAME_RE = /^[\p{L}\p{M}'’.\-\s]{2,80}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+]?[\d\s().\-]{7,30}$/;
const URL_RE = /https?:\/\/|www\.|\.(com|net|org|info|ru|ua|xyz|top)\b/i;

const MESSAGES = {
    required: "This field is required",
    name: "Please enter a valid name",
    email: "Please enter a valid email",
    phone: "Please enter a valid phone number",
    messageSpam: "Please remove links from your message",
    messageLong: "Message is too long",
};

export function initFormValidation(root = document) {
    const forms = [...root.querySelectorAll("form[data-validate]")];
    forms.forEach((form) => setupForm(form));
}

function setupForm(form) {
    if (form.dataset.validateReady === "1") return;
    form.dataset.validateReady = "1";

    const startedInput = form.querySelector("[data-form-started]");
    if (startedInput) {
        startedInput.value = String(Date.now());
    }

    form.setAttribute("autocomplete", "off");
    form.querySelectorAll("input, textarea, select").forEach((el) => {
        if (!el.hasAttribute("autocomplete")) {
            el.setAttribute("autocomplete", "off");
        }
    });

    form.addEventListener("submit", (event) => {
        if (isHoneypotFilled(form) || isFilledTooFast(form)) {
            event.preventDefault();
            event.stopPropagation();
            form.reset();
            return;
        }

        const valid = validateForm(form);
        if (!valid) {
            event.preventDefault();
            event.stopPropagation();
            const firstInvalid = form.querySelector(".form-input.is-invalid");
            firstInvalid?.focus({ preventScroll: false });
        }
    });

    form.addEventListener("input", (event) => {
        const field = event.target.closest(".form-input");
        if (!field || !field.classList.contains("is-invalid")) return;
        clearFieldError(field);
    });

    form.addEventListener("blur", (event) => {
        const field = event.target.closest(".form-input");
        if (!field || field.closest(".form-honeypot")) return;
        validateField(field);
    }, true);
}

function isHoneypotFilled(form) {
    const honey = form.querySelector(".form-honeypot input");
    return Boolean(honey?.value?.trim());
}

function isFilledTooFast(form) {
    const startedInput = form.querySelector("[data-form-started]");
    const started = Number(startedInput?.value || 0);
    if (!started) return false;
    return Date.now() - started < MIN_FILL_MS;
}

function validateForm(form) {
    clearFormErrors(form);
    const fields = [...form.querySelectorAll(".form-input")].filter(
        (el) => !el.closest(".form-honeypot"),
    );

    let ok = true;
    fields.forEach((field) => {
        if (!validateField(field)) ok = false;
    });
    return ok;
}

function validateField(field) {
    const value = field.value.trim();
    const required = field.required || field.hasAttribute("required");

    if (!value) {
        if (required) {
            setFieldError(field, MESSAGES.required);
            return false;
        }
        clearFieldError(field);
        return true;
    }

    if (field.hasAttribute("data-validate-name") && !NAME_RE.test(value)) {
        setFieldError(field, MESSAGES.name);
        return false;
    }

    if (field.hasAttribute("data-validate-email") && !EMAIL_RE.test(value)) {
        setFieldError(field, MESSAGES.email);
        return false;
    }

    if (field.hasAttribute("data-validate-phone")) {
        const digits = value.replace(/\D/g, "");
        if (!PHONE_RE.test(value) || digits.length < 7) {
            setFieldError(field, MESSAGES.phone);
            return false;
        }
    }

    if (field.hasAttribute("data-validate-message")) {
        if (value.length > 2000) {
            setFieldError(field, MESSAGES.messageLong);
            return false;
        }
        if (URL_RE.test(value)) {
            setFieldError(field, MESSAGES.messageSpam);
            return false;
        }
    }

    clearFieldError(field);
    return true;
}

function setFieldError(field, message) {
    const group = field.closest(".form-group") || field.parentElement;
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");

    let error = group.querySelector(".form-error");
    if (!error) {
        error = document.createElement("span");
        error.className = "form-error";
        error.setAttribute("role", "alert");
        group.appendChild(error);
    }
    error.textContent = message;
}

function clearFieldError(field) {
    const group = field.closest(".form-group") || field.parentElement;
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    group?.querySelector(".form-error")?.remove();
}

function clearFormErrors(form) {
    form.querySelectorAll(".form-input.is-invalid").forEach((field) => clearFieldError(field));
}
