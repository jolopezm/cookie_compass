import { createClient } from "@supabase/supabase-js";
import dataStore from "./dataStore.js";

const supabaseUrl = "https://ibccdlzhptosofuahsxb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2NkbHpocHRvc29mdWFoc3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1ODAxNTcsImV4cCI6MjEwMDE1NjE1N30.pY41HzxkrTnUrgi5_xGKVdy3-BSeqVqRDjpmPUMfndQ";

const supabaseClient = createClient(supabaseUrl, supabaseKey);

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
  const { data: fetchedRecords, error } = await supabaseClient
    .from(tableName)
    .select("*");

  if (error) {
    throw error;
  }
  return fetchedRecords;
}

async function createRecord(payload, tableName) {
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

async function fetchTables() {
  const tables = [
    "clientes",
    "productos",
    "ordenes",
    "detalle_ordenes",
    "vista_ventas",
  ];

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

  console.log("Tablas almacenadas en dataStore.");
}

export {
  supabaseClient,
  signIn,
  signOut,
  getSession,
  onAuthChange,
  createRecord,
  fetchTables,
  updateRecord,
  deleteRecord,
};
