import { BaseComponent } from "./baseComponent.js";
import { signIn } from "../supabase.js";

class LoginForm extends BaseComponent {
  render() {
    this.innerHTML = `
      <div class="login-container">
        <article class="login-card">
          <header>
              <h3>Inicia sesión para continuar</h3>
          </header>
          <form id="login-form">
            <label for="email">
              Correo electrónico
              <input type="email" id="email" name="email"
                     placeholder="correo@ejemplo.com" required autocomplete="email">
            </label>
            <label for="password">
              Contraseña
              <input type="password" id="password" name="password"
                     placeholder="••••••••" required autocomplete="current-password">
            </label>
            <details name="example">
              <summary>No tienes cuenta?</summary>
              <small>Contacta al administrador para proporcionarte una.</small>
            </details>
            <details name="example">
              <summary>Olvidé mi contraseña</summary>
              <small>Contacta al administrador para recuperar tu contraseña.</small>
            </details>
            <div id="login-error" class="error-message" hidden></div>
            <button type="submit">Iniciar Sesión</button>
          </form>
        </article>
      </div>
    `;
  }

  setupListeners() {
    this.qs("#login-form").addEventListener("submit", (e) =>
      this.handleSubmit(e),
    );
  }

  setLoading(isLoading) {
    const btn = this.qs('button[type="submit"]');
    const inputs = this.qsa("input");
    if (isLoading) {
      btn.setAttribute("aria-busy", "true");
      btn.textContent = "Ingresando...";
      inputs.forEach((i) => (i.disabled = true));
    } else {
      btn.removeAttribute("aria-busy");
      btn.textContent = "Iniciar Sesión";
      inputs.forEach((i) => (i.disabled = false));
    }
  }

  showError(message) {
    const el = this.qs("#login-error");
    el.textContent = message;
    el.hidden = false;
  }

  hideError() {
    const el = this.qs("#login-error");
    el.textContent = "";
    el.hidden = true;
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.hideError();

    const email = this.qs("#email").value.trim();
    const password = this.qs("#password").value;

    if (!email || !password) return;

    this.setLoading(true);

    const { data, error } = await signIn(email, password);

    this.setLoading(false);

    if (error) {
      this.showError(
        error.message === "Invalid login credentials"
          ? "Credenciales inválidas."
          : error.message,
      );
      return;
    }

    this.emit("auth-success", { email });
  }
}

customElements.define("login-form", LoginForm);
