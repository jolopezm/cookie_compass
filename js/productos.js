import supabaseClient from "./supabase.js";
import formatearFecha from "./utils/formatearFecha.js";
import formatearPrecio from "./utils/formatearPrecio.js";

async function obtenerProductos() {
  try {
    const { data, error } = await supabaseClient.from("productos").select("*");

    if (error) throw error;

    mostrarProductos(data);
  } catch (error) {
    console.error("Error al obtener productos:", error);
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
      <td>${formatearFecha(new Date(producto.fecha_registro))}</td>
      <td>${producto.nombre}</td>
      <td>${formatearPrecio(producto.precio)}</td>
    `;

    tabla.appendChild(fila);
  });
}

export default obtenerProductos;
