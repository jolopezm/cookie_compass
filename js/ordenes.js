import { supabaseClient } from "./supabase.js";

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

async function guardarOrden(datos) {
  try {
    const { data, error } = await supabaseClient
      .from("ordenes")
      .insert([datos]);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error al guardar orden:", error);
    throw error;
  }
}

async function guardarDetalleOrden(datos) {
  try {
    const { data, error } = await supabaseClient
      .from("detalle_ordenes")
      .insert([datos]);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error al guardar detalle de orden:", error);
    throw error;
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

async function initFormOrdenes() {
  try {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const selectorCliente = document.getElementById("selector-cliente");

    clientes.forEach((cliente) => {
      const option = document.createElement("option");
      option.value = cliente.id;
      option.textContent = cliente.nombre;
      selectorCliente.appendChild(option);
    });

    toggleInput("checkbox-galletas", "input-cantidad-galleta");
    toggleInput("checkbox-queques", "input-cantidad-queque");
  } catch (error) {
    console.error("Error al inicializar el formulario de ordenes:", error);
  }
}

function toggleInput(checkboxId, inputId) {
  const checkbox = document.getElementById(checkboxId);
  const input = document.getElementById(inputId);

  if (!checkbox || !input) return;

  checkbox.addEventListener("change", () => {
    input.disabled = !checkbox.checked;
  });
}
export {
  obtenerOrdenes,
  guardarOrden,
  guardarDetalleOrden,
  mostrarOrdenes,
  initFormOrdenes,
};
