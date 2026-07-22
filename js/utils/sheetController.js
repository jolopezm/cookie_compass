import supabaseClient from "../supabase.js";
/*
export function abrirSheet(id) {
  const sheet = document.getElementById(id);

  if (!sheet) {
    console.error("No existe bottom-sheet");
    return;
  }

  sheet.classList.add("open");
  llenarSelectorClientes();
}

export function cerrarSheet() {
  const sheet = document.getElementById("bottom-sheet");
  sheet.classList.remove("open");
}

function obtenerNombresClientes() {
  const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
  return clientes.map((cliente) => cliente.nombre);
}

export function llenarSelectorClientes() {
  const selectorCliente = document.getElementById("selector-cliente");

  if (!selectorCliente) {
    console.warn("No existe selector-cliente");
    return;
  }

  // limpiar y opción por defecto
  selectorCliente.innerHTML = `
    <option value="">Seleccionar cliente</option>
  `;

  const clientes = JSON.parse(localStorage.getItem("clientes")) || [];

  clientes.forEach((cliente) => {
    const option = document.createElement("option");
    option.value = cliente.nombre;
    option.textContent = cliente.nombre;
    selectorCliente.appendChild(option);
  });
}

const cliente = document.getElementById("selector-cliente");
const checkboxGalleta = document.getElementById("checkbox-galleta");
const checkboxQueque = document.getElementById("checkbox-queque");

const inputCantidadGalleta = document.getElementById("cantidad-galleta");
const inputCantidadQueque = document.getElementById("cantidad-queque");

checkboxGalleta.addEventListener("change", () => {
  if (!inputCantidadGalleta) return;
  inputCantidadGalleta.disabled = !checkboxGalleta.checked;
});

checkboxQueque.addEventListener("change", () => {
  if (!inputCantidadQueque) return;
  inputCantidadQueque.disabled = !checkboxQueque.checked;
});

const btnGuardar = document.getElementById("btn-guardar");

const datosOrden = {
  id_cliente: null,
  total: 0,
};

const item = {
  id_orden: null,
  id_producto: null,
  cantidad: 0,
  precio_unitario: 0,
};

const detalleOrden = [];
const form = document.getElementById("formulario-orden");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const cliente = document.getElementById("selector-cliente");
  const nombreCliente = cliente.value;
  const idCliente = buscarIdClientePorNombre(nombreCliente);

  const cantidadGalleta = parseInt(inputCantidadGalleta.value, 10) || 0;
  const cantidadQueque = parseInt(inputCantidadQueque.value, 10) || 0;

  datosOrden.id_cliente = idCliente;
  datosOrden.total =
    calcularTotal(cantidadGalleta, 5) + calcularTotal(cantidadQueque, 10);

  guardarOrden(datosOrden)
    .then((response) => {
      console.log("Orden guardada:", response);
      item.id_orden = response.id;
      if (cantidadGalleta > 0) {
        item.id_producto = 1; // ID del producto Galleta
        item.cantidad = cantidadGalleta;
        item.precio_unitario = 5;
        detalleOrden.push({ ...item });
      }

      if (cantidadQueque > 0) {
        item.id_producto = 2; // ID del producto Queque
        item.cantidad = cantidadQueque;
        item.precio_unitario = 10;
        detalleOrden.push({ ...item });
      }

      detalleOrden.forEach((detalle) => {
        guardarDetalleOrden(detalle);
      });

      cerrarSheet();
    })
    .catch((error) => {
      console.error("Error al guardar la orden:", error);
    });
});

function buscarIdClientePorNombre(nombre) {
  const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
  const clienteEncontrado = clientes.find(
    (cliente) => cliente.nombre === nombre,
  );
  return clienteEncontrado ? clienteEncontrado.id : null;
}

async function guardarOrden(datos) {
  try {
    const { data, error } = await supabaseClient
      .from("ordenes")
      .insert([datos])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    throw error;
  }
}

function calcularTotal(cantidad, precio) {
  return cantidad * precio;
}

async function guardarDetalleOrden(datos) {
  try {
    console.log("Guardando detalle de orden:", datos);
    const { data, error } = await supabaseClient
      .from("detalle_ordenes")
      .insert([datos]);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}
*/
