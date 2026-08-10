import { formatTableData } from "./tableManager.js";
import {
  fetchTables,
  createRecord,
  updateRecord,
  deleteRecord,
  getSession,
  onAuthChange,
  signOut,
} from "./supabase.js";
import "./components/filterForm.js";
import "./components/confirmDialog.js";
import "./components/modalPreviewExportCSV.js";
import "./components/alertDialog.js";
import "./components/loginForm.js";
import "./components/salesChartView.js";
import dataStore from "./dataStore.js";

let currentSelectedTable = "";
let currentViewMode = "table";
let viewToggleReady = false;
let tableSelectorReady = false;
let actionMenuReady = false;
let modalEventsReady = false;
let exportButtonReady = false;
const DEFAULT_TABLES = [
  "clientes",
  "productos",
  "ordenes",
  "detalle_ordenes",
  "vista_ventas",
];
const READ_ONLY_TABLES = new Set([
  "ordenes",
  "detalle_ordenes",
  "vista_ventas",
]);

function showAlert(message, type = "error") {
  const dialog = document.getElementById("alert-dialog");
  if (dialog && typeof dialog.show === "function") {
    dialog.show({ message, type });
  }
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("article");
  toast.className = "app-toast";
  toast.dataset.type = type;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;
  const activeDialog =
    type === "error" ? document.querySelector("dialog[open]") : null;
  if (activeDialog) {
    toast.classList.add("app-toast-modal");
    activeDialog.appendChild(toast);
  } else {
    container.appendChild(toast);
  }
  window.setTimeout(() => toast.remove(), 4500);
}

function getSalesChartView() {
  return document.getElementById("sales-chart-view");
}

function refreshSalesChart() {
  const chartView = getSalesChartView();
  if (chartView && typeof chartView.setData === "function") {
    chartView.setData({
      orders: dataStore.getTable("ordenes"),
      details: dataStore.getTable("detalle_ordenes"),
      products: dataStore.getTable("productos"),
    });
  }
}

function refreshCustomerFrequency() {
  const frequencyView = document.getElementById("customer-frequency-view");
  if (frequencyView && typeof frequencyView.setData === "function") {
    frequencyView.setData({
      orders: dataStore.getTable("ordenes"),
      customers: dataStore.getTable("clientes"),
      details: dataStore.getTable("detalle_ordenes"),
      products: dataStore.getTable("productos"),
    });
  }
}

function updateViewToggleButtons() {
  document.querySelectorAll("[data-view-mode]").forEach((button) => {
    const active = button.dataset.viewMode === currentViewMode;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

function setViewMode(mode) {
  currentViewMode = mode;

  const tableView = document.getElementById("table-view");
  const chartView = document.getElementById("chart-view");
  const frequencyView = document.getElementById("frequency-view");

  if (tableView) tableView.hidden = mode !== "table";
  if (chartView) chartView.hidden = mode !== "chart";
  if (frequencyView) frequencyView.hidden = mode !== "frequency";

  updateViewToggleButtons();

  if (mode === "chart") {
    refreshSalesChart();
  } else if (mode === "frequency") {
    refreshCustomerFrequency();
  }
}

function setupViewToggle() {
  if (viewToggleReady) return;
  viewToggleReady = true;

  document.querySelectorAll("[data-view-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      setViewMode(button.dataset.viewMode || "table");
    });
  });

  const tabList = document.getElementById("view-toggle");
  tabList?.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }
    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex < 0) return;

    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    tabs[nextIndex].focus();
    setViewMode(tabs[nextIndex].dataset.viewMode);
  });

  updateViewToggleButtons();
}

async function initTables(selectElement) {
  try {
    await fetchTables(DEFAULT_TABLES);
  } catch (err) {
    console.warn(
      "⚠️ No se pudo sincronizar con Supabase, usando datos en caché.",
      err,
    );
  }

  const tables = dataStore.getTables();
  const tableList = tables.length > 0 ? tables : DEFAULT_TABLES;

  selectElement.innerHTML = "";

  tableList.forEach((table) => {
    const option = document.createElement("option");
    option.value = table;
    option.textContent =
      table.charAt(0).toUpperCase() + table.slice(1).replace(/_/g, " ");
    selectElement.appendChild(option);
  });

  return tableList[0];
}

