import { BaseComponent } from "./baseComponent.js";

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
      <div class="overflow-auto">
        <table class="striped">
          <thead>
            <tr>
              <th style="width: 40px;">
                <input type="checkbox" id="select-all" aria-label="Seleccionar todo" />
              </th>
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${this.data
              .map(
                (row, idx) => `
              <tr>
                <td>
                  <input type="checkbox" class="row-checkbox" data-id="${row.id ?? idx}" aria-label="Seleccionar fila" />
                </td>
                ${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    this.setupListeners();
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
      });
    }

    checkboxes.forEach((cb) => {
      cb.addEventListener("change", (e) => {
        this.toggleSelection(cb.dataset.id, e.target.checked);
        this.emitSelection();
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

