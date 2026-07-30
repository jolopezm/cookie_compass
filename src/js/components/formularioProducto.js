import { BaseComponent } from "./baseComponent.js";

class FormularioProducto extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    this.editId = null;
  }

  render() {
    this.innerHTML = `
      <form id="form-producto">
        <label for="input-producto-nombre">Nombre del producto:</label>
        <input type="text" id="input-producto-nombre" name="nombre" placeholder="Ej. Galletas de Chispas" required />

        <label for="input-producto-precio">Precio unitario ($):</label>
        <input type="number" step="0.01" min="0" id="input-producto-precio" name="precio" placeholder="0.00" required />

        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
          <button type="button" class="secondary outline btn-cancel">Cancelar</button>
          <button type="submit" class="contrast">Guardar Producto</button>
        </div>
      </form>
    `;
  }

  setData(data) {
    this.editId = data.id;
    const nombreInput = this.qs("#input-producto-nombre");
    const precioInput = this.qs("#input-producto-precio");
    if (nombreInput) nombreInput.value = data.nombre || "";
    if (precioInput) precioInput.value = data.precio ?? "";
  }

  setupListeners() {
    this.qs("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData);
      if (payload.precio) payload.precio = parseFloat(payload.precio);
      this.emit("form-submit", { tableName: "productos", payload, id: this.editId });
    });

    this.qs(".btn-cancel").addEventListener("click", () => {
      this.emit("form-cancel");
    });
  }
}

customElements.define("formulario-productos", FormularioProducto);

export { FormularioProducto };
