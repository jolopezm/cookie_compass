const supabaseUrl = "https://ibccdlzhptosofuahsxb.supabase.co";
const supabasekey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2NkbHpocHRvc29mdWFoc3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1ODAxNTcsImV4cCI6MjEwMDE1NjE1N30.pY41HzxkrTnUrgi5_xGKVdy3-BSeqVqRDjpmPUMfndQ";

const supabaseClient = supabase.createClient(supabaseUrl, supabasekey);

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
        localStorage.setItem(table, JSON.stringify(records));
      } catch (error) {
        console.warn(`Error al obtener los registros de la tabla ${table}: ${error.message}`);
      }
    })
  );

  localStorage.setItem("tables", JSON.stringify(tables));
}

export {
  supabaseClient,
  createRecord,
  fetchTables,
  updateRecord,
  deleteRecord,
};
