class BaseComponent extends HTMLElement {
  constructor(options = {}) {
    super();
    this.useShadowDOM = options.useShadowDOM ?? false;

    if (this.useShadowDOM) {
      this.attachShadow({ mode: "open" });
    }
  }

  get root() {
    return this.shadowRoot || this;
  }

  qs(selector) {
    return this.root.querySelector(selector);
  }

  qsa(selector) {
    return this.root.querySelectorAll(selector);
  }

  emit(eventName, detail = {}, options = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: options.bubbles ?? true,
      composed: options.composed ?? true,
      cancelable: options.cancelable ?? true,
    });
    this.dispatchEvent(event);
    return event;
  }

  connectedCallback() {
    if (typeof this.render === "function") {
      this.render();
    }
    if (typeof this.setupListeners === "function") {
      this.setupListeners();
    }
  }
}

export { BaseComponent };

