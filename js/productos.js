import supabaseClient from "./supabase.js";
import fechaFormateada from "./utils/fechaFormateada.js";

async function obtenerProductos() {
  mostrarLoading(true);

  try {
    const { data, error } = await supabaseClient.from("productos").select("*");

    if (error) throw error;

    mostrarProductos(data);
  } catch (error) {
    console.error("Error al obtener productos:", error);
  } finally {
    mostrarLoading(false);
  }
}

function mostrarProductos(productos) {
  const tabla = document.getElementById("tabla-productos");

  if (!tabla) {
    console.error("No existe la tabla de productos");
    return;
  }

  tabla.innerHTML = "";

  productos.forEach((producto) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${producto.id}</td>
      <td>${fechaFormateada(new Date(producto.fecha_registro))}</td>
      <td>${producto.nombre}</td>
      <td>${formatearPrecio(producto.precio)}</td>
    `;

    tabla.appendChild(fila);
  });
}

function formatearPrecio(precio) {
  if (precio === null || precio === undefined) {
    return "$0.00";
  }

  return `$${Number(precio).toFixed(2)}`;
}

function mostrarLoading(loading) {
  const elemento = document.getElementById("loading");

  if (!elemento) {
    console.error("No existe el elemento loading");
    return;
  }

  elemento.hidden = !loading;
}

export default obtenerProductos;
