import { BaseComponent } from "./baseComponent.js";

class ConfirmDialog extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
  }

  render() {
    this.innerHTML = `
      <dialog id="confirm-dialog">
        <article style="max-width: 400px; width: 100%;">
          <header>
            <strong>Confirmar acción</strong>
          </header>
          <div id="confirm-message" style="padding: 1rem 0;"></div>
          <footer style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="confirm-cancel-btn" class="secondary outline">Cancelar</button>
            <button id="confirm-ok-btn" class="contrast">Confirmar</button>
          </footer>
        </article>
      </dialog>
    `;
  }

  show(message) {
    const dialog = this.qs("#confirm-dialog");
    const msgEl = this.qs("#confirm-message");
    if (msgEl) msgEl.textContent = message;

    return new Promise((resolve) => {
      const okBtn = this.qs("#confirm-ok-btn");
      const cancelBtn = this.qs("#confirm-cancel-btn");

      const cleanup = () => {
        okBtn.removeEventListener("click", onConfirm);
        cancelBtn.removeEventListener("click", onCancel);
        dialog.removeEventListener("click", onBackdrop);
        dialog.removeEventListener("close", onCancel);
      };

      const onConfirm = () => {
        cleanup();
        dialog.close();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        dialog.close();
        resolve(false);
      };

      const onBackdrop = (e) => {
        if (e.target === dialog) onCancel();
      };

      okBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);
      dialog.addEventListener("click", onBackdrop);
      dialog.addEventListener("close", onCancel);

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "true");
      }
    });
  }
}

if (!customElements.get("confirm-dialog")) {
  customElements.define("confirm-dialog", ConfirmDialog);
}

export { ConfirmDialog };
