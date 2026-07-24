async function openForm(tableName) {
  let html = "";

  const response = await fetch(`templates/formulario_${tableName}.html`);
  if (response.ok) {
    html = await response.text();
  } else {
    throw new Error(
      `Error al cargar el formulario para la tabla ${tableName}: ${response.statusText}`,
    );
  }

  return html;
}

async function openFormMenu() {
  const container = document.getElementById("modal-container");
  container.innerHTML = fetch("templates/add-record.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Error al cargar el formulario de menú: ${response.statusText}`,
        );
      }
      return response.text();
    })
    .then((html) => {
      container.innerHTML = html;
    })
    .catch((error) => {
      console.error("Error al mostrar el formulario de menú:", error);
    });
}

export { openForm, openFormMenu };
