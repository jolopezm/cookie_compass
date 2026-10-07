import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDeliveryPlan,
  median,
  percentChange,
  summarizeMonth,
  summarizeProductSales,
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

test("product sales include only details from orders in the selected month", () => {
  const orders = [
    { id: 10, fecha_registro: "2026-01-02T12:00:00" },
    { id: 11, fecha_registro: "2025-12-30T12:00:00" },
  ];
  const details = [
    { id_orden: 10, id_producto: 2, cantidad: 2, precio_unitario: 1_500 },
    { id_orden: "10", id_producto: 1, cantidad: 1, precio_unitario: 4_000 },
    { id_orden: 11, id_producto: 1, cantidad: 20, precio_unitario: 4_000 },
  ];
  const products = [
    { id: 1, nombre: "Torta" },
    { id: 2, nombre: "Galleta" },
  ];
  const originalData = structuredClone({ orders, details, products });

  const ranking = summarizeProductSales(
    orders,
    details,
    products,
    new Date("2025-12-15T12:00:00"),
    1,
  );

  assert.deepEqual(ranking, [
    { id: "1", name: "Torta", units: 1, amount: 4_000 },
    { id: "2", name: "Galleta", units: 2, amount: 3_000 },
  ]);
  assert.deepEqual({ orders, details, products }, originalData);
});

test("product sales return an empty ranking when the selected month has no orders", () => {
  const ranking = summarizeProductSales(
    [{ id: 10, fecha_registro: "2026-01-02T12:00:00" }],
    [{ id_orden: 10, id_producto: 1, cantidad: 1, precio_unitario: 4_000 }],
    [{ id: 1, nombre: "Torta" }],
    new Date("2026-02-15T12:00:00"),
  );

  assert.deepEqual(ranking, []);
});
