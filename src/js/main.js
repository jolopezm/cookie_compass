import { formatTableData } from "./tableManager.js";
import { fetchTables, createRecord, deleteRecord } from "./supabase.js";
import { parseSearchQuery } from "./searchManager.js";

let currentSelectedTable = "";

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

function loadTable(tableName) {
  currentSelectedTable = tableName;

  const rawData = JSON.parse(localStorage.getItem(tableName)) || [];
  const formattedData = formatTableData(rawData);

  renderTable(formattedData);
}

function renderTable(data) {
  const container = document.getElementById("table-container");
  if (!container) return;

  const table = document.createElement("data-table");
  table._fullData = data;
  table.setData(data);

  container.innerHTML = "";
  container.appendChild(table);
}

function setupTableSelector(selectElement) {
  selectElement.addEventListener("change", (e) => {
    loadTable(e.target.value);
  });
}

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

function setupModalEvents() {
  const modal = document.getElementById("new-record-modal");
  if (!modal) return;

  modal.addEventListener("save-record", async (e) => {
    const { tableName, payload } = e.detail;

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

function init() {
  const tableSelector = document.getElementById("table-selector");
  const container = document.getElementById("table-container");

  if (!tableSelector || !container) {
    console.error("❌ Faltan elementos clave en el DOM");
    return;
  }

  initTables(tableSelector).then((tableName) => {
    currentSelectedTable = tableName;
    if (tableName) {
      loadTable(tableName);
    }
    setupTableSelector(tableSelector);
    setupActionMenu();
    setupModalEvents();
    setupSearchBar();
  });
}

export { init };
