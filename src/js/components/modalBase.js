import { BaseComponent } from "./baseComponent.js";

class ModalBase extends BaseComponent {
  constructor(options = {}) {
    super({ useShadowDOM: false });
    this._title = options.title ?? "";
    this._maxWidth = options.maxWidth ?? "600px";
    this._showCloseButton = options.showCloseButton !== false;
    this._dialogId = options.dialogId ?? "modal-dialog";
  }

  render() {
    this.innerHTML = `
      <dialog id="${this._dialogId}">
        <article style="max-width: ${this._maxWidth}; width: 100%;">
          <header style="display: flex; justify-content: space-between; align-items: center;">
            <strong id="modal-title">${this._title}</strong>
            ${this._showCloseButton ? '<button aria-label="Cerrar" rel="prev" class="close-btn" style="width: auto; padding: 0.25rem 0.5rem;"></button>' : ""}
          </header>
          <div id="modal-body" style="padding-top: 1rem;"></div>
        </article>
      </dialog>
    `;
  }

  setupListeners() {
    const dialog = this.qs("dialog");
    if (dialog) {
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) this.close();
      });
    }
    if (this._showCloseButton) {
      this.qs(".close-btn")?.addEventListener("click", () => this.close());
    }
  }

  showDialog() {
    const dialog = this.qs("dialog");
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "true");
    }
  }

  close() {
    const dialog = this.qs("dialog");
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  setTitle(text) {
    const el = this.qs("#modal-title");
    if (el) el.textContent = text;
  }

  setBody(html) {
    const el = this.qs("#modal-body");
    if (el) el.innerHTML = html;
  }

  setBodyElement(element) {
    const el = this.qs("#modal-body");
    if (el) {
      el.innerHTML = "";
      el.appendChild(element);
    }
  }
}

export { ModalBase };
