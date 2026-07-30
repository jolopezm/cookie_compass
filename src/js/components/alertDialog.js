import { ModalBase } from "./modalBase.js";

const ICONS = {
  error: "\u274C",
  warning: "\u26A0\uFE0F",
  success: "\u2705",
  info: "\u2139\uFE0F",
};

class AlertDialog extends ModalBase {
  constructor() {
    super({ showCloseButton: false, maxWidth: "420px", dialogId: "alert-dialog" });
    this._resolve = null;
  }

  render() {
    super.render();
    const article = this.qs("article");
    article.insertAdjacentHTML("beforeend", `
      <footer style="display: flex; justify-content: flex-end;">
        <button id="alert-ok-btn" class="contrast">Aceptar</button>
      </footer>
    `);
  }

  setupListeners() {
    super.setupListeners();
    const okBtn = this.qs("#alert-ok-btn");
    if (okBtn) {
      okBtn.addEventListener("click", () => {
        this.close();
        if (this._resolve) {
          this._resolve();
          this._resolve = null;
        }
      });
    }

    const dialog = this.qs("dialog");
    if (dialog) {
      dialog.addEventListener("close", () => {
        if (this._resolve) {
          this._resolve();
          this._resolve = null;
        }
      });
    }
  }

  show({ message, title = "Aviso", type = "info" } = {}) {
    this.setTitle(title);

    this.setBody(`
      <p style="display: flex; gap: 0.5rem; align-items: flex-start;">
        <span style="font-size: 1.25rem;">${ICONS[type] || ICONS.info}</span>
        <span id="alert-message"></span>
      </p>
    `);

    const msgEl = this.qs("#alert-message");
    if (msgEl) msgEl.textContent = message;

    this.showDialog();

    return new Promise((resolve) => {
      this._resolve = resolve;
    });
  }
}

if (!customElements.get("alert-dialog")) {
  customElements.define("alert-dialog", AlertDialog);
}

export { AlertDialog };
