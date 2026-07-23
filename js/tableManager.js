function formatColumnHeaders(headers) {
  return headers.map((header) => {
    return header.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  });
}

const formatDate = (date) => {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
};

function formatTableData(tableData) {
  let formattedData = [];
  if (tableData.length > 0) {
    const headers = Object.keys(tableData[0]);
    const formattedHeaders = formatColumnHeaders(headers);
    formattedData.push(formattedHeaders);

    tableData.forEach((row) => {
      const formattedRow = Object.values(row).map((value) => {
        // formatear la fecha solo de la columna "fecha_registro"
        if (
          formattedHeaders.includes("Fecha Registro") &&
          typeof value === "string" &&
          !isNaN(Date.parse(value))
        ) {
          const date = new Date(value);
          return formatDate(date);
        }
        return value;
      });
      formattedData.push(formattedRow);
    });
  }

  return formattedData;
}

function showSelectedTable(table) {
  const data = formatTableData(table);

  let html = "";
  if (data.length > 0) {
    html += "<table class='striped'>";
    html += "<thead><tr>";
    data[0].forEach((header) => {
      html += `<th>${header}</th>`;
    });
    html += "</tr></thead>";
    html += "<tbody>";
    for (let i = 1; i < data.length; i++) {
      html += "<tr>";
      data[i].forEach((cell) => {
        html += `<td>${cell}</td>`;
      });
      html += "</tr>";
    }
    html += "</tbody></table>";
  } else {
    html = "<p>No hay datos disponibles para esta tabla.</p>";
  }

  return html;
}

export { showSelectedTable };
