import mostrarTablaSeleccionada from "./utils/mostrarTablaSeleccionada.js";
import { obtenerClientes, guardarCliente } from "./clientes.js";
import { obtenerProductos, guardarProducto } from "./productos.js";

const selectorTabla = document.getElementById("selector-tabla");

document.addEventListener("DOMContentLoaded", () => {
  mostrarTablaSeleccionada(selectorTabla.value);
});

selectorTabla.addEventListener("change", (event) => {
  mostrarTablaSeleccionada(event.target.value);
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
  .addEventListener("click", () => {
    abrirFormulario("ordenes");
  });
