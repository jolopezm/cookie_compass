import supabaseClient from "./supabase.js";
import fechaFormateada from "./utils/fechaFormateada.js";

async function obtenerClientes() {
  const { data, error } = await supabaseClient.from("clientes").select("*");

  if (error) {
    console.error("Error al obtener clientes: ", error);
    return;
  }

  console.log("Clientes obtenidos: ", data);
  mostrarClientes(data);
}

function mostrarClientes(clientes) {
  const tabla = document.getElementById("tabla-clientes");

  clientes.forEach((cliente) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
            <td>${cliente.id}</td>
            <td>${fechaFormateada(new Date(cliente.fecha_registro))}</td>
            <td>${cliente.nombre}</td>
        `;

    tabla.appendChild(fila);
  });
}

export default obtenerClientes;
