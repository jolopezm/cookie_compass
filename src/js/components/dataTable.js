import { BaseComponent } from "./baseComponent.js";
import { escapeHTML } from "../utils/escapeHTML.js";

class DataTable extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    this.data = [];
    this.selectedIds = new Set();
  }

  setData(data) {
    this.data = Array.isArray(data) ? data : [];
    this.selectedIds.clear();
    this.render();
  }

  getTotalRows() {
    return this.data.length;
  }

  getSelectedCount() {
    return this.selectedIds.size;
  }

  getSelectedIds() {
    return Array.from(this.selectedIds);
  }

  render() {
    if (!this.data || this.data.length === 0) {
      this.innerHTML = `<article><p>No hay datos disponibles para mostrar.</p></article>`;
      return;
    }

    const headers = Object.keys(this.data[0]);

    this.innerHTML = `
      <div class="table-scroll">
        <table class="striped">
          <thead>
            <tr>
              <th style="width: 40px;">
                <input type="checkbox" id="select-all" aria-label="Seleccionar todo" />
              </th>
              ${headers.map((h) => `<th>${escapeHTML(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${this.data
              .map(
                (row, idx) => `
              <tr>
                <td>
                  <input type="checkbox" class="row-checkbox" data-id="${escapeHTML(row.id ?? idx)}" aria-label="Seleccionar fila" />
                </td>
                ${headers.map((h) => `<td>${escapeHTML(row[h] ?? "")}</td>`).join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span>Filas: <strong class="total-rows-count">${this.data.length}</strong></span>
        <span>Seleccionadas: <strong class="selected-rows-count">0</strong></span>
      </div>
    `;

    this.setupListeners();
    this.updateFooter();
  }

  updateFooter() {
    const totalEl = this.qs(".total-rows-count");
    const selectedEl = this.qs(".selected-rows-count");
    if (totalEl) totalEl.textContent = this.data.length;
    if (selectedEl) selectedEl.textContent = this.selectedIds.size;
  }

  setupListeners() {
    const selectAll = this.qs("#select-all");
    const checkboxes = this.qsa(".row-checkbox");

    if (selectAll) {
      selectAll.addEventListener("change", (e) => {
        checkboxes.forEach((cb) => {
          cb.checked = e.target.checked;
          this.toggleSelection(cb.dataset.id, cb.checked);
        });
        this.emitSelection();
        this.updateFooter();
      });
    }

    checkboxes.forEach((cb) => {
      cb.addEventListener("change", (e) => {
        this.toggleSelection(cb.dataset.id, e.target.checked);
        this.emitSelection();
        this.updateFooter();
      });
    });
  }

  toggleSelection(id, checked) {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
  }

  emitSelection() {
    this.emit("selection-change", {
      selectedIds: this.getSelectedIds(),
    });
  }
}

if (!customElements.get("data-table")) {
  customElements.define("data-table", DataTable);
}

export { DataTable };
