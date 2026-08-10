import Chart from "chart.js/auto";
import { BaseComponent } from "./baseComponent.js";
import { escapeHTML } from "../utils/escapeHTML.js";
import { formatPrice } from "../tableManager.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

class CustomerFrequencyView extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    this.orders = [];
    this.customers = [];
    this.details = [];
    this.products = [];
    this.chart = null;
  }

  render() {
    const { from, to } = this.getCurrentMonthRange();
    this.innerHTML = `
      <div class="frequency-filters" aria-label="Filtros de frecuencia de clientes">
        <label for="frequency-date-from">
          Desde
          <input id="frequency-date-from" type="date" value="${from}" />
        </label>
        <label for="frequency-date-to">
          Hasta
          <input id="frequency-date-to" type="date" value="${to}" />
        </label>
        <label for="frequency-customer">
          Cliente
          <select id="frequency-customer">
            <option value="">Todos los clientes</option>
          </select>
        </label>
        <label for="frequency-product">
          Producto
          <select id="frequency-product">
            <option value="">Todos los productos</option>
          </select>
        </label>
        <button type="button" class="secondary outline frequency-clear">Limpiar filtros</button>
      </div>

      <div class="frequency-chart-wrap">
        <canvas id="customer-frequency-chart"></canvas>
        <p class="frequency-empty" hidden>No hay compras para los filtros seleccionados.</p>
      </div>

      <div class="frequency-table-wrap">
        <table class="striped frequency-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Cantidad de compras</th>
              <th>Última compra</th>
              <th>Frecuencia aproximada</th>
              <th>Total comprado</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;
  }

  setupListeners() {
    this.qsa("input, select").forEach((control) => {
      control.addEventListener("change", () => this.refresh());
    });
    this.qs(".frequency-clear")?.addEventListener("click", () => {
      const { from, to } = this.getCurrentMonthRange();
      this.qs("#frequency-date-from").value = from;
      this.qs("#frequency-date-to").value = to;
      this.qs("#frequency-customer").value = "";
      this.qs("#frequency-product").value = "";
      this.refresh();
    });
  }

  disconnectedCallback() {
    this.chart?.destroy();
    this.chart = null;
  }

  setData({ orders = [], customers = [], details = [], products = [] } = {}) {
    this.orders = orders;
    this.customers = customers;
    this.details = details;
    this.products = products;
    this.populateOptions();
    this.refresh();
  }

  getCurrentMonthRange() {
    const now = new Date();
    return {
      from: this.toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: this.toInputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }

  toInputDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  parseDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  populateOptions() {
    this.populateSelect(
      this.qs("#frequency-customer"),
      this.customers,
      "Todos los clientes",
    );
    this.populateSelect(
      this.qs("#frequency-product"),
      this.products,
      "Todos los productos",
    );
  }

  populateSelect(select, records, defaultLabel) {
    if (!select) return;
    const selectedValue = select.value;
    select.innerHTML = `<option value="">${defaultLabel}</option>`;
    records
      .slice()
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"))
      .forEach((record) => {
        const option = document.createElement("option");
        option.value = record.id;
        option.textContent = record.nombre;
        select.appendChild(option);
      });
    select.value = selectedValue;
  }

  buildRows() {
    const fromValue = this.qs("#frequency-date-from")?.value;
    const toValue = this.qs("#frequency-date-to")?.value;
    const customerId = this.qs("#frequency-customer")?.value || "";
    const productId = this.qs("#frequency-product")?.value || "";
    const from = fromValue ? new Date(`${fromValue}T00:00:00`) : null;
    const to = toValue ? new Date(`${toValue}T23:59:59.999`) : null;

    let allowedOrderIds = null;
    const productTotalsByOrder = new Map();
    if (productId) {
      this.details
        .filter((detail) => String(detail.id_producto) === productId)
        .forEach((detail) => {
          const orderId = String(detail.id_orden);
          const lineTotal =
            (Number(detail.cantidad) || 0) *
            (Number(detail.precio_unitario) || 0);
          productTotalsByOrder.set(
            orderId,
            (productTotalsByOrder.get(orderId) || 0) + lineTotal,
          );
        });
      allowedOrderIds = new Set(productTotalsByOrder.keys());
    }

    const customerNames = new Map(
      this.customers.map((customer) => [String(customer.id), customer.nombre]),
    );
    const grouped = new Map();

    this.orders.forEach((order) => {
      const orderDate = this.parseDate(order.fecha_registro);
      if (!orderDate || (from && orderDate < from) || (to && orderDate > to)) return;
      if (customerId && String(order.id_cliente) !== customerId) return;
      if (allowedOrderIds && !allowedOrderIds.has(String(order.id))) return;

      const key = String(order.id_cliente);
      if (!grouped.has(key)) {
        grouped.set(key, {
          customer: customerNames.get(key) || `Cliente ${key}`,
          dates: [],
          orderIds: new Set(),
          total: 0,
        });
      }
      const entry = grouped.get(key);
      const orderId = String(order.id);
      if (entry.orderIds.has(orderId)) return;
      entry.orderIds.add(orderId);
      entry.dates.push(orderDate);
      entry.total += productId
        ? productTotalsByOrder.get(String(order.id)) || 0
        : Number(order.total) || 0;
    });

    return Array.from(grouped.values())
      .map((entry) => {
        entry.dates.sort((a, b) => a - b);
        const intervals = entry.dates.slice(1).map((date, index) => {
          return (date - entry.dates[index]) / DAY_IN_MS;
        });
        const averageDays = intervals.length
          ? intervals.reduce((sum, days) => sum + days, 0) / intervals.length
          : null;
        return {
          customer: entry.customer,
          purchases: entry.dates.length,
          lastPurchase: entry.dates.at(-1),
          averageDays,
          total: entry.total,
        };
      })
      .sort((a, b) => b.purchases - a.purchases || b.total - a.total);
  }

  refresh() {
    const rows = this.buildRows();
    this.renderTable(rows);
    this.renderChart(rows);
  }

  renderTable(rows) {
    const tbody = this.qs(".frequency-table tbody");
    if (!tbody) return;
    tbody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHTML(row.customer)}</td>
            <td>${row.purchases}</td>
            <td>${escapeHTML(row.lastPurchase.toLocaleDateString("es-CL"))}</td>
            <td>${
              row.averageDays === null
                ? "Sin frecuencia calculable"
                : `${row.averageDays.toFixed(1)} días`
            }</td>
            <td>$${escapeHTML(formatPrice(row.total))}</td>
          </tr>
        `,
      )
      .join("");
  }

  renderChart(rows) {
    const canvas = this.qs("#customer-frequency-chart");
    const empty = this.qs(".frequency-empty");
    if (!canvas || !empty) return;

    this.chart?.destroy();
    this.chart = null;
    const chartRows = rows.slice(0, 10);
    empty.hidden = chartRows.length > 0;
    canvas.hidden = chartRows.length === 0;
    if (chartRows.length === 0) return;

    this.chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: chartRows.map((row) => row.customer),
        datasets: [
          {
            label: "Cantidad de compras",
            data: chartRows.map((row) => row.purchases),
            backgroundColor: "rgba(1, 114, 173, 0.65)",
            borderColor: "#0172ad",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
  }
}

if (!customElements.get("customer-frequency-view")) {
  customElements.define("customer-frequency-view", CustomerFrequencyView);
}

export { CustomerFrequencyView };
