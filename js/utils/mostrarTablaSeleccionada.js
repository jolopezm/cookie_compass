import obtenerClientes from "../clientes.js";
import obtenerProductos from "../productos.js";

async function mostrarTablaSeleccionada(tabla) {
  const contenedor = document.getElementById("contenedor-tabla");

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

    default:
      return;
  }

  const respuesta = await fetch(archivo);
  const html = await respuesta.text();

  contenedor.innerHTML = html;

  // Ejecutar lógica después de cargar el componente
  if (tabla === "clientes") {
    obtenerClientes();
  }

  if (tabla === "productos") {
    obtenerProductos();
  }
}

export default mostrarTablaSeleccionada;
