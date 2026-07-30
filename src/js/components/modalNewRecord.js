import { BaseComponent } from "./baseComponent.js";
import {
  initFormOrdenes,
  procesarCreacionOrden,
} from "../src/js/ordenes.jss.js";

class ModalNewRecord extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    this.currentTable = "";
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
        if (e.target === dialog) {
          this.close();
        }
      });
    }
  }

  async openMenu() {
    const titleEl = this.qs("#modal-title");
    const bodyEl = this.qs("#modal-body");

    if (titleEl) titleEl.textContent = "Crear Nuevo Registro";

    try {
      const response = await fetch("components/modalMenuNuevo.html");
      const htmlContent = await response.text();
      if (bodyEl) {
        bodyEl.innerHTML = htmlContent;

        // Configurar clicks de botones del menú
        const buttons = bodyEl.querySelectorAll("button[data-type]");
        buttons.forEach((btn) => {
          btn.addEventListener("click", () => {
            const targetType = btn.dataset.type;
            this.loadForm(targetType);
          });
        });
      }
    } catch (e) {
      console.error("Error al cargar menú de nuevo registro:", e);
    }

    this.showDialog();
  }

  async loadForm(tableName) {
    this.currentTable = tableName;
    const titleEl = this.qs("#modal-title");
    const bodyEl = this.qs("#modal-body");

    const titles = {
      clientes: "Nuevo Cliente",
      productos: "Nuevo Producto",
      ordenes: "Nueva Orden",
    };

    if (titleEl) {
      titleEl.textContent = titles[tableName] || `Nuevo (${tableName})`;
    }

    try {
      const response = await fetch(`components/formulario_${tableName}.html`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const htmlContent = await response.text();

      if (bodyEl) {
        bodyEl.innerHTML = htmlContent;

        // Si es ordenes, inicializar selects y productos
        if (tableName === "ordenes") {
          initFormOrdenes(bodyEl);
        }

        // Listener de envíos
        const form = bodyEl.querySelector("form");
        if (form) {
          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await this.handleSubmit(form, tableName);
          });
        }

        // Botón cancelar
        const cancelBtn = bodyEl.querySelector(".btn-cancel");
        if (cancelBtn) {
          cancelBtn.addEventListener("click", (e) => {
            e.preventDefault();
            this.close();
          });
        }
      }
    } catch (error) {
      console.error(`Error al cargar el formulario para ${tableName}:`, error);
      if (bodyEl) {
        bodyEl.innerHTML = `<p style="color: red;">Error al cargar el formulario de ${tableName}.</p>`;
      }
    }

    this.showDialog();
  }

  async handleSubmit(formElement, tableName) {
    try {
      if (tableName === "ordenes") {
        await procesarCreacionOrden(formElement);
      } else {
        const formData = new FormData(formElement);
        const payload = Object.fromEntries(formData.entries());

        // Convertir precio a número si corresponde
        if (payload.precio) {
          payload.precio = parseFloat(payload.precio);
        }

        this.emit("save-record", {
          tableName,
          payload,
        });
      }

      this.emit("record-created", { tableName });
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
