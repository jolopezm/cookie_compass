import { BaseComponent } from "./baseComponent.js";
import { procesarCreacionOrden } from "../ordenes.js";
import { formatPrice } from "../tableManager.js";
import dataStore from "../dataStore.js";

class FormularioOrden extends BaseComponent {
  connectedCallback() {
    super.connectedCallback();
    this.initForm();
  }

  render() {
    this.innerHTML = `
      <form id="form-orden">
        <label for="selector-cliente">Seleccionar Cliente:</label>
        <select id="selector-cliente" name="id_cliente" required>
          <option value="" disabled selected>-- Elija un cliente --</option>
        </select>

        <fieldset>
          <legend><strong>Productos a ordenar:</strong></legend>
          <div id="productos-container" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 250px; overflow-y: auto; padding-right: 0.5rem;"></div>
        </fieldset>

        <div style="background-color: var(--pico-card-background-color, #f8f9fa); padding: 0.75rem; border-radius: 6px; margin: 1rem 0; display: flex; justify-content: space-between; align-items: center;">
          <span><strong>Total Estimado:</strong></span>
          <span id="total-preview" style="font-size: 1.25rem; font-weight: bold; color: var(--pico-primary, #007bff);">$0.00</span>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button type="button" class="secondary outline btn-cancel">Cancelar</button>
          <button type="submit" class="contrast">Confirmar y Crear Orden</button>
        </div>
      </form>
    `;
  }

  initForm() {
    const selectorCliente = this.qs("#selector-cliente");
    const productosContainer = this.qs("#productos-container");
    const totalPreview = this.qs("#total-preview");

    if (!selectorCliente || !productosContainer) return;

    const clientes = dataStore.getTable("clientes") || [];
    selectorCliente.innerHTML = `<option value="" disabled selected>-- Elija un cliente --</option>`;
    clientes.forEach((cliente) => {
      const opt = document.createElement("option");
      opt.value = cliente.id;
      opt.textContent = cliente.nombre;
      selectorCliente.appendChild(opt);
    });

    const productos = dataStore.getTable("productos") || [];
    productosContainer.innerHTML = "";

    if (productos.length === 0) {
      productosContainer.innerHTML = `<p style="color: var(--pico-muted-color);">No hay productos registrados en el sistema.</p>`;
      return;
    }

    productos.forEach((prod) => {
      const row = document.createElement("div");
      row.className = "grid";
      row.style.cssText =
        "align-items: center; grid-template-columns: 1fr 120px; gap: 1rem; margin-bottom: 0.5rem;";

      row.innerHTML = `
        <label style="margin-bottom: 0; cursor: pointer;">
          <input type="checkbox" class="checkbox-producto" data-id="${prod.id}" data-precio="${prod.precio}" />
          <strong>${prod.nombre}</strong> ($${parseFloat(prod.precio).toFixed(2)})
        </label>
        <input type="number" min="1" value="1" class="cantidad-producto" data-id="${prod.id}" disabled style="margin-bottom: 0;" placeholder="Cant." />
      `;
      productosContainer.appendChild(row);
    });

    const checkboxes =
      productosContainer.querySelectorAll(".checkbox-producto");
    checkboxes.forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const prodId = e.target.dataset.id;
        const cantInput = productosContainer.querySelector(
          `.cantidad-producto[data-id="${prodId}"]`,
        );
        if (cantInput) cantInput.disabled = !e.target.checked;
        this.calcularTotal(productosContainer, totalPreview);
      });
    });

    const cantInputs =
      productosContainer.querySelectorAll(".cantidad-producto");
    cantInputs.forEach((input) => {
      input.addEventListener("input", () =>
        this.calcularTotal(productosContainer, totalPreview),
      );
    });
  }

  calcularTotal(container, totalPreview) {
    let total = 0;
    container.querySelectorAll(".checkbox-producto:checked").forEach((cb) => {
      const precio = parseFloat(cb.dataset.precio) || 0;
      const cantInput = container.querySelector(
        `.cantidad-producto[data-id="${cb.dataset.id}"]`,
      );
      const cantidad = cantInput ? parseInt(cantInput.value) || 1 : 1;
      total += precio * cantidad;
    });
    if (totalPreview) totalPreview.textContent = formatPrice(total);
  }

  setupListeners() {
    this.qs("form").addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const result = await procesarCreacionOrden(this.qs("form"));
        this.emit("form-submit", { tableName: "ordenes", result });
      } catch (error) {
        const alertDialog = document.getElementById("alert-dialog");
        if (alertDialog && typeof alertDialog.show === "function") {
          alertDialog.show({
            message: `Error al crear la orden: ${error.message}`,
            type: "error",
          });
        }
        console.error("Error al procesar orden:", error);
      }
    });

    this.qs(".btn-cancel").addEventListener("click", () => {
      this.emit("form-cancel");
    });
  }
}

customElements.define("formulario-ordenes", FormularioOrden);

export { FormularioOrden };