function loadTable(tableName, { resetFilters = true } = {}) {
  currentSelectedTable = tableName;

  const rawData = dataStore.getTable(tableName) || [];
  const formattedData = formatTableData(rawData);

  const actionMenu = document.querySelector("action-menu");
  if (actionMenu && typeof actionMenu.setReadOnly === "function") {
    actionMenu.setReadOnly(READ_ONLY_TABLES.has(tableName));
  }

  const filterForm = document.querySelector("filter-form");
  if (resetFilters && filterForm && typeof filterForm.resetFields === "function") {
    filterForm.resetFields();
  }

  renderTable(formattedData, rawData, tableName);
}

async function showCreatedRecord(tableName, record) {
  if (!record?.id) {
    throw new Error("Supabase no devolvió el ID del registro creado.");
  }

  const preserveFilters = currentSelectedTable === tableName;
  const records = dataStore.getTable(tableName);
  if (!records.some((candidate) => String(candidate.id) === String(record.id))) {
    dataStore.setTable(tableName, [record, ...records]);
  }
  const tableSelector = document.getElementById("table-selector");
  if (tableSelector) tableSelector.value = tableName;

  setViewMode("table");
  loadTable(tableName, { resetFilters: !preserveFilters });

  const filterForm = document.getElementById("filter-form");
  if (
    preserveFilters &&
    filterForm &&
    typeof filterForm.ensureRecordVisible === "function"
  ) {
    const formattedRecord = formatTableData([record])[0];
    filterForm.ensureRecordVisible(formattedRecord, record);
  }

  showToast("Registro creado correctamente.");
  window.requestAnimationFrame(() => {
    document.querySelector("data-table")?.selectAndReveal(record.id);
  });
}

function renderTable(data, rawData, tableName) {
  const container = document.getElementById("table-container");
  if (!container) return;

  const table = document.createElement("data-table");
  table._fullData = data;
  table._rawData = rawData;
  table._tableName = tableName;
  table._sourceFullData = data;
  table._sourceRawData = rawData;
  table._sourceTableName = tableName;
  table.setData(data, { rawData, tableName });

  container.innerHTML = "";
  container.appendChild(table);
}

function setupTableSelector(selectElement) {
  if (tableSelectorReady) return;
  tableSelectorReady = true;
  selectElement.addEventListener("change", (e) => {
    loadTable(e.target.value);
  });
}

function setupActionMenu() {
  if (actionMenuReady) return;
  const container = document.getElementById("table-controls-top");
  if (!container) return;
  actionMenuReady = true;

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

  actionMenu.addEventListener("delete-record", async () => {
    if (READ_ONLY_TABLES.has(currentSelectedTable)) {
      showAlert(
        "Esta tabla es de solo lectura, no se pueden eliminar registros.",
      );
      return;
    }

    const dataTable = document.querySelector("data-table");
    const selectedIds = dataTable ? dataTable.getSelectedIds() : [];
    if (!selectedIds.length) {
      showAlert("No hay registros seleccionados para eliminar.");
      return;
    }

    if (
      !(await confirmDelete(
        `¿Estás seguro de que deseas eliminar ${selectedIds.length} registro(s)?`,
      ))
    ) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await deleteRecord(id, currentSelectedTable);
      }
      await fetchTables();
      await loadTable(currentSelectedTable);
      refreshSalesChart();
      refreshCustomerFrequency();
    } catch (error) {
      console.error("❌ Error eliminando registros:", error);
      console.error("Detalles:", JSON.stringify(error, null, 2));
      showAlert(
        `Error al eliminar registros: ${error.message || JSON.stringify(error)}`,
      );
    }
  });

  actionMenu.addEventListener("edit-record", () => {
    if (READ_ONLY_TABLES.has(currentSelectedTable)) {
      showAlert(
        "Esta tabla es de solo lectura, no se pueden editar registros.",
      );
      return;
    }

    const dataTable = document.querySelector("data-table");
    const selectedIds = dataTable ? dataTable.getSelectedIds() : [];
    if (selectedIds.length !== 1) {
      showAlert("Selecciona exactamente un registro para editar.");
      return;
    }

    const rawData = dataStore.getTable(currentSelectedTable) || [];
    const record = rawData.find(
      (r) => r.id === selectedIds[0] || String(r.id) === selectedIds[0],
    );
    if (!record) {
      showAlert("No se encontró el registro seleccionado.");
      return;
    }

    const modal = document.getElementById("new-record-modal");
    if (modal && typeof modal.openForEdit === "function") {
      modal.openForEdit(currentSelectedTable, record);
    }
  });

  actionMenu.addEventListener("filter-record", () => {
    const filterForm = document.getElementById("filter-form");
    if (filterForm && typeof filterForm.show === "function") {
      filterForm.show();
    }
  });
}

