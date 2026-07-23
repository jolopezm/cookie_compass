import fechaFormateada from "./utils/formatearFecha.js";

async function obtenerClientes() {
  const { data, error } = await supabaseClient.from("clientes").select("*");

  if (error) {
    console.error("Error al obtener clientes: ", error);
    return;
  }

  console.log("Clientes obtenidos: ", data);
  localStorage.setItem("clientes", JSON.stringify(data));
}

async function guardarCliente(datos) {
  try {
    const { data, error } = await supabaseClient
      .from("clientes")
      .insert([datos]);

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    throw error;
  }
}

function mostrarClientes() {
  const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
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

export { obtenerClientes, guardarCliente, mostrarClientes };
