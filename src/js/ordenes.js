import { createRecord, fetchTables } from "./supabase.js";

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
    const cantInput = formElement.querySelector(
      `.cantidad-producto[data-id="${id_producto}"]`,
    );
    const cantidad = cantInput ? parseInt(cantInput.value) || 1 : 1;

    totalOrden += precio_unitario * cantidad;

    productosSeleccionados.push({
      id_producto,
      cantidad,
      precio_unitario,
    });
  });

  // 1. Insertar orden principal
  const nuevaOrden = await createRecord(
    {
      total: totalOrden,
      id_cliente: id_cliente,
    },
    "ordenes",
  );

  if (!nuevaOrden || !nuevaOrden.id) {
    throw new Error(
      "No se pudo obtener el id_orden de la respuesta de Supabase.",
    );
  }

  const id_orden = nuevaOrden.id;

  // 2. Insertar cada producto en detalle_ordenes
  for (const item of productosSeleccionados) {
    const detallePayload = {
      id_orden: id_orden,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    };

    await createRecord(detallePayload, "detalle_ordenes");
  }

  // 3. Sincronizar tablas
  await fetchTables();

  return nuevaOrden;
}

export { procesarCreacionOrden };
