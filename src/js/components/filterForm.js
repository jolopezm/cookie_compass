import { ModalBase } from "./modalBase.js";

class FilterForm extends ModalBase {
  constructor() {
    super({ title: "Filtros", maxWidth: "720px", dialogId: "filter-dialog" });
    this.fields = [];
  }

  refreshFields() {
    const table = document.querySelector("data-table");
    if (table && table._fullData && table._fullData.length > 0) {
      this.fields = Object.keys(table._fullData[0]);
    } else {
      this.fields = [];
    }
  }

  isDateField(field) {
    return field.toLowerCase().includes("fecha");
  }

  isNumericField(field) {
    const f = field.toLowerCase();
    return f.includes("precio") || f.includes("total") || f.includes(" ($)");
  }

  fieldOptions() {
    return this.fields
      .map((f) => `<option value="${f}">${f}</option>`)
      .join("");
  }

  renderFilterRow() {
    return `
      <div class="filter-row" style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
        <div role="group" style="flex:1; display:flex;">
          <select class="filter-field" style="flex:2; margin-bottom:0;">
            <option value="">-- Campo --</option>
            ${this.fieldOptions()}
          </select>
          <select class="filter-operator" style="flex:1; margin-bottom:0;">
            <option value="">-- Operador --</option>
          </select>
          <input type="text" class="filter-value" placeholder="Valor" style="flex:1; margin-bottom:0;" />
          <input type="text" class="filter-value2" placeholder="y" style="flex:0 0 80px; margin-bottom:0; display:none;" />
          <button class="remove-filter" title="Eliminar filtro">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M8 6v-2h8v2"/>
              <path d="M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  render() {
    this.refreshFields();
    this.innerHTML = `
      <dialog id="filter-dialog">
        <article style="max-width: 720px; width: 100%;">
          <header style="display:flex; justify-content:space-between; align-items:center;">
            <strong>Filtros</strong>
            <button aria-label="Cerrar" rel="prev" class="close-btn" style="width:auto; padding:0.25rem 0.5rem;"></button>
          </header>

          <div class="filter-rows">
            ${this.renderFilterRow()}
          </div>
          <button class="add-filter secondary outline" style="font-size:0.875rem; width:auto;">+ Agregar filtro</button>

          <hr style="margin:0.75rem 0;" />

          <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
            <label style="margin-bottom:0; font-weight:bold;">Ordenar por:</label>
            <div role="group" style="flex:1; display:flex;">
              <select class="order-field" style="margin-bottom:0;">
                <option value="">-- Campo --</option>
                ${this.fieldOptions()}
              </select>
              <select class="order-direction" style="margin-bottom:0;">
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
            </div>
          </div>

          <footer style="display:flex; gap:0.5rem; justify-content:flex-end;">
            <button class="clear-filters secondary outline" style="width:auto;">Limpiar</button>
            <button class="apply-filters contrast" style="width:auto;">Aplicar</button>
          </footer>
        </article>
      </dialog>
    `;
  }

  setupListeners() {
    super.setupListeners();

    this.qs(".add-filter")?.addEventListener("click", () =>
      this.addFilterRow(),
    );
    this.qs(".apply-filters")?.addEventListener("click", () => {
      this.apply();
      this.close();
    });
    this.qs(".clear-filters")?.addEventListener("click", () => this.clear());

    this.qs(".filter-rows")?.addEventListener("change", (e) => {
      if (e.target.classList.contains("filter-field")) {
        this.updateOperatorAndValue(e.target);
      }
      if (e.target.classList.contains("filter-operator")) {
        this.updateValueInput(e.target.closest(".filter-row"));
      }
    });

    this.qs(".filter-rows")?.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-filter")) {
        const row = e.target.closest(".filter-row");
        if (row && this.qsa(".filter-row").length > 1) {
          row.remove();
        }
      }
    });

    const firstField = this.qs(".filter-field");
    if (firstField) this.updateOperatorAndValue(firstField);
  }

  show() {
    this.refreshFields();
    const fieldSelects = this.qsa(".filter-field, .order-field");
    fieldSelects.forEach((sel) => {
      const current = sel.value;
      sel.innerHTML =
        `<option value="">-- ${sel.classList.contains("order-field") ? "Campo" : "Campo"} --</option>` +
        this.fieldOptions();
      sel.value = current || "";
    });
    this.showDialog();
  }

  addFilterRow() {
    const container = this.qs(".filter-rows");
    const div = document.createElement("div");
    div.innerHTML = this.renderFilterRow();
    container.appendChild(div.firstElementChild);
  }

  updateOperatorAndValue(fieldSelect) {
    const row = fieldSelect.closest(".filter-row");
    const operatorSelect = row.querySelector(".filter-operator");
    const field = fieldSelect.value;

    let operators;
    if (!field) {
      operators = [{ value: "", label: "-- Operador --" }];
    } else if (this.isDateField(field)) {
      operators = [
        { value: "exacta", label: "Fecha exacta" },
        { value: "desde", label: "Desde" },
        { value: "hasta", label: "Hasta" },
        { value: "entre", label: "Entre" },
        { value: "mes", label: "Mes (MM/YYYY)" },
        { value: "anio", label: "Año (YYYY)" },
        { value: "antes", label: "Antes de" },
        { value: "despues", label: "Después de" },
      ];
    } else if (this.isNumericField(field)) {
      operators = [
        { value: "igual", label: "Igual a" },
        { value: "mayor", label: "Mayor que" },
        { value: "menor", label: "Menor que" },
        { value: "entre", label: "Entre" },
      ];
    } else {
      operators = [
        { value: "contiene", label: "Contiene" },
        { value: "igual", label: "Igual a" },
      ];
    }

    operatorSelect.innerHTML = operators
      .map((o) => `<option value="${o.value}">${o.label}</option>`)
      .join("");

    this.updateValueInput(row);
  }

  updateValueInput(row) {
    const operator = row.querySelector(".filter-operator").value;
    const valueInput = row.querySelector(".filter-value");
    let value2Input = row.querySelector(".filter-value2");

    if (operator === "entre") {
      if (!value2Input) {
        value2Input = document.createElement("input");
        value2Input.type = "text";
        value2Input.className = "filter-value2";
        value2Input.placeholder = "y";
        value2Input.style.cssText = "flex:0 0 80px; margin-bottom:0;";
        value2Input.name = "filter-value2";
        valueInput.after(value2Input);
      }
      value2Input.style.display = "";
      valueInput.placeholder = "Desde";
    } else {
      if (value2Input) value2Input.style.display = "none";
      valueInput.placeholder =
        operator === "mes"
          ? "MM/YYYY"
          : operator === "anio"
            ? "YYYY"
            : this.isDateField(row.querySelector(".filter-field").value)
              ? "DD/MM/YYYY"
              : "Valor";
    }
  }

  apply() {
    const table = document.querySelector("data-table");
    if (!table || !table._fullData) return;

    const sourceFormattedData = Array.isArray(table._sourceFullData)
      ? table._sourceFullData
      : table._fullData;
    const sourceRawData = Array.isArray(table._sourceRawData)
      ? table._sourceRawData
      : table._rawData || sourceFormattedData;
    const tableName = table._sourceTableName || table._tableName || "";

    let data = sourceFormattedData.map((formattedRow, index) => ({
      formattedRow,
      rawRow: sourceRawData[index] ?? null,
    }));
    const rows = this.qsa(".filter-row");

    rows.forEach((row) => {
      const field = row.querySelector(".filter-field").value;
      const operator = row.querySelector(".filter-operator").value;
      const value = row.querySelector(".filter-value").value.trim();
      const value2input = row.querySelector(".filter-value2");
      const value2 =
        value2input && value2input.style.display !== "none"
          ? value2input.value.trim()
          : null;

      if (!field || !operator || !value) return;

      const isDate = this.isDateField(field);
      const isNumeric = this.isNumericField(field);

      data = data.filter(({ formattedRow }) => {
        const cellValue = formattedRow[field];

        if (isDate) {
          return this.matchDate(cellValue, operator, value, value2);
        }

        if (isNumeric) {
          return this.matchNumeric(cellValue, operator, value, value2);
        }

        return this.matchText(cellValue, operator, value);
      });
    });

    const orderField = this.qs(".order-field").value;
    const orderDir = this.qs(".order-direction").value;
    if (orderField) {
      const isDate = this.isDateField(orderField);
      const isNumeric = this.isNumericField(orderField);

      data.sort((a, b) => {
        const valA = this.parseSortValue(
          a.formattedRow[orderField],
          isDate,
          isNumeric,
        );
        const valB = this.parseSortValue(
          b.formattedRow[orderField],
          isDate,
          isNumeric,
        );
        if (valA < valB) return orderDir === "asc" ? -1 : 1;
        if (valA > valB) return orderDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    const filteredFormattedData = data.map(({ formattedRow }) => formattedRow);
    const filteredRawData = data.map(({ rawRow }) => rawRow);

    table._fullData = sourceFormattedData;
    table._rawData = sourceRawData;
    table._tableName = tableName;
    table.setData(filteredFormattedData, {
      rawData: filteredRawData,
      tableName,
    });
  }

  matchDate(cellValue, operator, value, value2) {
    if (!cellValue) return false;

    const date = this.parseDate(String(cellValue));
    if (!date) return false;

    switch (operator) {
      case "exacta": {
        const target = this.parseDate(value);
        return target && this.isSameDate(date, target);
      }
      case "desde": {
        const from = this.parseDate(value);
        return from && date >= from;
      }
      case "hasta": {
        const to = this.parseDate(value);
        return to && date <= to;
      }
      case "entre": {
        const from = this.parseDate(value);
        const to = value2 ? this.parseDate(value2) : null;
        if (!from) return false;
        if (to) return date >= from && date <= to;
        return date >= from;
      }
      case "mes": {
        const parts = value.split("/");
        if (parts.length === 2) {
          const month = parseInt(parts[0], 10);
          const year = parseInt(parts[1], 10);
          return date.getMonth() + 1 === month && date.getFullYear() === year;
        }
        return false;
      }
      case "anio":
        return date.getFullYear() === parseInt(value, 10);
      case "antes":
        return date < this.parseDate(value);
      case "despues":
        return date > this.parseDate(value);
      default:
        return false;
    }
  }

  matchNumeric(cellValue, operator, value, value2) {
    const num = parseFloat(String(cellValue).replace(/[$,]/g, ""));
    const val = parseFloat(value.replace(/[$,]/g, ""));
    if (isNaN(num) || isNaN(val)) return false;

    switch (operator) {
      case "igual":
        return num === val;
      case "mayor":
        return num > val;
      case "menor":
        return num < val;
      case "entre": {
        const to = value2 ? parseFloat(value2.replace(/[$,]/g, "")) : null;
        if (to === null || isNaN(to)) return num >= val;
        return num >= val && num <= to;
      }
      default:
        return false;
    }
  }

  matchText(cellValue, operator, value) {
    const str = String(cellValue).toLowerCase();
    const val = value.toLowerCase();

    switch (operator) {
      case "contiene":
        return str.includes(val);
      case "igual":
        return str === val;
      default:
        return false;
    }
  }

  parseDate(str) {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split("/").map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return new Date(str);
    }
    const n = Date.parse(str);
    return isNaN(n) ? null : new Date(n);
  }

  isSameDate(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  parseSortValue(value, isDate, isNumeric) {
    if (isDate) {
      const d = this.parseDate(String(value));
      return d ? d.getTime() : 0;
    }
    if (isNumeric) {
      return parseFloat(String(value).replace(/[$,]/g, "")) || 0;
    }
    return String(value).toLowerCase();
  }

  clear() {
    const table = document.querySelector("data-table");
    if (table && table._sourceFullData) {
      table._fullData = table._sourceFullData;
      table._rawData = table._sourceRawData || table._sourceFullData;
      table._tableName = table._sourceTableName || table._tableName || "";
      table.setData([...table._sourceFullData], {
        rawData: Array.isArray(table._sourceRawData)
          ? [...table._sourceRawData]
          : [...table._sourceFullData],
        tableName: table._sourceTableName || table._tableName || "",
      });
    }

    const rows = this.qsa(".filter-row");
    for (let i = rows.length - 1; i > 0; i--) {
      rows[i].remove();
    }

    const firstRow = this.qs(".filter-row");
    if (firstRow) {
      firstRow.querySelector(".filter-field").value = "";
      firstRow.querySelector(".filter-operator").innerHTML =
        '<option value="">-- Operador --</option>';
      firstRow.querySelector(".filter-value").value = "";
      const v2 = firstRow.querySelector(".filter-value2");
      if (v2) v2.style.display = "none";
    }

    this.qs(".order-field").value = "";
    this.qs(".order-direction").value = "asc";
  }

  resetFields() {
    this.refreshFields();
    this.clear();
  }
}

customElements.define("filter-form", FilterForm);

export { FilterForm };
