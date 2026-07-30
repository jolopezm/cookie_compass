import { ModalBase } from "./modalBase.js";
import { downloadCSV } from "../utils/dataManager.js";

class ModalPreviewExportCSV extends ModalBase {
  constructor() {
    super({
      title: "Vista Previa de Exportación a CSV",
      dialogId: "preview-export-csv-dialog",
    });

    this._currentTableName = "";
  }

  setDataPreview(data) {
    const container = this.qs("#preview-container");
    if (!container) return;

    const tableHTML = `<div class="table-scroll">
        <table class="striped">
          <thead>
            <tr>
              ${
                data.length > 0
                  ? Object.keys(data[0])
                      .map((h) => `<th>${h}</th>`)
                      .join("")
                  : ""
              }
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                ${Object.values(row)
                  .map((value) => `<td>${value ?? ""}</td>`)
                  .join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>`;

    container.innerHTML = tableHTML;
  }

  render() {
    this.innerHTML = `<dialog id="${this._dialogId}">
      <article style="max-width: ${this._maxWidth}; width: 100%;">
        <header style="display: flex; justify-content: space-between; align-items: center;">
          <strong id="modal-title">${this._title}</strong>
          ${this._showCloseButton ? '<button aria-label="Cerrar" rel="prev" class="close-btn" style="width: auto; padding: 0.25rem 0.5rem;"></button>' : ""}
        </header>
        <div id="modal-body">
          <small>Mostrando los datos como realmente son.<br/> Asi seran exportados.</small>
          <div id="preview-container"></div>
        </div>
        <footer>
          <button id="export-csv-btn">Exportar como CSV</button>
        </footer>
      </article>
    </dialog>`;
  }

  setupListeners() {
    super.setupListeners();
    const exportBtn = this.qs("#export-csv-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportAsCSV();
      });
    }
  }

  setCurrentTableName(tableName) {
    this._currentTableName = tableName;
  }

  exportAsCSV() {
    downloadCSV(this._currentTableName);
  }
}

if (!customElements.get("modal-preview-export-csv")) {
  customElements.define("modal-preview-export-csv", ModalPreviewExportCSV);
}

export { ModalPreviewExportCSV };
