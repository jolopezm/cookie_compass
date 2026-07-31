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
import dataStore from "./dataStore.js";

let currentSelectedTable = "";
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

  const rawData = dataStore.getTable(tableName) || [];
  const formattedData = formatTableData(rawData);

  const actionMenu = document.querySelector("action-menu");
  if (actionMenu && typeof actionMenu.setReadOnly === "function") {
    actionMenu.setReadOnly(READ_ONLY_TABLES.has(tableName));
  }

  const filterForm = document.querySelector("filter-form");
  if (filterForm && typeof filterForm.resetFields === "function") {
    filterForm.resetFields();
  }

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

    const rawData =
      JSON.parse(localStorage.getItem(currentSelectedTable)) || [];
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
      showAlert(`Error al guardar en Supabase: ${error.message}`);
    }
  });

  modal.addEventListener("update-record", async (e) => {
    const { tableName, payload, id } = e.detail;

    try {
      if (tableName && id) {
        await updateRecord(id, payload, tableName);
        await fetchTables();
        await loadTable(currentSelectedTable);
      }
    } catch (error) {
      console.error("❌ Error actualizando registro en Supabase:", error);
      showAlert(`Error al actualizar en Supabase: ${error.message}`);
    }
  });

  modal.addEventListener("record-created", async () => {
    await loadTable(currentSelectedTable);
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
  const exportBtn = document.getElementById("btn-export-csv");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", () => {
    const modal = document.querySelector("modal-preview-export-csv");
    const tables = JSON.parse(localStorage.getItem("tables")) || [];
    if (modal && typeof modal.setDataPreview === "function") {
      modal.setTitle(
        `Vista previa de: ${currentSelectedTable.charAt(0).toUpperCase() + currentSelectedTable.slice(1)}`,
      );
      const data = JSON.parse(localStorage.getItem(currentSelectedTable)) || [];
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
    setupTableSelector(tableSelector);
    setupActionMenu();
    setupModalEvents();
    setupExportCSVButton();
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
