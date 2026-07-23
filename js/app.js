import mostrarTablaSeleccionada from "./utils/mostrarTablaSeleccionada.js";
import { showSelectedTable } from "./tableManager.js";
import { obtenerClientes, guardarCliente } from "./clientes.js";
import { obtenerProductos, guardarProducto } from "./productos.js";
import {
  initFormOrdenes,
  guardarOrden,
  guardarDetalleOrden,
} from "./ordenes.js";

import { fetchTables } from "./supabase.js";

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
  const tableContainer = document.getElementById("contenedor-tabla");
  tableContainer.innerHTML = showSelectedTable(table);
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

async function abrirFormulario(tabla) {
  const contenedor = document.getElementById("modal-container");

  try {
    switch (tabla) {
      case "clientes":
        contenedor.innerHTML = await fetch(
          "../templates/formulario_clientes.html",
        ).then((res) => res.text());
        break;

      case "productos":
        contenedor.innerHTML = await fetch(
          "../templates/formulario_productos.html",
        ).then((res) => res.text());
        break;

      case "ordenes":
        contenedor.innerHTML = await fetch(
          "../templates/formulario_ordenes.html",
        ).then((res) => res.text());
        break;

      default:
        throw new Error("Tabla no válida");
    }
  } catch (error) {
    console.error("Error al abrir el formulario:", error);
  }

  document.getElementById("btn-cerrar-modal").addEventListener("click", () => {
    const contenedor = document.getElementById("modal-container");
    contenedor.innerHTML = "";
  });
}

document
  .getElementById("btn-abrir-nuevo-cliente")
  .addEventListener("click", async () => {
    await abrirFormulario("clientes");

    document
      .getElementById("btn-guardar")
      .addEventListener("click", async () => {
        const nombre = document.getElementById("input-nombre").value;

        try {
          await guardarCliente({ nombre });
          await abrirFormulario("clientes");
          await obtenerClientes();
        } catch (error) {
          console.error("Error al guardar cliente:", error);
        }
      });
  });

document
  .getElementById("btn-abrir-nuevo-producto")
  .addEventListener("click", async () => {
    await abrirFormulario("productos");

    document
      .getElementById("btn-guardar")
      .addEventListener("click", async () => {
        const nombre = document.getElementById("input-nombre").value;
        const precio = parseFloat(
          document.getElementById("input-precio").value,
        );

        try {
          await guardarProducto({ nombre, precio });
          await abrirFormulario("productos");
          await obtenerProductos();
        } catch (error) {
          console.error("Error al guardar producto:", error);
        }
      });
  });

document
  .getElementById("btn-abrir-nueva-orden")
  .addEventListener("click", async () => {
    await abrirFormulario("ordenes");
    await new Promise((resolve) => setTimeout(resolve, 0));

    await initFormOrdenes();

    document
      .getElementById("btn-guardar")
      .addEventListener("click", async () => {
        const cliente = document.getElementById("selector-cliente").value;
        const cantidadGalleta = parseInt(
          document.getElementById("input-cantidad-galleta").value,
          10,
        );
        const cantidadQueque = parseInt(
          document.getElementById("input-cantidad-queque").value,
          10,
        );

        try {
          await guardarOrden({
            cliente,
            cantidadGalleta,
            cantidadQueque,
          });
          await abrirFormulario("ordenes");
        } catch (error) {
          console.error("Error al guardar orden:", error);
        }
      });
  });
