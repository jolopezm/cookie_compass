export function abrirSheet() {
  const sheet = document.getElementById("bottom-sheet");

  if (!sheet) {
    console.error("No existe bottom-sheet");
    return;
  }

  sheet.classList.add("open");
}

export function cerrarSheet() {
  const sheet = document.getElementById("bottom-sheet");
  sheet.classList.remove("open");
}
