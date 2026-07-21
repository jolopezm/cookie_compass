import mostrarTablaSeleccionada from "./utils/mostrarTablaSeleccionada.js";
import { abrirSheet, cerrarSheet } from "./utils/sheetController.js";

const selectorTabla = document.getElementById("selector-tabla");

selectorTabla.addEventListener("change", (event) => {
  mostrarTablaSeleccionada(event.target.value);
});

document.getElementById("btn-abrir").addEventListener("click", abrirSheet);
document.getElementById("btn-cerrar").addEventListener("click", cerrarSheet);
