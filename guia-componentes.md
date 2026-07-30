# Guía de Componentes — Cookie Compass

## Índice

1. [Anatomía de un Componente](#1-anatomía-de-un-componente)
2. [Acceder al Componente](#2-acceder-al-componente)
3. [Escuchar Eventos](#3-escuchar-eventos)
4. [Insertar Datos](#4-insertar-datos)
5. [Insertar Contenido](#5-insertar-contenido)
6. [Ejecutar y Debuggear](#6-ejecutar-y-debuggear)
7. [Ejemplo Completo: Componente desde Cero](#7-ejemplo-completo-componente-desde-cero)
8. [Checklist de Creación](#8-checklist-de-creación)

---

## 1. Anatomía de un Componente

Cada componente en Cookie Compass es un **Web Component nativo** que extiende `BaseComponent` (el cual extiende `HTMLElement`). No hay framework. No hay Shadow DOM por defecto.

### Estructura mínima

```javascript
import { BaseComponent } from "./baseComponent.js";

class MiComponente extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    // estado interno
    this.valor = 0;
  }

  render() {
    this.innerHTML = `<p>Valor: ${this.valor}</p>`;
  }

  setupListeners() {
    this.qs("p")?.addEventListener("click", () => {
      this.emit("click-valor", { valor: this.valor });
    });
  }
}

customElements.define("mi-componente", MiComponente);
export { MiComponente };
```

### Ciclo de vida (ya implementado en `BaseComponent`)

| Método | Cuándo se llama |
|---|---|
| `constructor()` | Al instanciar el elemento |
| `connectedCallback()` | Cuando se inserta en el DOM **→ llama a `render()` luego `setupListeners()`** |
| `render()` | Debes implementarlo. Construye el HTML interno |
| `setupListeners()` | Debes implementarlo. Conecta event listeners |

### ¿Por qué `render()` llama a `setupListeners()` de nuevo?

Es intencional. Cuando `render()` se ejecuta, se reemplaza `this.innerHTML` y se pierden los listeners anteriores. Por eso `render()` termina llamando a `setupListeners()` para reconectarlos.

---

## 2. Acceder al Componente

### Desde HTML declarativo

```html
<mi-componente id="mi-comp"></mi-componente>
```

### Desde JavaScript

```javascript
// Por ID
const comp = document.getElementById("mi-comp");

// Por selector
const comp = document.querySelector("mi-componente");

// Creación dinámica (método principal en el proyecto)
const comp = document.createElement("mi-componente");
comp.valor = 42;
document.getElementById("container").appendChild(comp);
```

### Patrón usado en Cookie Compass

En `main.js:77-87` se crean componentes dinámicamente:

```javascript
function renderTable(data) {
  const container = document.getElementById("table-container");
  const table = document.createElement("data-table");
  table._fullData = data;
  table.setData(data);
  container.innerHTML = "";
  container.appendChild(table);
}
```

### Referencias internas (dentro del componente)

```javascript
this               // el elemento mismo
this.root          // this.shadowRoot || this (según useShadowDOM)
this.qs("selector")   // this.root.querySelector()
this.qsa("selector")  // this.root.querySelectorAll()
```

---

## 3. Escuchar Eventos

### Emitir eventos personalizados (desde el componente)

Usa `this.emit(nombre, detalle, opciones)` — heredado de `BaseComponent`:

```javascript
this.emit("mi-evento", { mensaje: "algo pasó" });
// Por defecto: bubbles: true, composed: true, cancelable: true

// Con opciones explícitas
this.emit("mi-evento", { dato: 1 }, { bubbles: false });
```

### Escuchar desde afuera

```javascript
const comp = document.getElementById("mi-comp");

comp.addEventListener("mi-evento", (e) => {
  console.log("Detalle:", e.detail);
  // e.detail.mensaje → "algo pasó"
});
```

### Eventos nativos (dentro del componente en `setupListeners`)

```javascript
setupListeners() {
  // Click en un botón
  this.qs("#btn-guardar")?.addEventListener("click", () => {
    this.emit("guardar");
  });

  // Submit de formulario
  this.qs("form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    this.emit("form-submit", { payload: Object.fromEntries(data) });
  });

  // Change en checkbox
  this.qs("#check-all")?.addEventListener("change", (e) => {
    this.emit("seleccion-total", { checked: e.target.checked });
  });
}
```

### Catálogo de eventos del proyecto

| Evento | Lo emite | Detalle | Quién lo escucha |
|---|---|---|---|
| `selection-change` | `data-table` | `{ selectedIds }` | — |
| `add-record` | `action-menu` | — | `main.js` |
| `edit-record` | `action-menu` | — | `main.js` |
| `delete-record` | `action-menu` | — | `main.js` |
| `filter-record` | `action-menu` | — | `main.js` |
| `form-submit` | `formulario-*` | `{ tableName, payload, id }` | `modal-new-record` |
| `form-cancel` | `formulario-*` | — | `modal-new-record` |
| `save-record` | `modal-new-record` | `{ tableName, payload }` | `main.js` |
| `update-record` | `modal-new-record` | `{ tableName, payload, id }` | `main.js` |
| `record-created` | `modal-new-record` | `{ tableName }` | `main.js` |
| `alert` | `modal-new-record` | `{ message, type }` | `main.js` |

### Patrón Promise para diálogos

`ConfirmDialog.show()` y `AlertDialog.show()` retornan una Promise, permitiendo `await`:

```javascript
const confirmado = await document.getElementById("confirm-dialog").show("¿Seguro?");
if (confirmado) { /* proceder */ }
```

### Errores globales

```javascript
window.addEventListener("unhandledrejection", (e) => {
  console.error("Error no capturado:", e.reason);
});
```

---

## 4. Insertar Datos

### Métodos públicos

La forma más común es exponer métodos `set*()` y `get*()`:

```javascript
class MiComponente extends BaseComponent {
  setData(data) {
    this.data = data;
    this.render(); // re-renderiza con los nuevos datos
  }

  getData() {
    return this.data;
  }

  getSelectedIds() {
    return Array.from(this.selectedIds);
  }

  getTotalRows() {
    return this.data.length;
  }
}
```

### Asignación directa de propiedades

```javascript
const comp = document.createElement("data-table");
comp._fullData = data;       // propiedad interna
comp.selectedIds = new Set(); // estado público
```

### Patrón usado en FormularioCliente

```javascript
class FormularioCliente extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    this.editId = null; // estado: ID del registro en edición
  }

  setData(data) {
    this.editId = data.id;
    const input = this.qs("#input-nombre");
    if (input) input.value = data.nombre || "";
  }
}

// Uso:
const form = document.createElement("formulario-clientes");
form.setData({ id: 1, nombre: "Juan" });
```

### Atributos observables (para valores planos)

```javascript
class MiComponente extends BaseComponent {
  static get observedAttributes() {
    return ["valor", "modo"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "valor") this.valor = parseInt(newVal);
    if (name === "modo") this.modo = newVal;
    this.render();
  }
}
```

```html
<mi-componente valor="42" modo="edicion"></mi-componente>
```

**Nota:** Los atributos solo manejan strings. Para datos complejos (objetos, arrays) usa métodos como `setData()`.

---

## 5. Insertar Contenido

### innerHTML (el patrón principal del proyecto)

Como todos los componentes usan `useShadowDOM: false`, el contenido se inserta directamente en el elemento:

```javascript
render() {
  this.innerHTML = `
    <form id="mi-form">
      <label for="input-nombre">Nombre:</label>
      <input type="text" id="input-nombre" name="nombre" required />
      <button type="submit">Guardar</button>
    </form>
  `;
}
```

### setBody() / setBodyElement() (patrón ModalBase)

Para modales con cuerpo dinámico:

```javascript
// HTML plano
modal.setBody(`<p>Mensaje de confirmación</p>`);

// Elemento DOM
const formulario = document.createElement("formulario-clientes");
modal.setBodyElement(formulario);
```

### Inserción de hijos dinámicos (patrón ModalNewRecord)

```javascript
loadForm(tableName, data) {
  const bodyEl = this.qs("#modal-body");
  bodyEl.innerHTML = ""; // limpia

  const form = document.createElement(`formulario-${tableName}`);
  form.addEventListener("form-submit", (e) => this.handleSubmit(e.detail));
  bodyEl.appendChild(form);

  if (data) form.setData(data);
}
```

### insertAdjacentHTML (para añadir sin reemplazar)

```javascript
// en un ModalBase
super.render();
const article = this.qs("article");
article.insertAdjacentHTML("beforeend", `
  <footer>
    <button class="secondary outline">Cancelar</button>
    <button class="contrast">Confirmar</button>
  </footer>
`);
```

### template literals con datos dinámicos

```javascript
render() {
  this.innerHTML = `
    <table>
      <tbody>
        ${this.data.map((row) => `
          <tr>
            <td>${row.nombre}</td>
            <td>${row.precio ?? ""}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}
```

---

## 6. Ejecutar y Debuggear

### Servidor de desarrollo

```bash
npm run dev
```

- Vite con hot reload (cambia un archivo → el navegador recarga automáticamente)
- Abre en `http://localhost:5173`

### Construcción para producción

```bash
npm run build   # genera en dist/
npm run preview # previsualiza la build
```

### Puntos de entrada

```
index.html              → carga el módulo JS
src/js/index.js         → importa CSS, registra componentes, llama a init()
src/js/main.js          → init() → orquestación de toda la app
```

### Debugging en navegador

**console.log / console.error (recomendado para desarrollo rápido):**

```javascript
console.log("Datos recibidos:", this.data);
console.error("Error en render:", error);
```

**Punto de interrupción (breakpoint):**

```javascript
debugger; // el navegador pausa aquí si DevTools está abierto
```

**Patrón de error en el proyecto:**

```javascript
try {
  // operación riesgosa
} catch (error) {
  this.emit("alert", { message: `Error: ${error.message}`, type: "error" });
  console.error("Error al procesar:", error);
}
```

### Chrome DevTools: Elementos

- **Elements panel**: inspecciona el DOM del componente
- **Event Listeners**: en la pestaña "Event Listeners" del panel Elements, ves todos los listeners
- **Console**: interactúa con el componente en vivo:
  ```javascript
  document.querySelector("data-table").getSelectedIds()
  document.querySelector("mi-componente").setData([...])
  ```

### Errores no capturados

El proyecto ya tiene un handler global en `main.js:246-248`:

```javascript
window.addEventListener("unhandledrejection", (e) => {
  console.error("Error no capturado:", e.reason);
});
```

### Pruebas

Actualmente no hay testing configurado. Para probar manualmente:

1. Arranca `npm run dev`
2. Inspecciona el componente en DevTools
3. Usa la consola para llamar métodos públicos
4. Verifica que los eventos se disparen en la pestaña Console

---

## 7. Ejemplo Completo: Componente desde Cero

Vamos a crear un componente `contador-app` que muestra un contador, permite incrementar/decrementar, emite eventos y recibe datos externos.

### Paso 1: Crear el archivo

`src/js/components/contadorApp.js`:

```javascript
import { BaseComponent } from "./baseComponent.js";

class ContadorApp extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    this.valor = 0;
    this.paso = 1;
    this.titulo = "Contador";
  }

  render() {
    this.innerHTML = `
      <article>
        <header><strong id="contador-titulo">${this.titulo}</strong></header>
        <div style="text-align: center; padding: 2rem;">
          <p style="font-size: 3rem; font-weight: bold; margin: 0;" id="contador-valor">${this.valor}</p>
        </div>
        <footer style="display: flex; gap: 0.5rem; justify-content: center;">
          <button id="btn-decrementar" class="secondary outline">- ${this.paso}</button>
          <button id="btn-reiniciar" class="outline">0</button>
          <button id="btn-incrementar" class="contrast">+ ${this.paso}</button>
        </footer>
      </article>
    `;
  }

  setupListeners() {
    this.qs("#btn-incrementar")?.addEventListener("click", () => {
      this.valor += this.paso;
      this.actualizar();
      this.emit("contador-cambio", { valor: this.valor, accion: "incrementar" });
    });

    this.qs("#btn-decrementar")?.addEventListener("click", () => {
      this.valor -= this.paso;
      this.actualizar();
      this.emit("contador-cambio", { valor: this.valor, accion: "decrementar" });
    });

    this.qs("#btn-reiniciar")?.addEventListener("click", () => {
      this.valor = 0;
      this.actualizar();
      this.emit("contador-cambio", { valor: this.valor, accion: "reiniciar" });
    });
  }

  actualizar() {
    const el = this.qs("#contador-valor");
    if (el) el.textContent = this.valor;
  }

  setData(data) {
    if (data.valor !== undefined) this.valor = data.valor;
    if (data.paso !== undefined) this.paso = data.paso;
    if (data.titulo !== undefined) this.titulo = data.titulo;
    this.render();
  }

  getValor() {
    return this.valor;
  }
}

if (!customElements.get("contador-app")) {
  customElements.define("contador-app", ContadorApp);
}

export { ContadorApp };
```

### Paso 2: Importarlo

En `src/js/index.js` o en el componente que lo necesite:

```javascript
import "./components/contadorApp.js";
```

### Paso 3: Usarlo

En HTML:

```html
<contador-app id="mi-contador"></contador-app>
```

O desde JS:

```javascript
const contador = document.createElement("contador-app");
contador.setData({ valor: 10, paso: 2, titulo: "Mis Ventas" });
document.getElementById("container").appendChild(contador);

contador.addEventListener("contador-cambio", (e) => {
  console.log("Nuevo valor:", e.detail.valor, "Acción:", e.detail.accion);
});
```

---

## 8. Checklist de Creación

Al crear un nuevo componente, verifica cada punto:

### Archivo

- [ ] Creado en `src/js/components/<nombre>.js`
- [ ] Importa `BaseComponent` desde `./baseComponent.js`
- [ ] Exporta la clase y la registra con `customElements.define()`
- [ ] Usa `if (!customElements.get("tag-name"))` como guardia contra doble registro

### Clase

- [ ] Extiende `BaseComponent` (o `ModalBase` si es un diálogo)
- [ ] `constructor()` llama a `super({ useShadowDOM: false })` e inicializa estado
- [ ] `render()` construye el HTML completo con `this.innerHTML = \`...\``
- [ ] `setupListeners()` conecta event listeners usando `this.qs()` y `this.qsa()`
- [ ] `render()` llama a `setupListeners()` al final si hay listeners que reconectar

### Comunicación

- [ ] Los eventos personalizados usan `this.emit("nombre-evento", detail)`
- [ ] Los nombres de eventos siguen el patrón `kebab-case`
- [ ] Los eventos que modifican datos tienen detail con `{ tableName, payload, ... }`

### Datos

- [ ] Los métodos públicos de datos siguen el patrón `setData(data)` / `getData()`
- [ ] `setData()` llama a `render()` si el HTML necesita actualizarse
- [ ] Si edita registros, `setData()` guarda `this.editId = data.id`

### Contenido

- [ ] Usa `this.innerHTML = \`...\`` para contenido estático
- [ ] Usa `${ }` para datos dinámicos en templates
- [ ] Usa `this.qs("#contenedor").innerHTML = html` para cuerpo dinámico
- [ ] Si usa `setBodyElement()`, limpia con `.innerHTML = ""` antes de `appendChild()`

### Debugging

- [ ] Los errores atrapados emiten evento `alert` y hacen `console.error()`
- [ ] Si el componente necesita logs de desarrollo, usa `console.log()` condicional o debugger
- [ ] Verifica que `npm run dev` compile sin errores

### Registro

- [ ] En `index.js` o `main.js`: importa el nuevo componente
- [ ] Si es usado en HTML declarativo, agrega el tag en `index.html`
- [ ] Si es creado dinámicamente, usa `document.createElement("tag-name")`

---

**Referencias en el código:**

| Archivo | Propósito |
|---|---|
| `src/js/components/baseComponent.js` | Clase base con `emit()`, `qs()`, `qsa()`, ciclo de vida |
| `src/js/components/modalBase.js` | Base para modales con `showDialog()`, `close()`, `setBody()` |
| `src/js/main.js` | Orquestación: crea componentes, conecta eventos, maneja errores |
| `src/js/index.js` | Punto de entrada: imports e init() |
