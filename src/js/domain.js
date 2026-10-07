const DAY_MS = 86_400_000;

function startOfDay(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value, days) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + days);
  return date;
}

function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function nextPreferredDay(target, allowedDays = []) {
  const date = startOfDay(target);
  const days = allowedDays.map(Number).filter((day) => day >= 0 && day <= 6);
  if (!days.length) return date;
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDays(date, offset);
    if (days.includes(candidate.getDay())) return candidate;
  }
  return date;
}

function getNextMonday(now) {
  const today = startOfDay(now);
  const distance = (8 - today.getDay()) % 7 || 7;
  return addDays(today, distance);
}

function isCurrentSale(order) {
  return order.estado !== "anulada";
}

function filterCurrentSaleDetails(orders, details) {
  const currentOrderIds = new Set(
    orders.filter(isCurrentSale).map((order) => String(order.id)),
  );
  return details.filter((detail) => currentOrderIds.has(String(detail.id_orden)));
}

function buildHistoricalBasket(customerOrders, details) {
  const recentOrders = customerOrders.slice(-4);
  const orderIds = new Set(recentOrders.map((order) => String(order.id)));
  const totals = new Map();
  details.forEach((detail) => {
    if (!orderIds.has(String(detail.id_orden))) return;
    const productId = String(detail.id_producto);
    totals.set(productId, (totals.get(productId) || 0) + Number(detail.cantidad || 0));
  });
  return [...totals].map(([productId, total]) => ({
    id_producto: productId,
    cantidad: Math.max(1, Math.round(total / recentOrders.length)),
    source: "history",
  }));
}

function buildDeliveryPlan({
  customers = [],
  products = [],
  orders = [],
  details = [],
  plans = [],
  now = new Date(),
}) {
  const today = startOfDay(now);
  const nextMonday = getNextMonday(today);
  const productNames = new Map(products.map((product) => [String(product.id), product.nombre]));
  const ordersByCustomer = new Map();

  orders.filter(isCurrentSale).forEach((order) => {
    const key = String(order.id_cliente);
    if (!ordersByCustomer.has(key)) ordersByCustomer.set(key, []);
    ordersByCustomer.get(key).push(order);
  });
  ordersByCustomer.forEach((rows) => rows.sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro)));

  const activePlans = plans.filter((plan) => plan.activo !== false);
  const plansByCustomer = new Map();
  activePlans.forEach((plan) => {
    const key = String(plan.id_cliente);
    if (!plansByCustomer.has(key)) plansByCustomer.set(key, []);
    plansByCustomer.get(key).push(plan);
  });

  const deliveries = customers
    .filter((customer) => customer.activo !== false)
    .map((customer) => {
      const customerOrders = ordersByCustomer.get(String(customer.id)) || [];
      const dates = customerOrders.map((order) => startOfDay(order.fecha_registro)).filter(Boolean);
      const intervals = dates.slice(1).map((date, index) => daysBetween(dates[index], date));
      const customerPlans = plansByCustomer.get(String(customer.id)) || [];
      const inferredFrequency = median(intervals);
      const cadence = Number(customer.frecuencia_compra_dias)
        || Math.max(1, Math.round(inferredFrequency || 7));
      const lastDelivery = dates.at(-1) || null;
      const overrides = [customer.proxima_entrega]
        .filter(Boolean)
        .map(startOfDay)
        .filter((date) => !lastDelivery || date > lastDelivery)
        .sort((a, b) => a - b);
      const targetDate = overrides[0] || (lastDelivery ? addDays(lastDelivery, cadence) : today);
      const suggestedDate = nextPreferredDay(
        targetDate < today ? today : targetDate,
        customer.dias_entrega || [],
      );
      const basket = customerPlans.length
        ? customerPlans.map((plan) => ({
            id_producto: String(plan.id_producto),
            cantidad: Number(plan.cantidad),
            source: "configured",
          }))
        : buildHistoricalBasket(customerOrders, details);

      return {
        id: customer.id,
        customer: customer.nombre,
        cadence,
        lastDelivery,
        targetDate,
        suggestedDate,
        overdueDays: Math.max(0, daysBetween(targetDate, today)),
        basket: basket.map((item) => ({
          ...item,
          product: productNames.get(String(item.id_producto)) || "Producto",
        })),
      };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays || a.targetDate - b.targetDate);

  const production = new Map();
  deliveries
    .filter((delivery) => delivery.suggestedDate < nextMonday)
    .forEach((delivery) => {
      delivery.basket.forEach((item) => {
        const key = String(item.id_producto);
        const current = production.get(key) || {
          id_producto: key,
          product: item.product,
          quantity: 0,
        };
        current.quantity += Number(item.cantidad);
        production.set(key, current);
      });
    });

  return { deliveries, production: [...production.values()], nextMonday };
}

function getPeriodBounds(now = new Date(), monthOffset = 0) {
  return {
    from: new Date(now.getFullYear(), now.getMonth() + monthOffset, 1),
    to: new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1),
  };
}

function summarizeMonth(orders = [], expenses = [], now = new Date(), monthOffset = 0) {
  const { from, to } = getPeriodBounds(now, monthOffset);
  const periodOrders = orders.filter((order) => {
    if (!isCurrentSale(order)) return false;
    const date = new Date(order.fecha_registro);
    return date >= from && date < to;
  });
  const periodExpenses = expenses.filter((expense) => {
    const date = new Date(expense.fecha || expense.fecha_registro);
    return date >= from && date < to;
  });
  const revenue = periodOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const expensesTotal = periodExpenses.reduce((sum, expense) => sum + Number(expense.total || 0), 0);
  const withdrawals = periodExpenses
    .filter((expense) => expense.tipo === "retiro_personal")
    .reduce((sum, expense) => sum + Number(expense.total || 0), 0);

  return {
    revenue,
    expenses: expensesTotal,
    withdrawals,
    operatingExpenses: expensesTotal - withdrawals,
    cashBalance: revenue - expensesTotal,
    operatingResult: revenue - (expensesTotal - withdrawals),
    sales: new Set(periodOrders.map((order) => String(order.id))).size,
  };
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export {
  addDays,
  buildDeliveryPlan,
  daysBetween,
  filterCurrentSaleDetails,
  getNextMonday,
  median,
  percentChange,
  startOfDay,
  summarizeMonth,
};
