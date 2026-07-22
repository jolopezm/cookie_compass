import supabaseClient from "./supabase.js";

async function obtenerOrdenes() {
  try {
    const { data, error } = await supabaseClient
      .from("vista_ventas")
      .select("*")
      .order("fecha_registro", { ascending: false });

    if (error) throw error;

    localStorage.setItem("ordenes", JSON.stringify(data));
    console.log("Ordenes obtenidas: ", data);
  } catch (error) {
    console.error("Error al obtener ordenes:", error);
  }
}

async function mostrarOrdenes() {
  await obtenerOrdenes();
  const ordenes = JSON.parse(localStorage.getItem("ordenes")) || [];
  const tbody = document.getElementById("tabla-ordenes");

  let html = "";

  ordenes.forEach((orden) => {
    html += `
            <tr>
                <td>${orden.orden_id}</td>
                <td>${new Date(orden.fecha_registro).toLocaleDateString()}</td>
                <td>${orden.cliente}</td>
                <td>${orden.producto}</td>
                <td>${orden.cantidad}</td>
                <td>${orden.total_linea}</td>
                <td>${orden.total_orden}</td>
            </tr>
        `;
  });

  tbody.innerHTML = html;
}

export { obtenerOrdenes, mostrarOrdenes };
