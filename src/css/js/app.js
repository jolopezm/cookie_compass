import { formatTableData } from "./tableManager.js";
import { fetchTables, createRecord } from "./supabase.js";
import "../../js/components/dataTable.js";
import "../../js/components/tableOptionsMenu.js";
import "../../js/components/modalNewRecord.js";

let currentSelectedTable = "";

// =====================
// 🚀 INIT APP
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  const tableSelector = document.getElementById("table-selector");
  const container = document.getElementById("table-container");

  if (!tableSelector || !container) {
    console.error("❌ Faltan elementos clave en el DOM");
    return;
  }

  // 1. Cargar tablas desde Supabase / localStorage
  currentSelectedTable = await initTables(tableSelector);

  // 2. Render inicial
  if (currentSelectedTable) {
    await loadTable(currentSelectedTable);
  }

  // 3. Configurar eventos
  setupTableSelector(tableSelector);
  setupActionMenu();
  setupModalEvents();
  setupSearchBar();
});

// =====================
// 📦 INIT TABLES
// =====================
async function initTables(selectElement) {
  try {
    await fetchTables();
  } catch (err) {
    console.warn(
      "⚠️ No se pudo sincronizar con Supabase, usando datos en caché.",
      err,
    );
  }

  const tables = JSON.parse(localStorage.getItem("tables")) || [
    "clientes",
    "productos",
    "ordenes",
    "detalle_ordenes",
    "vista_ventas",
  ];

  selectElement.innerHTML = "";

  tables.forEach((table) => {
    const option = document.createElement("option");
    option.value = table;
    option.textContent =
      table.charAt(0).toUpperCase() + table.slice(1).replace(/_/g, " ");
    selectElement.appendChild(option);
  });

  return tables[0];
}

// =====================
// 📊 LOAD TABLE
// =====================
function loadTable(tableName) {
  currentSelectedTable = tableName;

  const rawData = JSON.parse(localStorage.getItem(tableName)) || [];
  const formattedData = formatTableData(rawData);

  renderTable(formattedData);
  console.log(formattedData);
}

// =====================
// 🧱 RENDER TABLE
// =====================
function renderTable(data) {
  const container = document.getElementById("table-container");
  if (!container) return;

  const table = document.createElement("data-table");
  table._fullData = data;
  table.setData(data);

  container.innerHTML = "";
  container.appendChild(table);
}

// =====================
// 🔁 SELECTOR EVENT
// =====================
function setupTableSelector(selectElement) {
  selectElement.addEventListener("change", (e) => {
    loadTable(e.target.value);
  });
}

