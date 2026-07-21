const fechaFormateada = (fecha) => {
  return `${fecha.getDate().toString().padStart(2, "0")}/${(
    fecha.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${fecha.getFullYear()}`;
};

export default fechaFormateada;
