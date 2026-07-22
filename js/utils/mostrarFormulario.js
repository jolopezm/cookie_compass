async function mostrarFormulario(tabla) {
  const contenedor = document.getElementById("sheet-content");
  contenedor.innerHTML = `
        <span aria-busy="true"></article>
    `;

  try {
    const respuesta = await fetch("templates/formulario_" + tabla + ".html");
    const html = await respuesta.text();

    contenedor.innerHTML = html;
  } catch (error) {
    console.error("Error al mostrar el formulario:", error);
  }
}

export default mostrarFormulario;
