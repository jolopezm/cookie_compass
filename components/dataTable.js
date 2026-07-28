import { BaseComponent } from "./baseComponent.js";

class DataTable extends BaseComponent {
  constructor() {
    super();

    this.data = [];
    this.selectedIds = new Set();
  }

  setData(data) {
    this.data = data;
    this.render();
  }

  getSelectedIds() {
    return Array.from(this.selectedIds);
  }

  render() {
    if (!this.data || this.data.length === 0) {
      this.shadowRoot.innerHTML = `<p>No hay datos</p>`;
      return;
    }

    const headers = Object.keys(this.data[0]);

    this.shadowRoot.innerHTML = `
      <table class="striped">
        <thead>
          <tr>
            <th>
              <input type="checkbox" id="select-all" />
            </th>
            ${headers.map((h) => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${this.data
            .map(
              (row) => `
            <tr>
              <td>
                <input type="checkbox" class="row-checkbox" data-id="${row.id}" />
              </td>
              ${headers.map((h) => `<td>${row[h]}</td>`).join("")}
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;

    this.addEvents();
  }

  addEvents() {
    const selectAll = this.shadowRoot.querySelector("#select-all");
    const checkboxes = this.shadowRoot.querySelectorAll(".row-checkbox");

    // ✅ SELECT ALL
    selectAll.addEventListener("change", (e) => {
      checkboxes.forEach((cb) => {
        cb.checked = e.target.checked;
        this.toggleSelection(cb.dataset.id, cb.checked);
      });

      this.emitSelection();
    });

    // ✅ CHECKBOX INDIVIDUAL
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
    this.dispatchEvent(
      new CustomEvent("selection-change", {
        detail: this.getSelectedIds(),
      }),
    );
  }
}

customElements.define("data-table", DataTable);
export { DataTable };
