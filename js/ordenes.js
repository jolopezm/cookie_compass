import { createRecord, fetchTables } from "./supabase.js";

/**
 * Inicializa los selects y checkboxes del formulario de órdenes
 */
function initFormOrdenes(formContainer) {
  const selectorCliente = formContainer.querySelector("#selector-cliente");
  const productosContainer = formContainer.querySelector("#productos-container");
  const totalPreview = formContainer.querySelector("#total-preview");

  if (!selectorCliente || !productosContainer) return;

  // 1. Cargar Clientes
  const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
  selectorCliente.innerHTML = `<option value="" disabled selected>-- Seleccionar cliente --</option>`;
  clientes.forEach((cliente) => {
    const opt = document.createElement("option");
    opt.value = cliente.id;
    opt.textContent = `${cliente.nombre}`;
    selectorCliente.appendChild(opt);
  });

  // 2. Cargar Productos
  const productos = JSON.parse(localStorage.getItem("productos")) || [];
  productosContainer.innerHTML = "";

  if (productos.length === 0) {
    productosContainer.innerHTML = `<p style="color: var(--pico-muted-color);">No hay productos registrados en el sistema.</p>`;
    return;
  }

  productos.forEach((prod) => {
    const row = document.createElement("div");
    row.className = "grid";
    row.style.cssText = "align-items: center; grid-template-columns: 1fr 120px; gap: 1rem; margin-bottom: 0.5rem;";

    row.innerHTML = `
      <label style="margin-bottom: 0; cursor: pointer;">
        <input type="checkbox" class="checkbox-producto" data-id="${prod.id}" data-precio="${prod.precio}" />
        <strong>${prod.nombre}</strong> ($${parseFloat(prod.precio).toFixed(2)})
      </label>
      <input
        type="number"
        min="1"
        value="1"
        class="cantidad-producto"
        data-id="${prod.id}"
        disabled
        style="margin-bottom: 0;"
        placeholder="Cant."
      />
    `;
    productosContainer.appendChild(row);
  });

  // 3. Listeners para habilitar inputs y calcular total
  const checkboxes = productosContainer.querySelectorAll(".checkbox-producto");
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const prodId = e.target.dataset.id;
      const cantInput = productosContainer.querySelector(`.cantidad-producto[data-id="${prodId}"]`);
      if (cantInput) {
        cantInput.disabled = !e.target.checked;
      }
      calcularTotal();
    });
  });

  const cantInputs = productosContainer.querySelectorAll(".cantidad-producto");
  cantInputs.forEach((input) => {
    input.addEventListener("input", calcularTotal);
  });

  function calcularTotal() {
    let total = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        const precio = parseFloat(cb.dataset.precio) || 0;
        const prodId = cb.dataset.id;
        const cantInput = productosContainer.querySelector(`.cantidad-producto[data-id="${prodId}"]`);
        const cantidad = cantInput ? parseInt(cantInput.value) || 1 : 1;
        total += precio * cantidad;
      }
    });

    if (totalPreview) {
      totalPreview.textContent = `$${total.toFixed(2)}`;
    }
    return total;
  }
}

/**
 * Procesa el envío del formulario de órdenes:
 * 1. Calcula el total y extrae el id_cliente
 * 2. Inserta la orden en 'ordenes' -> { total, id_cliente }
 * 3. Inserta N filas en 'detalle_ordenes' -> { id_orden, id_producto, cantidad, precio_unitario }
 */
async function procesarCreacionOrden(formElement) {
  const selectorCliente = formElement.querySelector("#selector-cliente");
  const id_cliente = selectorCliente ? parseInt(selectorCliente.value) : null;

  if (!id_cliente) {
    throw new Error("Debes seleccionar un cliente válido.");
  }

  const checkboxes = formElement.querySelectorAll(".checkbox-producto:checked");
  if (checkboxes.length === 0) {
    throw new Error("Debes seleccionar al menos un producto para la orden.");
  }

  const productosSeleccionados = [];
  let totalOrden = 0;

  checkboxes.forEach((cb) => {
    const id_producto = parseInt(cb.dataset.id);
    const precio_unitario = parseFloat(cb.dataset.precio);
    const cantInput = formElement.querySelector(`.cantidad-producto[data-id="${id_producto}"]`);
    const cantidad = cantInput ? parseInt(cantInput.value) || 1 : 1;

    totalOrden += precio_unitario * cantidad;

    productosSeleccionados.push({
      id_producto,
      cantidad,
      precio_unitario,
    });
  });

  console.log("🚀 Petición 1: Insertando Orden en Supabase...", { total: totalOrden, id_cliente });

  // 1. Insertar orden principal
  const nuevaOrden = await createRecord(
    {
      total: totalOrden,
      id_cliente: id_cliente,
    },
    "ordenes"
  );

  if (!nuevaOrden || !nuevaOrden.id) {
    throw new Error("No se pudo obtener el id_orden de la respuesta de Supabase.");
  }

  const id_orden = nuevaOrden.id;
  console.log("✅ Orden creada con ID:", id_orden);

  // 2. Insertar cada producto en detalle_ordenes
  for (const item of productosSeleccionados) {
    const detallePayload = {
      id_orden: id_orden,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    };

    console.log("🚀 Petición 2: Insertando en detalle_ordenes...", detallePayload);
    await createRecord(detallePayload, "detalle_ordenes");
  }

  // 3. Sincronizar tablas
  await fetchTables();

  return nuevaOrden;
}

export { initFormOrdenes, procesarCreacionOrden };
