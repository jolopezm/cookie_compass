function findFieldKey(data, fieldRaw) {
  const keys = Object.keys(data[0]);
  const lowerRaw = fieldRaw.toLowerCase().replace(/\s+/g, "_");

  return keys.find(
    (k) =>
      k.toLowerCase() === fieldRaw.toLowerCase() ||
      k.toLowerCase().replace(/\s+/g, "_") === lowerRaw ||
      k.toLowerCase().replace(" ($)", "").trim() === fieldRaw.toLowerCase(),
  );
}

function parseDate(str) {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(str);
  }
  const n = Date.parse(str);
  return isNaN(n) ? null : new Date(n);
}

function isDateKey(key) {
  return key.toLowerCase().includes("fecha");
}

function applyFilter(data, fieldRaw, comparator, value) {
  const key = findFieldKey(data, fieldRaw);
  if (!key) return null;

  const isDate = isDateKey(key);
  const isNumeric =
    !isDate &&
    (key.toLowerCase().includes("precio") ||
      key.toLowerCase().includes("total") ||
      (!isNaN(Number(value)) && !isNaN(parseFloat(data[0]?.[key]))));

  return data.filter((row) => {
    const rowValue = row[key];

    if (comparator === "contiene") {
      return String(rowValue)
        .toLowerCase()
        .includes(String(value).toLowerCase());
    }

    let a, b;

    if (isDate) {
      a = parseDate(String(rowValue));
      b = parseDate(value);
      if (!a || !b) return false;
    } else if (isNumeric) {
      a = parseFloat(String(rowValue).replace(/[$,]/g, ""));
      b = parseFloat(value.replace(/[$,]/g, ""));
      if (isNaN(a) || isNaN(b)) return false;
    } else {
      a = String(rowValue).toLowerCase();
      b = String(value).toLowerCase();
    }

    switch (comparator) {
      case "mayor que":
        return a > b;
      case "menor que":
        return a < b;
      case "igual a":
        return a === b;
      default:
        return false;
    }
  });
}

function applySort(data, fieldRaw, direction) {
  const key = findFieldKey(data, fieldRaw);
  if (!key) return null;

  const isDate = isDateKey(key);
  const isNumeric =
    !isDate &&
    (key.toLowerCase().includes("precio") ||
      key.toLowerCase().includes("total") ||
      !isNaN(parseFloat(data[0]?.[key])));

  const sorted = [...data];
  sorted.sort((a, b) => {
    let valA, valB;

    if (isDate) {
      valA = parseDate(String(a[key]));
      valB = parseDate(String(b[key]));
    } else if (isNumeric) {
      valA = parseFloat(String(a[key]).replace(/[$,]/g, ""));
      valB = parseFloat(String(b[key]).replace(/[$,]/g, ""));
    } else {
      valA = String(a[key]).toLowerCase();
      valB = String(b[key]).toLowerCase();
    }

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

function parseSearchQuery(query, data) {
  if (!data || data.length === 0) return null;

  const segments = query
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 0) return null;

  let result = [...data];
  let matchedAny = false;

  for (const segment of segments) {
    const filterMatch = segment.match(
      /^(.+?)\s+(mayor que|menor que|igual a|contiene)\s+(.+)$/i,
    );
    if (filterMatch) {
      const filtered = applyFilter(
        result,
        filterMatch[1].trim(),
        filterMatch[2].toLowerCase(),
        filterMatch[3].trim(),
      );
      if (filtered) {
        result = filtered;
        matchedAny = true;
      }
      continue;
    }

    const sortMatch = segment.match(/^(.+?)\s+(asc|desc)$/i);
    if (sortMatch) {
      const sorted = applySort(
        result,
        sortMatch[1].trim(),
        sortMatch[2].toLowerCase(),
      );
      if (sorted) {
        result = sorted;
        matchedAny = true;
      }
      continue;
    }
  }

  return matchedAny ? result : null;
}

export { parseSearchQuery, applyFilter, applySort };
