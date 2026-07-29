async function openForm(tableName) {
  try {
    const response = await fetch(`components/formulario_${tableName}.html`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.warn(`No se encontró plantilla personalizada para ${tableName}, usando formulario genérico.`);
    return `
      <form id="form">
        <label>Identificador / Nombre:
          <input type="text" name="nombre" required />
        </label>
        <input type="submit" value="Guardar" />
      </form>
    `;
  }
}

export { openForm };