// =====================
// ⚙️ ACTION MENU
// =====================
function setupActionMenu() {
  const container = document.getElementById("table-controls-top");
  if (!container) return;

  let actionMenu = container.querySelector("action-menu");
  if (!actionMenu) {
    actionMenu = document.createElement("action-menu");
    container.appendChild(actionMenu);
  }

  actionMenu.addEventListener("add-record", async () => {
    const modal = document.getElementById("new-record-modal");
    if (modal && typeof modal.openMenu === "function") {
      modal.openMenu();
    }
  });

  actionMenu.addEventListener("delete-record", async (e) => {
    const selectedIds = e.detail.selectedIds;
    if (!selectedIds || selectedIds.length === 0) {
      alert("No hay registros seleccionados para eliminar.");
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar ${selectedIds.length} registro(s)?`,
      )
    ) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await deleteRecord(id, currentSelectedTable);
      }
      await fetchTables();
      await loadTable(currentSelectedTable);
    } catch (error) {
      console.error("❌ Error eliminando registros:", error);
      alert(`Error al eliminar registros: ${error.message}`);
    }
  });
}

// =====================
// 💾 MODAL EVENTS
// =====================
function setupModalEvents() {
  const modal = document.getElementById("new-record-modal");
  if (!modal) return;

  modal.addEventListener("save-record", async (e) => {
    const { tableName, payload } = e.detail;
    console.log("💾 Guardando registro en Supabase:", tableName, payload);

    try {
      if (tableName) {
        await createRecord(payload, tableName);
        await fetchTables();
        await loadTable(currentSelectedTable);
      }
    } catch (error) {
      console.error("❌ Error guardando registro en Supabase:", error);
      alert(`Error al guardar en Supabase: ${error.message}`);
    }
  });

  modal.addEventListener("record-created", async () => {
    await loadTable(currentSelectedTable);
  });
}

function setupSearchBar() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    const table = document.querySelector("data-table");
    if (!table || !table._fullData) return;

    if (!query) {
      table.setData([...table._fullData]);
      return;
    }

    const result = parseSearchQuery(query, table._fullData);
    if (result) {
      table.setData(result);
      return;
    }

    const filtered = table._fullData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query.toLowerCase()),
      ),
    );
    table.setData(filtered);
  });
}

function parseSearchQuery(query, data) {
  if (!data || data.length === 0) return null;

  const segments = query
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 0) return null;

  let result = [...data];
  let matchedAny = false;

  for (const segment of segments) {
    const filterMatch = segment.match(
      /^(.+?)\s+(mayor que|menor que|igual a|contiene)\s+(.+)$/i,
    );
    if (filterMatch) {
      const filtered = applyFilter(
        result,
        filterMatch[1].trim(),
        filterMatch[2].toLowerCase(),
        filterMatch[3].trim(),
      );
      if (filtered) {
        result = filtered;
        matchedAny = true;
      }
      continue;
    }

    const sortMatch = segment.match(/^(.+?)\s+(asc|desc)$/i);
    if (sortMatch) {
      const sorted = applySort(
        result,
        sortMatch[1].trim(),
        sortMatch[2].toLowerCase(),
      );
      if (sorted) {
        result = sorted;
        matchedAny = true;
      }
      continue;
    }
  }

  return matchedAny ? result : null;
}

function findFieldKey(data, fieldRaw) {
  const keys = Object.keys(data[0]);
  const lowerRaw = fieldRaw.toLowerCase().replace(/\s+/g, "_");

  return keys.find(
    (k) =>
      k.toLowerCase() === fieldRaw.toLowerCase() ||
      k.toLowerCase().replace(/\s+/g, "_") === lowerRaw ||
      k.toLowerCase().replace(" ($)", "").trim() === fieldRaw.toLowerCase(),
  );
}

function parseDate(str) {
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

function isDateKey(key) {
  return key.toLowerCase().includes("fecha");
}

function applyFilter(data, fieldRaw, comparator, value) {
  const key = findFieldKey(data, fieldRaw);
  if (!key) return null;

  const isDate = isDateKey(key);
  const isNumeric =
    !isDate &&
    (key.toLowerCase().includes("precio") ||
      key.toLowerCase().includes("total") ||
      (!isNaN(Number(value)) && !isNaN(parseFloat(data[0]?.[key]))));

  return data.filter((row) => {
    const rowValue = row[key];

    if (comparator === "contiene") {
      return String(rowValue)
        .toLowerCase()
        .includes(String(value).toLowerCase());
    }

    let a, b;

    if (isDate) {
      a = parseDate(String(rowValue));
      b = parseDate(value);
      if (!a || !b) return false;
    } else if (isNumeric) {
      a = parseFloat(String(rowValue).replace(/[$,]/g, ""));
      b = parseFloat(value.replace(/[$,]/g, ""));
      if (isNaN(a) || isNaN(b)) return false;
    } else {
      a = String(rowValue).toLowerCase();
      b = String(value).toLowerCase();
    }

    switch (comparator) {
      case "mayor que":
        return a > b;
      case "menor que":
        return a < b;
      case "igual a":
        return a === b;
      default:
        return false;
    }
  });
}

function applySort(data, fieldRaw, direction) {
  const key = findFieldKey(data, fieldRaw);
  if (!key) return null;

  const isDate = isDateKey(key);
  const isNumeric =
    !isDate &&
    (key.toLowerCase().includes("precio") ||
      key.toLowerCase().includes("total") ||
      !isNaN(parseFloat(data[0]?.[key])));

  const sorted = [...data];
  sorted.sort((a, b) => {
    let valA, valB;

    if (isDate) {
      valA = parseDate(String(a[key]));
      valB = parseDate(String(b[key]));
    } else if (isNumeric) {
      valA = parseFloat(String(a[key]).replace(/[$,]/g, ""));
      valB = parseFloat(String(b[key]).replace(/[$,]/g, ""));
    } else {
      valA = String(a[key]).toLowerCase();
      valB = String(b[key]).toLowerCase();
    }

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}
