import { BaseComponent } from "./baseComponent.js";
import { escapeHTML } from "../utils/escapeHTML.js";
import { formatPrice } from "../tableManager.js";

class DataTable extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    this.data = [];
    this.rawData = [];
    this.tableName = "";
    this.selectedIds = new Set();
  }

  setData(data, options = {}) {
    this.data = Array.isArray(data) ? data : [];
    this.rawData = Array.isArray(options.rawData) ? options.rawData : this.data;
    this.tableName =
      typeof options.tableName === "string" ? options.tableName : "";
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

  isSalesView() {
    return this.tableName === "vista_ventas";
  }

  normalizeKey(key) {
    return String(key)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  resolveSalesTotalKey() {
    if (!Array.isArray(this.rawData) || this.rawData.length === 0) {
      return null;
    }

    const keys = Object.keys(this.rawData[0]);
    const normalizedCandidates = keys
      .map((key) => ({ key, normalized: this.normalizeKey(key) }))
      .filter(({ normalized }) => normalized.includes("total"));

    const prioritized = normalizedCandidates.find(({ normalized }) =>
      normalized.includes("orden"),
    );

    return (prioritized || normalizedCandidates[0] || {}).key || null;
  }

  getSalesTotal() {
    if (!this.isSalesView()) {
      return 0;
    }

    const totalKey = this.resolveSalesTotalKey();
    if (!totalKey) {
      return 0;
    }

    return this.rawData.reduce((sum, row) => {
      return sum + (parseFloat(row[totalKey]) || 0);
    }, 0);
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
        ${
          this.isSalesView()
            ? `<div class="table-footer-row table-sales-summary" aria-live="polite">
                <span>Total ventas del periodo</span>
                <strong class="sales-total-value">$${escapeHTML(this.getSalesTotal())}</strong>
              </div>`
            : ""
        }
        <div class="table-footer-row table-footer-stats">
          <span>Filas: <strong class="total-rows-count">${this.data.length}</strong></span>
          <span>Seleccionadas: <strong class="selected-rows-count">0</strong></span>
        </div>
      </div>
    `;

    this.setupListeners();
    this.updateFooter();
  }

  updateFooter() {
    const totalEl = this.qs(".total-rows-count");
    const selectedEl = this.qs(".selected-rows-count");
    const salesTotalEl = this.qs(".sales-total-value");
    if (totalEl) totalEl.textContent = this.data.length;
    if (selectedEl) selectedEl.textContent = this.selectedIds.size;
    if (salesTotalEl) {
      salesTotalEl.textContent = `$${formatPrice(this.getSalesTotal())}`;
    }
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
