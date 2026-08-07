import Chart from "chart.js/auto";
import { BaseComponent } from "./baseComponent.js";
import { formatPrice } from "../tableManager.js";

class SalesChartView extends BaseComponent {
  constructor() {
    super({ useShadowDOM: false });
    this.rawData = [];
    this.chart = null;
  }

  render() {
    this.innerHTML = `
      <div class="sales-chart-card">
        <div class="sales-chart-header">
          <strong>Ventas de Queques y Galletas</strong>
          <p id="sales-chart-period-label"></p>
        </div>

        <div class="sales-chart-wrap">
          <canvas id="sales-chart-canvas"></canvas>
          <p class="sales-chart-empty" hidden>No hay datos de ventas para graficar.</p>
        </div>

        <section class="sales-chart-summary" aria-label="Resumen de ventas del periodo">
          <article>
            <strong>Monto vendido</strong>
            <div data-summary="total-amount">$0.00</div>
            <small data-summary="total-units">0 unidades vendidas</small>
          </article>
          <article>
            <strong>Queque</strong>
            <div data-summary="queque-units">0 unidades</div>
            <small data-summary="queque-amount">$0.00</small>
          </article>
          <article>
            <strong>Galleta</strong>
            <div data-summary="galleta-units">0 unidades</div>
            <small data-summary="galleta-amount">$0.00</small>
          </article>
        </section>

        <article class="sales-chart-ranking">
          <strong>Ranking de recaudación por mes</strong>
          <ol id="sales-chart-ranking-list"></ol>
        </article>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.renderChart();
  }

  setupListeners() {
    const monthSelect = document.getElementById("sales-chart-month");
    const yearSelect = document.getElementById("sales-chart-year");
    const allYearToggle = document.getElementById("sales-chart-all-year");

    if (monthSelect && allYearToggle) {
      monthSelect.disabled = allYearToggle.checked;
    }

    [monthSelect, yearSelect, allYearToggle].forEach((select) => {
      if (!select) return;
      select.addEventListener("change", () => {
        if (allYearToggle && monthSelect) {
          monthSelect.disabled = allYearToggle.checked;
        }
        this.renderChart();
      });
    });
  }

  setData(data) {
    this.rawData = Array.isArray(data) ? data : [];
    if (!this.hidden) {
      this.renderChart();
    }
  }

  refresh() {
    if (!this.hidden) {
      this.renderChart();
    }
  }

  normalizeKey(key) {
    return String(key)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  resolveFieldKey(expectedKeys, fallbackMatcher) {
    const keys = Object.keys(this.rawData[0] || {});
    for (const expected of expectedKeys) {
      const normalizedExpected = this.normalizeKey(expected);
      const exact = keys.find(
        (key) => this.normalizeKey(key) === normalizedExpected,
      );
      if (exact) return exact;
    }

    return keys.find((key) => fallbackMatcher(this.normalizeKey(key))) || "";
  }

  parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  resolveDatasetKeys() {
    const dateKey = this.resolveFieldKey(
      ["registro_fecha", "fecha registro"],
      (key) => key.includes("fecha"),
    );
    const productKey = this.resolveFieldKey(["Producto"], (key) =>
      key.includes("producto"),
    );
    const quantityKey = this.resolveFieldKey(
      ["cantidad", "cantidad vendida", "unidades", "qty"],
      (key) =>
        key.includes("cantidad") || key.includes("unidad") || key === "qty",
    );
    const totalKey = this.resolveFieldKey(
      [
        "Total orden",
        "total_orden",
        "total orden ($)",
        "monto",
        "subtotal",
        "importe",
      ],
      (key) =>
        key.includes("total") ||
        key.includes("monto") ||
        key.includes("importe") ||
        key.includes("subtotal"),
    );

    return { dateKey, productKey, quantityKey, totalKey };
  }

  parseNumber(value) {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = parseFloat(String(value).replace(/[$,]/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  getMonthNames() {
    return [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
  }

  getSelectedPeriod() {
    const monthSelect = document.getElementById("sales-chart-month");
    const yearSelect = document.getElementById("sales-chart-year");
    const allYearToggle = document.getElementById("sales-chart-all-year");
    const month = Number(monthSelect?.value ?? 0);
    const year = Number(yearSelect?.value ?? 2026);
    return {
      month: Number.isNaN(month) ? 0 : month,
      year: Number.isNaN(year) ? 2026 : year,
      allYear: Boolean(allYearToggle?.checked),
    };
  }

  getPeriodLabel(month, year) {
    return `${this.getMonthNames()[month] || "Mes"} ${year}`;
  }

  updateSummary(summary) {
    const setText = (selector, value) => {
      const element = this.qs(selector);
      if (element) element.textContent = value;
    };

    setText('[data-summary="total-amount"]', formatPrice(summary.totalAmount));
    setText(
      '[data-summary="total-units"]',
      `${summary.totalUnits} unidades vendidas`,
    );
    setText(
      '[data-summary="queque-units"]',
      `${summary.queque.units} unidades`,
    );
    setText(
      '[data-summary="queque-amount"]',
      formatPrice(summary.queque.amount),
    );
    setText(
      '[data-summary="galleta-units"]',
      `${summary.galleta.units} unidades`,
    );
    setText(
      '[data-summary="galleta-amount"]',
      formatPrice(summary.galleta.amount),
    );

    const periodLabel = this.qs("#sales-chart-period-label");
    if (periodLabel) {
      periodLabel.textContent = summary.periodLabel || "";
    }
  }

  buildMonthlyRanking() {
    const { dateKey, totalKey } = this.resolveDatasetKeys();
    if (!dateKey || !totalKey || this.rawData.length === 0) {
      return [];
    }

    const { year: targetYear } = this.getSelectedPeriod();
    const monthNames = this.getMonthNames();
    const totals = Array(12).fill(0);

    this.rawData.forEach((row) => {
      const date = this.parseDate(row[dateKey]);
      if (!date || date.getFullYear() !== targetYear) return;
      totals[date.getMonth()] += this.parseNumber(row[totalKey]);
    });

    return monthNames
      .map((name, index) => ({ name, amount: totals[index] }))
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }

  updateRanking(ranking) {
    const list = this.qs("#sales-chart-ranking-list");
    if (!list) return;
    list.innerHTML = "";
    ranking.forEach((entry, index) => {
      const item = document.createElement("li");
      item.textContent = `${index + 1}. ${entry.name}: ${formatPrice(entry.amount)}`;
      list.appendChild(item);
    });
  }

  buildSeries() {
    const { dateKey, productKey, quantityKey, totalKey } =
      this.resolveDatasetKeys();
    if (!dateKey || !productKey || this.rawData.length === 0) {
      return null;
    }

    const {
      month: targetMonth,
      year: targetYear,
      allYear,
    } = this.getSelectedPeriod();
    const labels = allYear
      ? this.getMonthNames()
      : Array.from(
          { length: new Date(targetYear, targetMonth + 1, 0).getDate() },
          (_, index) => String(index + 1).padStart(2, "0"),
        );

    const quequeUnits = Array(labels.length).fill(0);
    const galletaUnits = Array(labels.length).fill(0);
    const summary = {
      totalAmount: 0,
      totalUnits: 0,
      queque: { units: 0, amount: 0 },
      galleta: { units: 0, amount: 0 },
      periodLabel: allYear
        ? `Año ${targetYear}`
        : this.getPeriodLabel(targetMonth, targetYear),
    };

    this.rawData.forEach((row) => {
      const date = this.parseDate(row[dateKey]);
      if (!date) return;

      const product = this.normalizeKey(row[productKey]);
      const amount = this.parseNumber(row[totalKey]);
      const units = quantityKey ? this.parseNumber(row[quantityKey]) : 1;

      if (date.getFullYear() !== targetYear) return;
      if (!allYear && date.getMonth() !== targetMonth) return;

      const index = allYear ? date.getMonth() : date.getDate() - 1;
      if (index < 0 || index >= labels.length) return;

      if (product.includes("queque")) {
        quequeUnits[index] += units;
        summary.queque.units += units;
        summary.queque.amount += amount;
      } else if (product.includes("galleta")) {
        galletaUnits[index] += units;
        summary.galleta.units += units;
        summary.galleta.amount += amount;
      }
      summary.totalUnits += units;
      summary.totalAmount += amount;
    });

    this.updateSummary(summary);

    return {
      labels,
      datasets: [
        {
          label: "Queque",
          data: quequeUnits,
          borderColor: "#c25b0e",
          backgroundColor: "rgba(194, 91, 14, 0.12)",
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
        },
        {
          label: "Galleta",
          data: galletaUnits,
          borderColor: "#1b6f4e",
          backgroundColor: "rgba(27, 111, 78, 0.12)",
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
        },
      ],
    };
  }

  renderChart() {
    const canvas = this.qs("#sales-chart-canvas");
    const emptyState = this.qs(".sales-chart-empty");

    if (!canvas || !emptyState) {
      return;
    }

    const series = this.buildSeries();
    if (!series) {
      emptyState.hidden = false;
      canvas.hidden = true;
      this.updateSummary({
        totalAmount: 0,
        totalUnits: 0,
        queque: { units: 0, amount: 0 },
        galleta: { units: 0, amount: 0 },
        periodLabel: "",
      });
      this.updateRanking([]);
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      return;
    }

    emptyState.hidden = true;
    canvas.hidden = false;

    if (this.chart) {
      this.chart.destroy();
    }

    this.updateRanking(this.buildMonthlyRanking());

    this.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: series.labels,
        datasets: series.datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.dataset.label}: ${formatPrice(context.parsed.y || 0)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(28, 33, 44, 0.08)",
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(28, 33, 44, 0.08)",
            },
            ticks: {
              callback(value) {
                return formatPrice(value);
              },
            },
          },
        },
      },
    });
  }
}

if (!customElements.get("sales-chart-view")) {
  customElements.define("sales-chart-view", SalesChartView);
}

export { SalesChartView };
