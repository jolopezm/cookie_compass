import { BaseComponent } from "./baseComponent.js";

class ActionMenu extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
  }

  render() {
    this.innerHTML = `
      <div class="grid" style="display: flex; gap: 0.5rem; align-items: center;">
        <button id="add-btn" class="outline" title="Agregar nuevo registro">
          ${this.iconAdd()} Nuevo
        </button>
        <button id="edit-btn" class="outline secondary" title="Editar registro">
          ${this.iconEdit()} Editar
        </button>
        <button id="delete-btn" class="outline contrast" title="Eliminar registro">
          ${this.iconDelete()} Eliminar
        </button>
        <button id="filter-btn" class="outline secondary" title="Filtrar">
          ${this.iconFilter()} Filtrar
        </button>
      </div>
    `;
  }

  iconEdit() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    `;
  }

  iconDelete() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18"/>
        <path d="M8 6v-2h8v2"/>
        <path d="M19 6l-1 14H6L5 6"/>
      </svg>
    `;
  }

  iconAdd() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14"/>
        <path d="M5 12h14"/>
      </svg>
    `;
  }

  iconFilter() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 6h16"/>
        <path d="M6 12h12"/>
        <path d="M10 18h4"/>
      </svg>
    `;
  }

  setupListeners() {
    const addBtn = this.qs("#add-btn");
    const editBtn = this.qs("#edit-btn");
    const deleteBtn = this.qs("#delete-btn");
    const filterBtn = this.qs("#filter-btn");

    if (addBtn) {
      addBtn.addEventListener("click", () => this.emit("add-record"));
    }
    if (editBtn) {
      editBtn.addEventListener("click", () => this.emit("edit-record"));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => this.emit("delete-record"));
    }
    if (filterBtn) {
      filterBtn.addEventListener("click", () => this.emit("filter-record"));
    }
  }
}

if (!customElements.get("action-menu")) {
  customElements.define("action-menu", ActionMenu);
}

export { ActionMenu };

