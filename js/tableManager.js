function formatHeaders(headers) {
  for (let i = 0; i < headers.length; i++) {
    headers[i] = headers[i]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    if (
      headers[i].toLowerCase().includes("precio") ||
      headers[i].toLowerCase().includes("total")
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

  return parseFloat(price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTableData(data) {
  if (!data || data.length === 0) {
    return [];
  }

  const rawHeaders = Object.keys(data[0]);
  const headers = formatHeaders([...rawHeaders]);

  const rows = data.map((row) => {
    const formattedRow = {};
    for (let i = 0; i < rawHeaders.length; i++) {
      const rawKey = rawHeaders[i];
      const formattedKey = headers[i];
      const value = row[rawKey];
      if (rawKey.toLowerCase().includes("fecha")) {
        formattedRow[formattedKey] = formatDate(new Date(value));
      } else if (
        rawKey.toLowerCase().includes("precio") ||
        rawKey.toLowerCase().includes("total")
      ) {
        formattedRow[formattedKey] = formatPrice(value);
      } else {
        formattedRow[formattedKey] = value;
      }
    }
    return formattedRow;
  });

  rows.headers = headers;
  return rows;
}

export { formatTableData };
