import { BaseComponent } from "./baseComponent.js";

class ActionButton extends BaseComponent {
  constructor() {
    super();

    this.shadowRoot.innerHTML += `
    <style>
        button {
          padding: 5px;
          border-radius: 40px;
        }
      </style>
      <button id="action-btn">Button</button>
    `;

    this.dom = {
      btn: this.shadowRoot.getElementById("action-btn"),
    };

    this.initEvents();
  }

  // 4. Set up internal listeners cleanly
  initEvents() {
    this.dom.btn.addEventListener("click", () => {
      console.log("Button clicked! Implement your logic here.");
    });
  }

  // 5. Clean public API to update data from the outside
  /*
  setData(user) {
    this.dom.name.textContent = user.name;
    this.dom.role.textContent = user.role;
  }
    */
}

// Register the custom tag
customElements.define("action-button", ActionButton);
export { ActionButton };
