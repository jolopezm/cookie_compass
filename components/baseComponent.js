class BaseComponent extends HTMLElement {
  static _globalStyles = [];

  static set globalStyles(sheets) {
    this._globalStyles = sheets;
  }

  static get globalStyles() {
    return this._globalStyles;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = BaseComponent._globalStyles;
  }
}

export { BaseComponent };
