import { BaseComponent } from "./baseComponent.js";

class FormularioCliente extends BaseComponent {
  render() {
    this.innerHTML = `
      <form id="form-cliente">
        <label for="input-nombre">Nombre del cliente:</label>
        <input type="text" id="input-nombre" name="nombre" placeholder="Ej. Juan Pérez" required />

        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
          <button type="button" class="secondary outline btn-cancel">Cancelar</button>
          <button type="submit" class="contrast">Guardar Cliente</button>
        </div>
      </form>
    `;
  }

  setupListeners() {
    this.qs("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      this.emit("form-submit", { tableName: "clientes", payload: Object.fromEntries(formData) });
    });

    this.qs(".btn-cancel").addEventListener("click", () => {
      this.emit("form-cancel");
    });
  }
}

customElements.define("formulario-clientes", FormularioCliente);

export { FormularioCliente };
