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
