import { BaseComponent } from "../components/baseComponent.js";
import { formatTableData } from "./tableManager.js";
import { fetchTables } from "./supabase.js";
import "../components/dataTable.js";
import "../components/tableOptionsMenu.js";
import "../components/modalNewRecord.js";

// =====================
// 🎨 CARGAR ESTILOS
// =====================
async function cargarEstilos() {
  try {
    const sheet = new CSSStyleSheet();
    const response = await fetch("/css/pico/pico.min.css");
    const text = await response.text();

    await sheet.replace(text);

    BaseComponent.globalStyles = [sheet];

    console.log("✅ estilos listos");
  } catch (e) {
    console.error("❌ error cargando estilos", e);
  }
}

// =====================
// 🚀 INIT APP
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarEstilos();

  const tableSelector = document.getElementById("table-selector");
  const container = document.getElementById("table-container");

  if (!tableSelector || !container) {
    console.error("❌ Faltan elementos en el DOM");
    return;
  }

  // 1. cargar tablas desde supabase/localStorage
  const firstTable = await initTables(tableSelector);

  // 2. render inicial
  await loadTable(firstTable);

  // 3. eventos
  setupTableSelector(tableSelector);

  // 4. menu acciones
  setupActionMenu();
});

// =====================
// 📦 INIT TABLES
// =====================
async function initTables(selectElement) {
  await fetchTables();

  const tables = JSON.parse(localStorage.getItem("tables")) || [];

  selectElement.innerHTML = "";

  tables.forEach((table) => {
    const option = document.createElement("option");
    option.value = table;
    option.textContent = table;
    selectElement.appendChild(option);
  });

  return tables[0];
}

// =====================
// 📊 LOAD TABLE
// =====================
async function loadTable(tableName) {
  const rawData = JSON.parse(localStorage.getItem(tableName)) || [];
  const formattedData = formatTableData(rawData);

  console.log("📊 cargando:", tableName, formattedData);

  renderTable(tableName, formattedData);
}

// =====================
// 🧱 RENDER TABLE
// =====================
function renderTable(tableName, data) {
  const container = document.getElementById("table-container");

  if (!data || data.length === 0) {
    container.innerHTML = `<p>No hay datos para ${tableName}</p>`;
    return;
  }

  const table = document.createElement("data-table");
  table.setData(data);

  container.innerHTML = "";
  container.appendChild(table);
}

// =====================
// 🔁 SELECTOR EVENT
// =====================
function setupTableSelector(selectElement) {
  selectElement.addEventListener("change", async (e) => {
    await loadTable(e.target.value);
  });
}

// =====================
// ⚙️ ACTION MENU
// =====================
function setupActionMenu() {
  const container = document.getElementById("table-controls");

  if (!container) {
    console.warn("⚠️ table-controls no existe");
    return;
  }

  const actionMenu = document.createElement("action-menu");
  container.appendChild(actionMenu);

  actionMenu.addEventListener("add-record", async () => {
    const modal = document.getElementById("new-record-modal");
    document.body.appendChild(modal);
    modal.open();
  });
}
