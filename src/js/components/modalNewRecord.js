import { BaseComponent } from "./baseComponent.js";
import "./formularioCliente.js";
import "./formularioProducto.js";
import "./formularioOrden.js";

class ModalNewRecord extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    this.currentTable = "";
    this.editData = null;
  }

  render() {
    this.innerHTML = `
      <dialog id="new-record-dialog">
        <article style="max-width: 600px; width: 100%;">
          <header style="display: flex; justify-content: space-between; align-items: center;">
            <strong id="modal-title">Nuevo Registro</strong>
            <button aria-label="Cerrar" rel="prev" class="close-btn" id="modal-close-header" style="width: auto; padding: 0.25rem 0.5rem;"></button>
          </header>
          <div id="modal-body" style="padding-top: 1rem;"></div>
        </article>
      </dialog>
    `;
  }

  setupListeners() {
    const dialog = this.qs("#new-record-dialog");
    const closeHeaderBtn = this.qs("#modal-close-header");

    if (closeHeaderBtn) {
      closeHeaderBtn.addEventListener("click", () => this.close());
    }

    if (dialog) {
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) this.close();
      });
    }
  }

  openMenu() {
    const titleEl = this.qs("#modal-title");
    const bodyEl = this.qs("#modal-body");

    if (titleEl) titleEl.textContent = "Crear Nuevo Registro";
    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <p>Selecciona el tipo de registro que deseas crear:</p>
          <button type="button" class="outline" data-type="clientes" style="text-align: left; padding: 1rem;">
            👤 <strong>Nuevo Cliente</strong>
            <br><small style="color: var(--pico-muted-color);">Registrar un nuevo cliente en el sistema</small>
          </button>
          <button type="button" class="outline secondary" data-type="productos" style="text-align: left; padding: 1rem;">
            📦 <strong>Nuevo Producto</strong>
            <br><small style="color: var(--pico-muted-color);">Agregar un producto con su precio unitario</small>
          </button>
          <button type="button" class="outline contrast" data-type="ordenes" style="text-align: left; padding: 1rem;">
            🛒 <strong>Nueva Orden</strong>
            <br><small style="color: var(--pico-muted-color);">Crear una venta asociando cliente y productos</small>
          </button>
        </div>
      `;

      bodyEl.querySelectorAll("button[data-type]").forEach((btn) => {
        btn.addEventListener("click", () => this.loadForm(btn.dataset.type));
      });
    }

    this.showDialog();
  }

  openForEdit(tableName, recordData) {
    this.editData = recordData;
    this.loadForm(tableName, recordData);
  }

  async loadForm(tableName, data = null) {
    this.currentTable = tableName;
    const titleEl = this.qs("#modal-title");
    const bodyEl = this.qs("#modal-body");

    const titles = {
      clientes: data ? "Editar Cliente" : "Nuevo Cliente",
      productos: data ? "Editar Producto" : "Nuevo Producto",
      ordenes: "Nueva Orden",
    };

    if (titleEl) titleEl.textContent = titles[tableName] || (data ? `Editar (${tableName})` : `Nuevo (${tableName})`);
    if (!bodyEl) return;

    bodyEl.innerHTML = "";

    const tagName = `formulario-${tableName}`;
    if (customElements.get(tagName)) {
      const form = document.createElement(tagName);
      form.addEventListener("form-submit", (e) => this.handleSubmit(e.detail));
      form.addEventListener("form-cancel", () => this.close());
      bodyEl.appendChild(form);
      if (data && typeof form.setData === "function") {
        form.setData(data);
      }
    } else {
      bodyEl.innerHTML = `<p style="color: red;">Formulario no disponible para "${tableName}".</p>`;
    }

    this.showDialog();
  }

  async handleSubmit(detail) {
    try {
      if (detail.tableName !== "ordenes") {
        const eventName = detail.id ? "update-record" : "save-record";
        this.emit(eventName, {
          tableName: detail.tableName,
          payload: detail.payload,
          id: detail.id,
        });
      }

      this.emit("record-created", { tableName: detail.tableName });
      this.editData = null;
      this.close();
    } catch (error) {
      alert(`Error al guardar: ${error.message}`);
      console.error("Error al procesar formulario:", error);
    }
  }

  showDialog() {
    const dialog = this.qs("#new-record-dialog");
    if (dialog && typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (dialog) {
      dialog.setAttribute("open", "true");
    }
  }

  close() {
    const dialog = this.qs("#new-record-dialog");
    if (dialog && typeof dialog.close === "function") {
      dialog.close();
    } else if (dialog) {
      dialog.removeAttribute("open");
    }
  }
}

if (!customElements.get("modal-new-record")) {
  customElements.define("modal-new-record", ModalNewRecord);
}

export { ModalNewRecord };
