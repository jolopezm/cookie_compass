function formatColumnHeaders(headers) {
  for (let i = 0; i < headers.length; i++) {
    headers[i] = headers[i]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    if (
      headers[i].toLowerCase().includes("precio") ||
      headers[i].toLowerCase() === "total"
    ) {
      headers[i] += " ($)";
    }
  }
  return headers;
}

function formatDate(date) {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
}

function formatPrice(price) {
  if (price === null || price === undefined) {
    return "0.00";
  }

  return `${Number(price).toFixed(2)}`;
}

function formatTableData(tableData) {
  let formattedData = [];
  if (tableData.length > 0) {
    const headers = Object.keys(tableData[0]);
    const formattedHeaders = formatColumnHeaders(headers);
    formattedData.push(formattedHeaders);

    //iteremos por cada fila de la tabla y formateemos los valores según el encabezado
    tableData.forEach((row) => {
      const formattedRow = Object.values(row).map((value, index) => {
        const header = formattedHeaders[index];
        if (header.includes("$")) {
          return formatPrice(value);
        }
        if (header.toLowerCase() === "fecha registro") {
          return formatDate(new Date(value));
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
    html += "<th><input type='checkbox' id='select-all' /></th>";
    data[0].forEach((header) => {
      html += `<th>${header}</th>`;
    });
    html += "</tr></thead>";
    html += "<tbody>";
    for (let i = 1; i < data.length; i++) {
      html += "<tr>";
      html += `<td><input type='checkbox' /></td>`;
      data[i].forEach((cell) => {
        html += `<td>${cell}</td>`;
      });
      html += "</tr>";
    }
    html += "</tbody>";
    html += "</table>";
  } else {
    html = "<p>No hay datos disponibles para esta tabla.</p>";
  }

  return html;
}

export { showSelectedTable };
