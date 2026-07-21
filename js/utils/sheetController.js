export function abrirSheet() {
  const sheet = document.getElementById("bottom-sheet");

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
btnGuardar.addEventListener("click", () => {
  const form = document.getElementById("formulario-orden");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const cliente = document.getElementById("selector-cliente");
    const clienteSeleccionado = cliente.value;
    const cantidadGalleta = parseInt(inputCantidadGalleta.value, 10) || 0;
    const cantidadQueque = parseInt(inputCantidadQueque.value, 10) || 0;

    const datosOrden = {
      cliente: clienteSeleccionado,
      galletas: checkboxGalleta.checked ? cantidadGalleta : 0,
      queques: checkboxQueque.checked ? cantidadQueque : 0,
    };

    guardarOrden(datosOrden);
  });
});

function guardarOrden(datos) {
  // Aquí iría la lógica para guardar la orden, por ejemplo, en localStorage o en una base de datos
  console.log("Guardando orden:", datos);
}
