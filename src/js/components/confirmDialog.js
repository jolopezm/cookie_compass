import { ModalBase } from "./modalBase.js";

class ConfirmDialog extends ModalBase {
  constructor() {
    super({ showCloseButton: false, maxWidth: "400px", dialogId: "confirm-dialog" });
  }

  render() {
    super.render();
    const article = this.qs("article");
    article.insertAdjacentHTML("beforeend", `
      <footer style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button id="confirm-cancel-btn" class="secondary outline">Cancelar</button>
        <button id="confirm-ok-btn" class="contrast">Confirmar</button>
      </footer>
    `);
  }

  show(message) {
    this.setTitle("Confirmar acción");
    this.setBody(`<p>${message}</p>`);

    const dialog = this.qs("dialog");
    const okBtn = this.qs("#confirm-ok-btn");
    const cancelBtn = this.qs("#confirm-cancel-btn");

    return new Promise((resolve) => {
      const cleanup = () => {
        okBtn?.removeEventListener("click", onConfirm);
        cancelBtn?.removeEventListener("click", onCancel);
        dialog?.removeEventListener("click", onBackdrop);
        dialog?.removeEventListener("close", onCancel);
      };

      const onConfirm = () => {
        cleanup();
        this.close();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        this.close();
        resolve(false);
      };

      const onBackdrop = (e) => {
        if (e.target === dialog) onCancel();
      };

      okBtn?.addEventListener("click", onConfirm);
      cancelBtn?.addEventListener("click", onCancel);
      dialog?.addEventListener("click", onBackdrop);
      dialog?.addEventListener("close", onCancel);

      this.showDialog();
    });
  }
}

if (!customElements.get("confirm-dialog")) {
  customElements.define("confirm-dialog", ConfirmDialog);
}

export { ConfirmDialog };
