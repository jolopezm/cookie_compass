function formatearPrecio(precio) {
  if (precio === null || precio === undefined) {
    return "$0.00";
  }

  return `$${Number(precio).toFixed(2)}`;
}

export default formatearPrecio;
