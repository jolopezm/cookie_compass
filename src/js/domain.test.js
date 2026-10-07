import test from "node:test";
import assert from "node:assert/strict";
import { buildDeliveryPlan, median, percentChange, summarizeMonth } from "./domain.js";

test("median handles odd and even collections", () => {
  assert.equal(median([9, 3, 6]), 6);
  assert.equal(median([10, 4, 8, 6]), 7);
  assert.equal(median([]), null);
});

test("delivery planning honors configured cadence, day and basket", () => {
  const result = buildDeliveryPlan({
    now: new Date("2026-10-05T12:00:00"),
    customers: [{ id: 1, nombre: "Almacén", frecuencia_compra_dias: 7, dias_entrega: [4], activo: true }],
    products: [{ id: 10, nombre: "Queque" }],
    orders: [{ id: 100, id_cliente: 1, fecha_registro: "2026-10-01T12:00:00" }],
    details: [],
    plans: [{ id_cliente: 1, id_producto: 10, cantidad: 12, frecuencia_dias: 7, activo: true }],
  });

  assert.equal(result.deliveries[0].suggestedDate.getDay(), 4);
  assert.equal(result.deliveries[0].basket[0].cantidad, 12);
  assert.deepEqual(result.production.map((item) => item.quantity), [12]);
});

test("delivery planning ranks overdue customers first", () => {
  const result = buildDeliveryPlan({
    now: new Date("2026-10-05T12:00:00"),
    customers: [
      { id: 1, nombre: "A", frecuencia_compra_dias: 7 },
      { id: 2, nombre: "B", frecuencia_compra_dias: 7 },
    ],
    orders: [
      { id: 1, id_cliente: 1, fecha_registro: "2026-09-20T12:00:00" },
      { id: 2, id_cliente: 2, fecha_registro: "2026-10-03T12:00:00" },
    ],
  });

  assert.equal(result.deliveries[0].customer, "A");
  assert.equal(result.deliveries[0].overdueDays, 8);
});

test("monthly summary separates withdrawals from operating expenses", () => {
  const summary = summarizeMonth(
    [{ id: 1, total: 100_000, fecha_registro: "2026-10-02T12:00:00" }],
    [
      { id: 1, total: 30_000, tipo: "operacional", fecha: "2026-10-03T12:00:00" },
      { id: 2, total: 10_000, tipo: "retiro_personal", fecha: "2026-10-04T12:00:00" },
    ],
    new Date("2026-10-06T12:00:00"),
  );

  assert.equal(summary.cashBalance, 60_000);
  assert.equal(summary.operatingResult, 70_000);
  assert.equal(summary.withdrawals, 10_000);
  assert.equal(summary.sales, 1);
  assert.equal(percentChange(120, 100), 20);
});
