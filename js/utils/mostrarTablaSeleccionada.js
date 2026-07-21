import obtenerClientes from "../clientes.js";
import obtenerProductos from "../productos.js";

async function mostrarTablaSeleccionada(tabla) {
  const contenedor = document.getElementById("contenedor-tabla");
  contenedor.innerHTML = `
    <span aria-busy="true">Generating your link...</span>
  `;

  try {
    let archivo;

    switch (tabla) {
      case "clientes":
        archivo = "templates/tabla_clientes.html";
        break;

      case "productos":
        archivo = "templates/tabla_productos.html";
        break;

      case "ordenes":
        archivo = "templates/tabla_ordenes.html";
        break;

      case "":
        archivo = "templates/contenido_vacio.html";
        break;

      default:
        return;
    }

    const respuesta = await fetch(archivo);
    const html = await respuesta.text();

    contenedor.innerHTML = html;

    if (tabla === "clientes") {
      obtenerClientes();
    }

    if (tabla === "productos") {
      obtenerProductos();
    }
  } catch (error) {
    console.error("Error al mostrar la tabla seleccionada:", error);
  }
}

export default mostrarTablaSeleccionada;
