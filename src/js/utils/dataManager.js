function transformDataToCSV(data) {
  if (!data || !Array.isArray(data)) return "";

  const headers = Object.keys(data[0] || {});
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header] ?? "";
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

function downloadCSV(tableName) {
  const rawData = JSON.parse(localStorage.getItem(tableName)) || [];
  const csvContent = transformDataToCSV(rawData);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const filename = `${tableName || "exported_data"}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export { downloadCSV };
