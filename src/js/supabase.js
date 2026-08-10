import { createClient } from "@supabase/supabase-js";
import dataStore from "./dataStore.js";

const DEFAULT_TABLES = [
  "clientes",
  "productos",
  "ordenes",
  "detalle_ordenes",
  "vista_ventas",
];
const ALLOWED_TABLES = new Set(DEFAULT_TABLES);
const TABLE_ORDER = {
  clientes: ["fecha_registro", "id"],
  productos: ["fecha_registro", "id"],
  ordenes: ["fecha_registro", "id"],
  detalle_ordenes: ["fecha_registro", "id"],
  vista_ventas: ["fecha_registro", "orden_id"],
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabaseClient = createClient(supabaseUrl, supabaseKey);

function assertAllowedTable(tableName) {
  if (typeof tableName !== "string" || !ALLOWED_TABLES.has(tableName)) {
    throw new Error(`Tabla no permitida: ${tableName}`);
  }
}

function assertAllowedTables(tables) {
  if (!Array.isArray(tables)) {
    throw new Error("Se esperaba una lista de tablas permitidas.");
  }

  tables.forEach(assertAllowedTable);
}

async function signIn(email, password) {
  return supabaseClient.auth.signInWithPassword({ email, password });
}

async function signOut() {
  return supabaseClient.auth.signOut();
}

async function getSession() {
  return supabaseClient.auth.getSession();
}

function onAuthChange(callback) {
  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((event) => {
    callback(event);
  });
  return subscription;
}

async function fetchRecords(tableName) {
  assertAllowedTable(tableName);

  let query = supabaseClient.from(tableName).select("*");
  TABLE_ORDER[tableName].forEach((column) => {
    query = query.order(column, { ascending: false });
  });

  const { data: fetchedRecords, error } = await query;

  if (error) {
    throw error;
  }
  return fetchedRecords;
}

async function createRecord(payload, tableName) {
  assertAllowedTable(tableName);

  const { data: insertedRecord, error } = await supabaseClient
    .from(tableName)
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return insertedRecord;
}

async function updateRecord(id, payload, tableName) {
  assertAllowedTable(tableName);

  const { data: updatedRecord, error } = await supabaseClient
    .from(tableName)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return updatedRecord;
}

async function deleteRecord(id, tableName) {
  assertAllowedTable(tableName);

  const { data: deletedRecord, error } = await supabaseClient
    .from(tableName)
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return deletedRecord;
}

async function fetchTables(tables = DEFAULT_TABLES) {
  assertAllowedTables(tables);

  await Promise.all(
    tables.map(async (table) => {
      try {
        const records = await fetchRecords(table);
        dataStore.setTable(table, records);
      } catch (error) {
        console.warn(
          `Error al obtener los registros de la tabla ${table}: ${error.message}`,
        );
      }
    }),
  );

  dataStore.setTables(tables);

  console.log("Tablas almacenadas en dataStore.");
}

export {
  supabaseClient,
  DEFAULT_TABLES,
  signIn,
  signOut,
  getSession,
  onAuthChange,
  createRecord,
  fetchTables,
  updateRecord,
  deleteRecord,
};
