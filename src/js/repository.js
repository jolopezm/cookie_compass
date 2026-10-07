import { supabase } from "./supabase.js";

const CORE_TABLES = {
  customers: ["clientes", "fecha_registro"],
  products: ["productos", "fecha_registro"],
  orders: ["ordenes", "fecha_registro"],
  details: ["detalle_ordenes", "fecha_registro"],
};

const OPTIONAL_TABLES = {
  plans: ["planes_cliente_producto", "fecha_registro"],
  materials: ["materias_primas", "nombre"],
  recipes: ["recetas", "fecha_registro"],
  recipeDetails: ["detalle_recetas", "fecha_registro"],
  expenses: ["egresos", "fecha"],
  purchases: ["detalle_compras", "fecha_registro"],
  productions: ["producciones", "fecha"],
  inventoryMovements: ["movimientos_inventario", "fecha"],
  stock: ["stock_materias_primas", "nombre"],
  costs: ["costos_productos", "producto"],
};

const MUTABLE_TABLES = new Set([
  "clientes",
  "productos",
  "materias_primas",
  "recetas",
  "planes_cliente_producto",
  "egresos",
]);
const CREATE_ONLY_TABLES = new Set(["movimientos_inventario"]);

async function fetchTable(table, orderBy) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderBy, { ascending: table === "materias_primas" || table.startsWith("stock_") });
  if (error) throw error;
  return data || [];
}

async function fetchAppData() {
  const coreEntries = await Promise.all(
    Object.entries(CORE_TABLES).map(async ([key, [table, orderBy]]) => [key, await fetchTable(table, orderBy)]),
  );
  const data = Object.fromEntries(coreEntries);
  let schemaReady = true;

  const optionalEntries = await Promise.all(
    Object.entries(OPTIONAL_TABLES).map(async ([key, [table, orderBy]]) => {
      try {
        return [key, await fetchTable(table, orderBy)];
      } catch (error) {
        if (["42P01", "PGRST205", "PGRST200"].includes(error.code)) {
          schemaReady = false;
          return [key, []];
        }
        throw error;
      }
    }),
  );

  return { ...data, ...Object.fromEntries(optionalEntries), schemaReady };
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function createRecord(table, payload) {
  if (!MUTABLE_TABLES.has(table) && !CREATE_ONLY_TABLES.has(table)) {
    throw new Error(`Tabla no permitida: ${table}`);
  }
  const { data, error } = await supabase.from(table).insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

async function updateRecord(table, id, payload) {
  if (!MUTABLE_TABLES.has(table)) throw new Error(`Tabla no permitida: ${table}`);
  const { data, error } = await supabase.from(table).update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

async function deleteRecord(table, id) {
  if (!MUTABLE_TABLES.has(table)) throw new Error(`Tabla no permitida: ${table}`);
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

async function createSale({ customerId, date, lines }) {
  const { data, error } = await supabase.rpc("registrar_venta", {
    p_id_cliente: customerId,
    p_fecha: date,
    p_detalles: lines,
  });
  if (error) throw error;
  return data;
}

async function createExpense(payload) {
  return createRecord("egresos", payload);
}

async function recordPurchase({ supplier, date, description, lines }) {
  const { data, error } = await supabase.rpc("registrar_compra_materia_prima", {
    p_proveedor: supplier,
    p_fecha: date,
    p_descripcion: description || null,
    p_detalles: lines,
  });
  if (error) throw error;
  return data;
}

async function recordProduction({ productId, quantity, date, notes }) {
  const { data, error } = await supabase.rpc("registrar_produccion", {
    p_id_producto: productId,
    p_cantidad: quantity,
    p_fecha: date,
    p_observaciones: notes || null,
  });
  if (error) throw error;
  return data;
}

async function adjustInventory({ materialId, type, quantity, date, comment }) {
  return createRecord("movimientos_inventario", {
    id_materia_prima: materialId,
    tipo: type,
    cantidad: quantity,
    fecha: date,
    comentario: comment || null,
  });
}

async function saveRecipe({ productId, yieldQuantity, name, notes, lines }) {
  const { data, error } = await supabase.rpc("guardar_receta", {
    p_id_producto: productId,
    p_rendimiento: yieldQuantity,
    p_nombre: name || null,
    p_notas: notes || null,
    p_detalles: lines,
  });
  if (error) throw error;
  return data;
}

export {
  adjustInventory,
  createExpense,
  createRecord,
  createSale,
  deleteRecord,
  fetchAppData,
  recordProduction,
  recordPurchase,
  saveRecipe,
  signIn,
  signOut,
  updateRecord,
};
