import { BaseComponent } from "./baseComponent.js";

class ModalNewRecord extends BaseComponent {
  constructor() {
    super();

    this.shadowRoot.innerHTML = `
      <dialog id="modal">
        <article>
          <h3>Nuevo registro</h3>
          <button id="close">Cerrar</button>
        </article>
      </dialog>
    `;

    this.dialog = this.shadowRoot.getElementById("modal");

    this.shadowRoot
      .getElementById("close")
      .addEventListener("click", () => this.close());
  }

  open() {
    this.dialog.showModal();
  }

  close() {
    this.dialog.close();
  }
}

customElements.define("modal-new-record", ModalNewRecord);
export { ModalNewRecord };
