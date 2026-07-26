import { showSelectedTable } from "./tableManager.js";
import { openFormMenu, openForm } from "./formManager.js";
import {
  initFormOrdenes,
  guardarOrden,
  guardarDetalleOrden,
} from "./ordenes.js";

import { fetchTables, createRecord, deleteRecord } from "./supabase.js";

const tableSelector = document.getElementById("selector-tabla");

document.addEventListener("DOMContentLoaded", async () => {
  await fetchTables();
  const savedTables = JSON.parse(localStorage.getItem("tables")) || [];
  if (savedTables.length > 0) {
    for (const table of savedTables) {
      const option = document.createElement("option");
      option.value = table;
      option.textContent = table.charAt(0).toUpperCase() + table.slice(1);
      tableSelector.appendChild(option);
    }
  }

  const tableName = tableSelector.value;
  const table = JSON.parse(localStorage.getItem(tableName)) || [];
  const container = document.getElementById("contenedor-tabla");
  container.innerHTML = showSelectedTable(table);

  const selectAllCheckbox = document.getElementById("select-all");
  let checkboxes = [];
  selectAllCheckbox.addEventListener("change", (event) => {
    checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = event.target.checked;
    });
  });

  const deleteRecordButton = document.getElementById("btn-detele-record");
  deleteRecordButton.addEventListener("click", async () => {
    const tableName = tableSelector.value;

    for (const checkbox of checkboxes) {
      const row = checkbox.closest("tr");
      const recordId = row.cells[1].textContent;

      try {
        await deleteRecord(recordId, tableName);
        row.remove();
      } catch (error) {
        console.error("Error al eliminar el registro:", error);
      }
    }
  });

  const addRecordButton = document.getElementById("btn-add-record");
  addRecordButton.addEventListener("click", async () => {
    await openFormMenu();
  });
});

tableSelector.addEventListener("change", (event) => {
  try {
    const selectedTable = event.target.value;
    const table = JSON.parse(localStorage.getItem(selectedTable)) || [];
    const contenedorTabla = document.getElementById("contenedor-tabla");
    contenedorTabla.innerHTML = showSelectedTable(table);
  } catch (error) {
    console.error("Error al mostrar la tabla seleccionada:", error);
  }
});

document.addEventListener("click", async (event) => {
  if (event.target.id === "btn-abrir-formulario") {
    const container = document.getElementById("modal-container");
    const tableName = event.target.value;
    const html = await openForm(tableName);

    container.innerHTML = html;

    document
      .getElementById("btn-cerrar-modal")
      .addEventListener("click", () => {
        container.innerHTML = "";
      });

    if (tableName === "ordenes") {
      const selector = document.getElementById("selector-cliente");
      const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
      clientes.forEach((cliente) => {
        const option = document.createElement("option");
        option.value = cliente.id;
        option.textContent = cliente.nombre;
        selector.appendChild(option);
      });

      const checkboxGalletas = document.getElementById("checkbox-galletas");
      const inputCantidadGalletas =
        document.getElementById("cantidad-galletas");
      checkboxGalletas.addEventListener("change", () => {
        inputCantidadGalletas.disabled = !checkboxGalletas.checked;
      });

      const checkboxQueques = document.getElementById("checkbox-queques");
      const inputCantidadQueques = document.getElementById("cantidad-queques");

      checkboxQueques.addEventListener("change", () => {
        inputCantidadQueques.disabled = !checkboxQueques.checked;
      });

      document.getElementById("form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const ordenData = {
          total: 0, //suma del cantidad por precio unitario de cada detalle
          id_cliente: document.getElementById("selector-cliente").value,
        };

        const detalleList = [];

        const detalleData = {
          id_orden: null, //id de la orden que recien se creo
          id_producto: null, //id del producto seleccionado (galletas o queques)
          cantidad: 0, //cantidad ingresada en el formulario
          precio_unitario: 0, //precio unitario del producto seleccionado
        };

        if (checkboxGalletas.checked) {
          const cantidadGalletas = parseInt(inputCantidadGalletas.value);
          const idProductoGalletas = getProductInfoByName("galleta").id;
          const precioUnitarioGalletas = getProductInfoByName("galleta").precio;

          detalleList.push({
            ...detalleData,
            id_producto: idProductoGalletas,
            cantidad: cantidadGalletas,
            precio_unitario: precioUnitarioGalletas,
          });

          ordenData.total += cantidadGalletas * precioUnitarioGalletas;
        }

        if (checkboxQueques.checked) {
          const cantidadQueques = parseInt(inputCantidadQueques.value);
          const idProductoQueques = getProductInfoByName("queque").id;
          const precioUnitarioQueques = getProductInfoByName("queque").precio;

          detalleList.push({
            ...detalleData,
            id_producto: idProductoQueques,
            cantidad: cantidadQueques,
            precio_unitario: precioUnitarioQueques,
          });

          ordenData.total += cantidadQueques * precioUnitarioQueques;
        }

        try {
          console.log("Orden a subir: ", ordenData);
          const ordenCreada = await createRecord(ordenData, tableName);
          const idOrdenCreada = ordenCreada.id;

          for (const detalle of detalleList) {
            detalle.id_orden = idOrdenCreada;
            console.log("Detalle a subir: ", detalle);
            await createRecord(detalle, "detalle_ordenes");
          }

          container.innerHTML = "";
          await fetchTables();
          const table = JSON.parse(localStorage.getItem("ordenes")) || [];
          const tableContainer = document.getElementById("contenedor-tabla");
          tableContainer.innerHTML = showSelectedTable(table);
        } catch (error) {
          console.error("Error al guardar la orden y sus detalles:", error);
        }
      });
    }
  }
});

function getProductInfoByName(productName) {
  const productos = JSON.parse(localStorage.getItem("productos")) || [];
  return productos.find((p) => p.nombre.toLowerCase() === productName);
}