function setupModalEvents() {
  if (modalEventsReady) return;
  const modal = document.getElementById("new-record-modal");
  if (!modal) return;
  modalEventsReady = true;

  modal.addEventListener("save-record", async (e) => {
    const { tableName, payload } = e.detail;

    try {
      if (tableName) {
        const createdRecord = await createRecord(payload, tableName);
        await fetchTables();
        await showCreatedRecord(tableName, createdRecord);
        refreshSalesChart();
        refreshCustomerFrequency();
        modal.close();
      }
    } catch (error) {
      console.error("❌ Error guardando registro en Supabase:", error);
      showToast(`Error al guardar en Supabase: ${error.message}`, "error");
    }
  });

  modal.addEventListener("update-record", async (e) => {
    const { tableName, payload, id } = e.detail;

    try {
      if (tableName && id) {
        await updateRecord(id, payload, tableName);
        await fetchTables();
        await loadTable(currentSelectedTable);
        refreshSalesChart();
        refreshCustomerFrequency();
        modal.close();
      }
    } catch (error) {
      console.error("❌ Error actualizando registro en Supabase:", error);
      showAlert(`Error al actualizar en Supabase: ${error.message}`);
    }
  });

  modal.addEventListener("record-created", async (event) => {
    const { tableName, record } = event.detail;
    try {
      await showCreatedRecord(tableName, record);
      refreshSalesChart();
      refreshCustomerFrequency();
    } catch (error) {
      showToast(`La orden fue creada, pero no pudo mostrarse: ${error.message}`, "error");
    }
  });

  modal.addEventListener("record-create-failed", (event) => {
    showToast(event.detail.message, "error");
  });

  modal.addEventListener("alert", (e) => {
    showAlert(e.detail.message, e.detail.type);
  });
}

function confirmDelete(message) {
  const dialog = document.getElementById("confirm-dialog");
  if (dialog && typeof dialog.show === "function") {
    return dialog.show(message);
  }
  return Promise.resolve(confirm(message));
}

function setupExportCSVButton() {
  if (exportButtonReady) return;
  const exportBtn = document.getElementById("btn-export-csv");
  if (!exportBtn) return;
  exportButtonReady = true;

  exportBtn.addEventListener("click", () => {
    const modal = document.querySelector("modal-preview-export-csv");
    if (modal && typeof modal.setDataPreview === "function") {
      modal.setTitle(
        `Vista previa de: ${currentSelectedTable.charAt(0).toUpperCase() + currentSelectedTable.slice(1)}`,
      );
      const data = dataStore.getTable(currentSelectedTable) || [];
      modal.setCurrentTableName(currentSelectedTable);
      modal.setDataPreview(data);
      modal.showDialog();
    }
  });
}

async function init() {
  const {
    data: { session },
  } = await getSession();

  const authContainer = document.getElementById("auth-container");
  const appContent = document.getElementById("app-content");
  const userInfo = document.getElementById("user-info");

  if (!session) {
    appContent.hidden = true;
    authContainer.hidden = false;
    if (userInfo) userInfo.hidden = true;

    let loginForm = authContainer.querySelector("login-form");
    if (!loginForm) {
      loginForm = document.createElement("login-form");
      authContainer.appendChild(loginForm);
    }

    loginForm.addEventListener("auth-success", () => init(), { once: true });
    return;
  }

  authContainer.hidden = true;
  appContent.hidden = false;

  if (userInfo) {
    document.getElementById("user-email").textContent =
      session.user.email.slice(0, 10);
    userInfo.hidden = false;
  }

  if (!logoutReady) {
    logoutReady = true;
    document
      .getElementById("logout-btn")
      .addEventListener("click", async (e) => {
        e.preventDefault();
        await signOut();
      });
  }

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
    setupViewToggle();
    setupTableSelector(tableSelector);
    setupActionMenu();
    setupModalEvents();
    setupExportCSVButton();
    refreshSalesChart();
    refreshCustomerFrequency();
    setViewMode(currentViewMode);
  });
}

let authSubscribed = false;
let logoutReady = false;
function subscribeAuthChanges() {
  if (authSubscribed) return;
  authSubscribed = true;
  onAuthChange((event) => {
    if (event === "SIGNED_OUT") {
      authSubscribed = false;
      init();
    }
  });
}

subscribeAuthChanges();

window.addEventListener("unhandledrejection", (e) => {
  console.error("❌ Error no capturado:", e.reason);
});

export { init };
