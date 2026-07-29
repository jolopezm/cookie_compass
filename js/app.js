import { formatTableData } from "./tableManager.js";
import { fetchTables, createRecord } from "./supabase.js";
import "../components/dataTable.js";
import "../components/tableOptionsMenu.js";
import "../components/modalNewRecord.js";

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
    await loadTable(currentSeleconctedTable);
  }

  // 3. Configurar eventos
  setupTableSelector(tableSelector);
  setupActionMenu();
  setupModalEvents();
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

  console.log("📊 Cargando tabla instantáneamente:", tableName, formattedData);
  renderTable(tableName, formattedData);
}

// =====================
// 🧱 RENDER TABLE
// =====================
function renderTable(tableName, data) {
  const container = document.getElementById("table-container");
  if (!container) return;

  const table = document.createElement("data-table");
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
}

// =====================
// 💾 MODAL EVENTS
// =====================
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
