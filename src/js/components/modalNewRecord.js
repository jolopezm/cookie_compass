import { ModalBase } from "./modalBase.js";
import "./formularioCliente.js";
import "./formularioProducto.js";
import "./formularioOrden.js";

class ModalNewRecord extends ModalBase {
  constructor() {
    super({ title: "Nuevo Registro", dialogId: "new-record-dialog" });
    this.currentTable = "";
    this.editData = null;
  }

  openMenu() {
    this.setTitle("Crear Nuevo Registro");
    this.setBody(`
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
    `);

    this.qs("#modal-body")?.querySelectorAll("button[data-type]").forEach((btn) => {
      btn.addEventListener("click", () => this.loadForm(btn.dataset.type));
    });

    this.showDialog();
  }

  openForEdit(tableName, recordData) {
    this.editData = recordData;
    this.loadForm(tableName, recordData);
  }

  async loadForm(tableName, data = null) {
    this.currentTable = tableName;

    const titles = {
      clientes: data ? "Editar Cliente" : "Nuevo Cliente",
      productos: data ? "Editar Producto" : "Nuevo Producto",
      ordenes: "Nueva Orden",
    };

    this.setTitle(titles[tableName] || (data ? `Editar (${tableName})` : `Nuevo (${tableName})`));

    const bodyEl = this.qs("#modal-body");
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
      this.emit("alert", { message: `Error al guardar: ${error.message}`, type: "error" });
      console.error("Error al procesar formulario:", error);
    }
  }
}

if (!customElements.get("modal-new-record")) {
  customElements.define("modal-new-record", ModalNewRecord);
}

export { ModalNewRecord };
