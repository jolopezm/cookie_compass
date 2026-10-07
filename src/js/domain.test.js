import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDeliveryPlan,
  filterCurrentSaleDetails,
  median,
  percentChange,
  summarizeMonth,
} from "./domain.js";

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

test("delivery planning ignores annulled sales but keeps confirmed and legacy history", () => {
  const result = buildDeliveryPlan({
    now: new Date("2026-10-05T12:00:00"),
    customers: [{ id: 1, nombre: "Almacén" }],
    products: [{ id: 10, nombre: "Queque" }],
    orders: [
      { id: 1, id_cliente: 1, fecha_registro: "2026-09-01T12:00:00" },
      { id: 2, id_cliente: 1, fecha_registro: "2026-09-08T12:00:00", estado: "confirmada" },
      { id: 3, id_cliente: 1, fecha_registro: "2026-09-29T12:00:00", estado: "anulada" },
    ],
    details: [
      { id_orden: 1, id_producto: 10, cantidad: 2 },
      { id_orden: 2, id_producto: 10, cantidad: 4 },
      { id_orden: 3, id_producto: 10, cantidad: 100 },
    ],
  });

  assert.equal(result.deliveries[0].cadence, 7);
  assert.equal(result.deliveries[0].lastDelivery.getTime(), new Date(2026, 8, 8).getTime());
  assert.deepEqual(result.deliveries[0].basket.map((item) => item.cantidad), [3]);
  assert.deepEqual(result.production.map((item) => item.quantity), [3]);
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

test("monthly summary ignores annulled sales and counts confirmed or legacy states", () => {
  const summary = summarizeMonth(
    [
      { id: 1, total: 10_000, fecha_registro: "2026-10-01T12:00:00" },
      { id: 2, total: 20_000, fecha_registro: "2026-10-02T12:00:00", estado: "confirmada" },
      { id: 3, total: 40_000, fecha_registro: "2026-10-03T12:00:00", estado: "migrada" },
      { id: 4, total: 80_000, fecha_registro: "2026-10-04T12:00:00", estado: "anulada" },
    ],
    [],
    new Date("2026-10-06T12:00:00"),
  );

  assert.equal(summary.revenue, 70_000);
  assert.equal(summary.cashBalance, 70_000);
  assert.equal(summary.operatingResult, 70_000);
  assert.equal(summary.sales, 3);
});

test("sale details require an existing non-annulled parent order", () => {
  const details = filterCurrentSaleDetails(
    [
      { id: 1, estado: "confirmada" },
      { id: 2, estado: "anulada" },
      { id: 3 },
    ],
    [
      { id: 10, id_orden: 1 },
      { id: 20, id_orden: 2 },
      { id: 30, id_orden: 3 },
      { id: 40, id_orden: 999 },
    ],
  );

  assert.deepEqual(details.map((detail) => detail.id), [10, 30]);
});
