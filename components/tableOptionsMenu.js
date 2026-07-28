import { BaseComponent } from "./baseComponent.js";

class ActionMenu extends BaseComponent {
  constructor() {
    super();

    this.shadowRoot.innerHTML = `
      <style>
        .action-menu {
          display: flex;
        }

        button {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        svg {
          width: 16px;
          height: 16px;
        }
      </style>

      <div class="action-menu">
        <button id="filter-btn">
          ${this.iconFilter()}
        </button>

        <button id="edit-btn">
          ${this.iconEdit()}
        </button>

        <button id="delete-btn">
          ${this.iconDelete()}
        </button>

        <button id="add-btn">
          ${this.iconAdd()}
        </button>
      </div>
    `;

    this.dom = {
      filterBtn: this.shadowRoot.getElementById("filter-btn"),
      editBtn: this.shadowRoot.getElementById("edit-btn"),
      deleteBtn: this.shadowRoot.getElementById("delete-btn"),
      addBtn: this.shadowRoot.getElementById("add-btn"),
    };

    this.initEvents();
  }

  // =====================
  // ICONOS
  // =====================

  iconEdit() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    `;
  }

  iconDelete() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18"/>
        <path d="M8 6v-2h8v2"/>
        <path d="M19 6l-1 14H6L5 6"/>
      </svg>
    `;
  }

  iconAdd() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14"/>
        <path d="M5 12h14"/>
      </svg>
    `;
  }

  iconFilter() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 6h16"/>
        <path d="M6 12h12"/>
        <path d="M10 18h4"/>
      </svg>
    `;
  }

  // =====================

  initEvents() {
    this.dom.filterBtn.addEventListener("click", () => {
      console.log("Filter clicked");
    });

    this.dom.editBtn.addEventListener("click", () => {
      console.log("Edit clicked");
    });

    this.dom.deleteBtn.addEventListener("click", () => {
      console.log("Delete clicked");
    });

    this.dom.addBtn.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("add-record", { bubbles: true, composed: true }),
      );
    });
  }
}

customElements.define("action-menu", ActionMenu);
