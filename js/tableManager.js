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

function formatRow(key, value) {
  const formatted = {};

  if (key.toLowerCase().includes("fecha")) {
    const date = new Date(value);
    formatted[key] = formatDate(date);
  } else if (
    key.toLowerCase().includes("precio") ||
    key.toLowerCase().includes("total")
  ) {
    formatted[key] = formatPrice(value);
  } else {
    formatted[key] = value;
  }

  return formatted;
}

function formatTableData(data) {
  if (!data || data.length === 0) {
    return [];
  }

  const formattedData = data.map((row) => {
    const formattedRow = {};
    for (const key in row) {
      Object.assign(formattedRow, formatRow(key, row[key]));
    }
    return formattedRow;
  });

  return formattedData;
}

export { formatTableData };
