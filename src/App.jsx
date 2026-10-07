import { useEffect, useRef, useState } from "react";
import { supabase } from "./js/supabase.js";
import {
  adjustInventory,
  createExpense,
  createRecord,
  createSale,
  deleteRecord,
  fetchAppData,
  recordProduction,
  recordPurchase,
  saveRecipe,
  signIn,
  signOut,
  updateRecord,
} from "./js/repository.js";
import {
  buildDeliveryPlan,
  percentChange,
  summarizeMonth,
  summarizeProductSales,
} from "./js/domain.js";

const EMPTY_DATA = {
  customers: [], products: [], orders: [], details: [], plans: [], materials: [],
  recipes: [], recipeDetails: [], expenses: [], purchases: [], productions: [],
  inventoryMovements: [], stock: [], costs: [], schemaReady: true,
};

const NAV_ITEMS = [
  ["home", "Inicio", "home"],
  ["balance", "Balance", "wallet"],
  ["analytics", "Análisis", "chart"],
  ["data", "Datos", "database"],
];

const ICONS = {
  home: "M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z",
  wallet: "M3 6.5A2.5 2.5 0 0 1 5.5 4H19v4h2v10.5a1.5 1.5 0 0 1-1.5 1.5h-14A2.5 2.5 0 0 1 3 17.5zm13 4.5v5h5v-5z",
  chart: "M4 19V9m6 10V5m6 14v-7m5 7H2",
  database: "M20 6c0 2-3.6 3-8 3S4 8 4 6s3.6-3 8-3 8 1 8 3Zm0 6c0 2-3.6 3-8 3s-8-1-8-3m16 6c0 2-3.6 3-8 3s-8-1-8-3V6m16 0v12",
  plus: "M12 5v14m-7-7h14",
  user: "M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
  arrow: "m9 18 6-6-6-6",
  alert: "M12 9v4m0 4h.01M10.3 4.2 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z",
  logout: "M10 17l5-5-5-5m5 5H3m11-9h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6",
  close: "M6 6l12 12M18 6 6 18",
  check: "m5 12 4 4L19 6",
  edit: "m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z",
  trash: "M4 7h16m-10 4v6m4-6v6M9 4h6l1 3H8zm-3 3 1 14h10l1-14",
  refresh: "M20 6v5h-5M4 18v-5h5m10.5-2a8 8 0 0 0-13.8-3L4 11m16 2-1.7 3a8 8 0 0 1-13.8-2",
};

function Icon({ name, size = 22 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function currency(value) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function shortDate(value) {
  if (!value) return "Sin entregas";
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(new Date(value));
}

function dateKey(value = new Date()) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date - offset).toISOString().slice(0, 10);
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (signInError) {
      setError(signInError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-brand">
        <div className="brand-mark">CC</div>
        <p className="eyebrow">Tu semana, bien horneada</p>
        <h1>Cookie<br />Compass</h1>
        <p>Ventas, producción e inventario en un solo lugar.</p>
      </section>
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Bienvenido</p>
          <h2>Inicia sesión</h2>
        </div>
        <label>Correo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy}>{busy ? "Ingresando..." : "Entrar"}</button>
      </form>
    </main>
  );
}

function StatCard({ label, value, note, tone = "default" }) {
  return <article className={`stat-card tone-${tone}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function SchemaNotice() {
  return (
    <aside className="schema-notice">
      <Icon name="alert" />
      <div><strong>Falta actualizar Supabase</strong><p>Ventas y análisis siguen disponibles. Aplica la migración para habilitar costos, inventario y planes configurables.</p></div>
    </aside>
  );
}

function HomeScreen({ data, onAdd }) {
  const plan = buildDeliveryPlan({
    customers: data.customers,
    products: data.products,
    orders: data.orders,
    details: data.details,
    plans: data.plans,
  });
  const weekDeliveries = plan.deliveries.filter((delivery) => delivery.suggestedDate < plan.nextMonday);
  const overdue = plan.deliveries.filter((delivery) => delivery.overdueDays > 0).length;
  const grouped = weekDeliveries.reduce((groups, delivery) => {
    const key = dateKey(delivery.suggestedDate);
    if (!groups[key]) groups[key] = [];
    groups[key].push(delivery);
    return groups;
  }, {});

  return (
    <div className="screen home-screen">
      {!data.schemaReady && <SchemaNotice />}
      <section className="hero-card">
        <div>
          <p className="eyebrow">Plan semanal</p>
          <h2>{weekDeliveries.length} entregas antes del lunes</h2>
          <p>{overdue ? `${overdue} clientes requieren atención prioritaria.` : "La semana está al día."}</p>
        </div>
        <button className="hero-action" onClick={onAdd}><Icon name="plus" /><span>Registrar</span></button>
      </section>

      <section>
        <div className="section-heading"><div><p className="eyebrow">Producción</p><h2>Qué preparar</h2></div><span className="date-chip">Hasta {shortDate(plan.nextMonday)}</span></div>
        <div className="production-grid">
          {plan.production.length ? plan.production.map((item) => (
            <article className="production-card" key={item.id_producto}><strong>{item.quantity}</strong><span>{item.product}</span><small>unidades estimadas</small></article>
          )) : <div className="empty-state">Todavía no hay producción proyectada.</div>}
        </div>
      </section>

      {data.stock.length > 0 && (
        <section>
          <div className="section-heading"><div><p className="eyebrow">Inventario</p><h2>Stock para revisar</h2></div></div>
          <div className="stock-strip">
            {data.stock.filter((item) => item.bajo_minimo).map((item) => (
              <div className="stock-alert" key={item.id}><Icon name="alert" size={18} /><span><strong>{item.nombre}</strong>{Number(item.stock_actual).toLocaleString("es-CL")} {item.unidad_base}</span></div>
            ))}
            {!data.stock.some((item) => item.bajo_minimo) && <div className="stock-ok"><Icon name="check" /> Materias primas sobre el mínimo</div>}
          </div>
        </section>
      )}

      <section>
        <div className="section-heading"><div><p className="eyebrow">Ruta sugerida</p><h2>Próximas entregas</h2></div></div>
        <div className="delivery-days">
          {Object.entries(grouped).map(([day, deliveries]) => (
            <article className="day-group" key={day}>
              <header><div className="day-badge"><span>{new Intl.DateTimeFormat("es-CL", { weekday: "short" }).format(new Date(`${day}T12:00:00`))}</span><strong>{new Date(`${day}T12:00:00`).getDate()}</strong></div><p>{deliveries.length} {deliveries.length === 1 ? "entrega" : "entregas"}</p></header>
              {deliveries.map((delivery) => (
                <div className="delivery-row" key={delivery.id}>
                  <div><strong>{delivery.customer}</strong><span>{delivery.basket.length ? delivery.basket.map((item) => `${item.cantidad} ${item.product}`).join(" · ") : "Configura su entrega habitual"}</span></div>
                  <div className={delivery.overdueDays ? "priority overdue" : "priority"}>{delivery.overdueDays ? `${delivery.overdueDays}d tarde` : `cada ${delivery.cadence}d`}</div>
                </div>
              ))}
            </article>
          ))}
          {!weekDeliveries.length && <div className="empty-state">No hay entregas sugeridas antes del lunes.</div>}
        </div>
      </section>
    </div>
  );
}

function BalanceScreen({ data }) {
  const current = summarizeMonth(data.orders, data.expenses);
  const previous = summarizeMonth(data.orders, data.expenses, new Date(), -1);
  return (
    <div className="screen">
      {!data.schemaReady && <SchemaNotice />}
      <div className="page-title"><p className="eyebrow">Este mes</p><h1>Balance</h1><p>Flujo real de dinero, sin mezclar retiros con costos del negocio.</p></div>
      <div className="balance-feature"><span>Saldo de caja</span><strong>{currency(current.cashBalance)}</strong><small>{current.sales} ventas registradas</small></div>
      <div className="stats-grid">
        <StatCard label="Ingresos" value={currency(current.revenue)} note={`${percentChange(current.revenue, previous.revenue).toFixed(0)}% vs. mes anterior`} tone="positive" />
        <StatCard label="Egresos" value={currency(current.expenses)} note="Salida total de caja" tone="negative" />
        <StatCard label="Resultado operacional" value={currency(current.operatingResult)} note="Excluye retiros personales" />
        <StatCard label="Retiros personales" value={currency(current.withdrawals)} note="No reduce la rentabilidad" />
      </div>
      <section>
        <div className="section-heading"><div><p className="eyebrow">Movimientos</p><h2>Últimos egresos</h2></div></div>
        <div className="movement-list">
          {data.expenses.slice(0, 12).map((expense) => (
            <article className="movement-row" key={expense.id}><div className="movement-icon">−</div><div><strong>{expense.descripcion || expense.proveedor || expense.tipo.replaceAll("_", " ")}</strong><span>{shortDate(expense.fecha)}</span></div><b>−{currency(expense.total)}</b></article>
          ))}
          {!data.expenses.length && <div className="empty-state">Los egresos aparecerán aquí cuando se aplique la migración y registres el primero.</div>}
        </div>
      </section>
    </div>
  );
}

function AnalyticsScreen({ data }) {
  const currentMonth = dateKey().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [year, month] = selectedMonth.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, 1);
  const selected = summarizeMonth(data.orders, data.expenses, selectedDate);
  const previous = summarizeMonth(data.orders, data.expenses, selectedDate, -1);
  const ranking = summarizeProductSales(data.orders, data.details, data.products, selectedDate);
  const maxAmount = ranking[0]?.amount || 1;
  const periodLabel = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(selectedDate);

  return (
    <div className="screen">
      <div className="analytics-header">
        <div className="page-title"><p className="eyebrow">Rendimiento</p><h1>Análisis</h1><p>Resultados de {periodLabel}.</p></div>
        <label className="period-selector">Mes y año<input type="month" value={selectedMonth} max={currentMonth} onChange={(event) => event.target.value && setSelectedMonth(event.target.value)} /></label>
      </div>
      <section className="comparison-card">
        <div><span>Ventas de {periodLabel}</span><strong>{currency(selected.revenue)}</strong></div>
        <div className={`trend ${selected.revenue >= previous.revenue ? "up" : "down"}`}>{percentChange(selected.revenue, previous.revenue).toFixed(0)}%</div>
        <div className="comparison-track"><span style={{ width: `${Math.min(100, previous.revenue ? (selected.revenue / previous.revenue) * 60 : 100)}%` }} /></div>
        <small>Mes anterior: {currency(previous.revenue)}</small>
      </section>
      <div className="stats-grid compact">
        <StatCard label="Ventas" value={selected.sales} note="Órdenes únicas" />
        <StatCard label="Ticket promedio" value={currency(selected.sales ? selected.revenue / selected.sales : 0)} />
      </div>
      <section>
        <div className="section-heading"><div><p className="eyebrow">{periodLabel}</p><h2>Productos que más venden</h2></div></div>
        <div className="ranking-card">
          {ranking.map((item, index) => (
            <div className="rank-row" key={item.id}><span className="rank-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{item.name}</strong><div className="rank-track"><span style={{ width: `${(item.amount / maxAmount) * 100}%` }} /></div><small>{item.units.toLocaleString("es-CL")} unidades</small></div><b>{currency(item.amount)}</b></div>
          ))}
          {!ranking.length && <div className="empty-state">No hay ventas de productos registradas en este mes.</div>}
        </div>
      </section>
      {data.costs.length > 0 && <section><div className="section-heading"><div><p className="eyebrow">Recetas</p><h2>Costo y margen unitario</h2></div></div><div className="cost-grid">{data.costs.map((cost) => { const product = data.products.find((item) => String(item.id) === String(cost.id_producto)); const margin = Number(product?.precio || 0) - Number(cost.costo_unitario || 0); return <article key={cost.id_producto}><span>{cost.producto}</span><strong>{cost.costo_unitario == null ? "Costo incompleto" : currency(cost.costo_unitario)}</strong><small>Margen: {currency(margin)}</small></article>; })}</div></section>}
    </div>
  );
}

function downloadCsv(rows, filename) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.map(quote).join(","), ...rows.map((row) => columns.map((column) => quote(row[column])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function DataScreen({ data, mutate, notify }) {
  const [tab, setTab] = useState("customers");
  const [query, setQuery] = useState("");
  const [customerDays, setCustomerDays] = useState([]);
  const [recipeLines, setRecipeLines] = useState({});
  const tabs = [
    ["customers", "Clientes"], ["products", "Productos"], ["sales", "Ventas"],
    ["expenses", "Egresos"], ["purchases", "Compras"], ["productions", "Producción"],
    ["inventoryMovements", "Inventario"], ["materials", "Materias primas"],
    ["recipes", "Recetas"], ["plans", "Planes"],
  ];
  const rows = tab === "sales" ? data.orders : data[tab] || [];
  const manageableTabs = new Set(["customers", "products", "materials", "recipes", "plans"]);
  const requiresMigration = new Set(["expenses", "purchases", "productions", "inventoryMovements", "materials", "recipes", "plans"]);
  const availableTabs = tabs.filter(([key]) => data.schemaReady || !requiresMigration.has(key));
  const filtered = rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query.toLowerCase())));

  function selectTab(key) {
    setTab(key);
    setQuery("");
  }

  function handleTabKeyDown(event, currentKey) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = availableTabs.findIndex(([key]) => key === currentKey);
    let nextIndex = index;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + availableTabs.length) % availableTabs.length;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % availableTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = availableTabs.length - 1;
    const nextTab = availableTabs[nextIndex][0];
    selectTab(nextTab);
    document.getElementById(`data-tab-${nextTab}`)?.focus();
  }

  async function addRecord(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      if (tab === "customers") await mutate(() => createRecord("clientes", data.schemaReady ? { nombre: values.nombre, frecuencia_compra_dias: Number(values.frecuencia) || null, dias_entrega: customerDays } : { nombre: values.nombre }));
      if (tab === "products") await mutate(() => createRecord("productos", { nombre: values.nombre, precio: Number(values.precio) }));
      if (tab === "materials") await mutate(() => createRecord("materias_primas", { nombre: values.nombre, unidad_base: values.unidad_base, stock_minimo: Number(values.stock_minimo || 0) }));
      if (tab === "plans") await mutate(() => createRecord("planes_cliente_producto", { id_cliente: Number(values.id_cliente), id_producto: Number(values.id_producto), cantidad: Number(values.cantidad) }));
      if (tab === "recipes") {
        const lines = Object.entries(recipeLines).filter(([, quantity]) => Number(quantity) > 0).map(([id_materia_prima, cantidad]) => ({ id_materia_prima: Number(id_materia_prima), cantidad: Number(cantidad) }));
        if (!lines.length) throw new Error("Agrega al menos una materia prima a la receta");
        await mutate(() => saveRecipe({ productId: Number(values.id_producto), yieldQuantity: Number(values.rendimiento), name: values.nombre, lines }));
        setRecipeLines({});
      }
      form.reset();
      setCustomerDays([]);
      notify("Registro guardado");
    } catch (error) { notify(error.message, "error"); }
  }

  async function editRow(row) {
    const table = { customers: "clientes", products: "productos", materials: "materias_primas", recipes: "recetas", plans: "planes_cliente_producto" }[tab];
    const current = row.nombre || row.cantidad;
    const value = window.prompt(tab === "plans" ? "Nueva cantidad habitual" : "Nuevo nombre", current);
    if (value === null || value === "") return;
    try {
      await mutate(() => updateRecord(table, row.id, tab === "plans" ? { cantidad: Number(value) } : { nombre: value }));
      notify("Registro actualizado");
    } catch (error) { notify(error.message, "error"); }
  }

  async function removeRow(row) {
    if (!window.confirm("¿Eliminar este registro? Esta acción puede ser rechazada si tiene información asociada.")) return;
    const table = { customers: "clientes", products: "productos", materials: "materias_primas", recipes: "recetas", plans: "planes_cliente_producto" }[tab];
    try { await mutate(() => deleteRecord(table, row.id)); notify("Registro eliminado"); } catch (error) { notify(error.message, "error"); }
  }

  return (
    <div className="screen">
      {!data.schemaReady && <SchemaNotice />}
      <div className="page-title"><p className="eyebrow">Administración</p><h1>Datos</h1><p>Catálogos y reglas que hacen funcionar tu planificación.</p></div>
      <div className="tab-scroller" role="tablist" aria-label="Tipos de datos">{tabs.map(([key, label]) => <button id={`data-tab-${key}`} key={key} role="tab" aria-controls="data-tab-panel" aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} className={tab === key ? "active" : ""} onClick={() => selectTab(key)} onKeyDown={(event) => handleTabKeyDown(event, key)} disabled={!data.schemaReady && requiresMigration.has(key)}>{label}</button>)}</div>
      <div id="data-tab-panel" role="tabpanel" aria-labelledby={`data-tab-${tab}`}>
      {manageableTabs.has(tab) && <form className="inline-create" onSubmit={addRecord}>
        {tab === "customers" && <><input name="nombre" placeholder="Nombre del cliente" required /><input name="frecuencia" type="number" min="1" placeholder="Frecuencia (días)" /><div className="weekday-picker"><span>Días preferidos</span>{[[1,"L"],[2,"M"],[3,"X"],[4,"J"],[5,"V"],[6,"S"],[0,"D"]].map(([day,label]) => <button type="button" key={day} aria-pressed={customerDays.includes(day)} className={customerDays.includes(day) ? "active" : ""} onClick={() => setCustomerDays(customerDays.includes(day) ? customerDays.filter((item) => item !== day) : [...customerDays, day])}>{label}</button>)}</div></>}
        {tab === "products" && <><input name="nombre" placeholder="Nombre del producto" required /><input name="precio" type="number" min="0" placeholder="Precio" required /></>}
        {tab === "materials" && <><input name="nombre" placeholder="Materia prima" required /><select name="unidad_base"><option value="gramos">Gramos</option><option value="mililitros">Mililitros</option><option value="unidades">Unidades</option></select><input name="stock_minimo" type="number" min="0" placeholder="Stock mínimo" /></>}
        {tab === "recipes" && <><select name="id_producto" required><option value="">Producto</option>{data.products.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><input name="nombre" placeholder="Nombre de la receta" defaultValue="Receta vigente" required /><input name="rendimiento" type="number" min="1" placeholder="Unidades que rinde" required /><div className="recipe-builder"><strong>Ingredientes por receta</strong>{data.materials.map((material) => <label key={material.id}><span>{material.nombre} <small>({material.unidad_base})</small></span><input type="number" min="0" step="0.001" value={recipeLines[material.id] || ""} placeholder="0" onChange={(event) => setRecipeLines({ ...recipeLines, [material.id]: event.target.value })} /></label>)}</div></>}
        {tab === "plans" && <><select name="id_cliente" required><option value="">Cliente</option>{data.customers.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><select name="id_producto" required><option value="">Producto</option>{data.products.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><input name="cantidad" type="number" min="1" placeholder="Cantidad habitual" required /></>}
        <button className="primary-button" disabled={!data.schemaReady && ["materials", "recipes", "plans"].includes(tab)}><Icon name="plus" />Agregar</button>
      </form>}
      <div className="data-toolbar"><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." /><button className="text-button" onClick={() => downloadCsv(filtered, `${tab}.csv`)}>Exportar CSV</button></div>
      <div className="data-list">
        {filtered.map((row) => {
          const customer = data.customers.find((item) => String(item.id) === String(row.id_cliente));
          const product = data.products.find((item) => String(item.id) === String(row.id_producto));
          const material = data.materials.find((item) => String(item.id) === String(row.id_materia_prima));
          let primary = row.nombre || customer?.nombre || product?.nombre || material?.nombre || `Registro ${row.id}`;
          let secondary = "";
          if (tab === "customers") secondary = row.frecuencia_compra_dias ? `${row.frecuencia_compra_dias} días entre entregas` : "Frecuencia sin configurar";
          if (tab === "products") secondary = currency(row.precio);
          if (tab === "sales") secondary = `${shortDate(row.fecha_registro)} · ${currency(row.total)}`;
          if (tab === "expenses") { primary = row.descripcion || row.proveedor || row.tipo; secondary = `${shortDate(row.fecha)} · ${currency(row.total)}`; }
          if (tab === "purchases") { primary = material?.nombre || "Materia prima"; secondary = `${Number(row.cantidad).toLocaleString("es-CL")} unidades base · ${currency(row.subtotal)}`; }
          if (tab === "productions") { primary = product?.nombre || "Producción"; secondary = `${Number(row.cantidad).toLocaleString("es-CL")} unidades · ${shortDate(row.fecha)} · ${currency(row.costo_total)}`; }
          if (tab === "inventoryMovements") { primary = material?.nombre || "Materia prima"; secondary = `${row.tipo.replaceAll("_", " ")} · ${Number(row.cantidad).toLocaleString("es-CL")}`; }
          if (tab === "materials") secondary = `${row.stock_minimo} ${row.unidad_base} mínimo`;
          if (tab === "recipes") { primary = row.nombre; secondary = `${product?.nombre || "Producto"} · rinde ${row.rendimiento}`; }
          if (tab === "plans") { primary = `${customer?.nombre || "Cliente"} · ${product?.nombre || "Producto"}`; secondary = `${row.cantidad} unidades por entrega`; }
          return <article key={row.id}><div><strong>{primary}</strong><span>{secondary}</span></div>{manageableTabs.has(tab) && <div className="row-actions"><button aria-label="Editar" onClick={() => editRow(row)}><Icon name="edit" size={18} /></button><button aria-label="Eliminar" onClick={() => removeRow(row)}><Icon name="trash" size={18} /></button></div>}</article>;
        })}
        {!filtered.length && <div className="empty-state">No hay registros para mostrar.</div>}
      </div>
      </div>
    </div>
  );
}

function QuickAdd({ data, onClose, mutate, notify }) {
  const [type, setType] = useState("sale");
  const [lines, setLines] = useState({});
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef(null);
  const total = data.products.reduce((sum, product) => sum + Number(product.precio) * Number(lines[product.id] || 0), 0);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const focusableSelector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    dialog?.querySelector(focusableSelector)?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    try {
      if (type === "sale") {
        const saleLines = Object.entries(lines).filter(([, quantity]) => Number(quantity) > 0).map(([id_producto, cantidad]) => ({ id_producto: Number(id_producto), cantidad: Number(cantidad) }));
        if (!saleLines.length) throw new Error("Selecciona al menos un producto");
        await mutate(() => createSale({ customerId: Number(values.customer), date: new Date(`${values.date}T12:00:00`).toISOString(), lines: saleLines }));
      }
      if (type === "expense") await mutate(() => createExpense({ fecha: new Date(`${values.date}T12:00:00`).toISOString(), tipo: values.expense_type, descripcion: values.description, total: Number(values.amount) }));
      if (type === "purchase") await mutate(() => recordPurchase({ supplier: values.supplier, date: new Date(`${values.date}T12:00:00`).toISOString(), description: values.description, lines: [{ id_materia_prima: Number(values.material), cantidad: Number(values.quantity), precio_unitario: Number(values.unit_price) }] }));
      if (type === "production") await mutate(() => recordProduction({ productId: Number(values.product), quantity: Number(values.quantity), date: new Date(`${values.date}T12:00:00`).toISOString(), notes: values.description }));
      if (type === "adjustment") await mutate(() => adjustInventory({ materialId: Number(values.material), type: values.adjustment_type, quantity: Number(values.quantity), date: new Date(`${values.date}T12:00:00`).toISOString(), comment: values.description }));
      notify("Movimiento registrado");
      onClose();
    } catch (error) { notify(error.message, "error"); } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
        <header><div><p className="eyebrow">Nuevo movimiento</p><h2 id="quick-add-title">Registrar</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button></header>
        <div className="type-selector">
          {["sale", "expense", "purchase", "production", "adjustment"].map((key) => <button key={key} type="button" aria-pressed={type === key} className={type === key ? "active" : ""} onClick={() => setType(key)} disabled={!data.schemaReady && key !== "sale"}>{{ sale: "Venta", expense: "Egreso", purchase: "Compra", production: "Producción", adjustment: "Ajuste" }[key]}</button>)}
        </div>
        <form onSubmit={submit}>
          <label>Fecha<input name="date" type="date" defaultValue={dateKey()} required /></label>
          {type === "sale" && <><label>Cliente<select name="customer" required><option value="">Selecciona un cliente</option>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nombre}</option>)}</select></label><fieldset><legend>Productos</legend>{data.products.map((product) => <label className="product-line" key={product.id}><span><strong>{product.nombre}</strong><small>{currency(product.precio)} c/u</small></span><input aria-label={`Cantidad de ${product.nombre}`} type="number" min="0" value={lines[product.id] || ""} placeholder="0" onChange={(event) => setLines({ ...lines, [product.id]: event.target.value })} /></label>)}</fieldset><div className="total-preview"><span>Total de la venta</span><strong>{currency(total)}</strong></div></>}
          {type === "expense" && <><label>Categoría<select name="expense_type"><option value="combustible">Combustible</option><option value="operacional">Gasto operacional</option><option value="retiro_personal">Retiro personal</option><option value="otro">Otro</option></select></label><label>Monto<input name="amount" type="number" min="0" required /></label><label>Motivo<input name="description" required placeholder="Describe el gasto" /></label></>}
          {type === "purchase" && <><label>Proveedor<input name="supplier" required /></label><label>Materia prima<select name="material" required><option value="">Selecciona</option>{data.materials.map((item) => <option key={item.id} value={item.id}>{item.nombre} ({item.unidad_base})</option>)}</select></label><div className="form-grid"><label>Cantidad base<input name="quantity" type="number" min="0.001" step="0.001" required /></label><label>Costo por unidad<input name="unit_price" type="number" min="0" step="0.01" required /></label></div><label>Nota<input name="description" /></label></>}
          {type === "production" && <><label>Producto<select name="product" required><option value="">Selecciona</option>{data.products.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><label>Cantidad producida<input name="quantity" type="number" min="1" required /></label><label>Nota<input name="description" /></label></>}
          {type === "adjustment" && <><label>Materia prima<select name="material" required><option value="">Selecciona</option>{data.materials.map((item) => <option key={item.id} value={item.id}>{item.nombre} ({item.unidad_base})</option>)}</select></label><label>Tipo de ajuste<select name="adjustment_type"><option value="ajuste_entrada">Agregar stock</option><option value="ajuste_salida">Descontar stock</option></select></label><label>Cantidad<input name="quantity" type="number" min="0.001" step="0.001" required /></label><label>Motivo<input name="description" required /></label></>}
          {!data.schemaReady && type !== "sale" && <p className="form-error">Aplica la migración de Supabase antes de registrar este movimiento.</p>}
          <button className="primary-button submit-button" disabled={busy || (!data.schemaReady && type !== "sale")}>{busy ? "Guardando..." : "Guardar movimiento"}</button>
        </form>
      </section>
    </div>
  );
}

function SettingsScreen({ session, onBack }) {
  const [busy, setBusy] = useState(false);
  return <div className="screen settings-screen"><button className="back-button" onClick={onBack}>‹ Volver</button><div className="page-title"><p className="eyebrow">Tu cuenta</p><h1>Configuración</h1></div><article className="profile-card"><div className="profile-avatar"><Icon name="user" size={28} /></div><div><strong>{session.user.email}</strong><span>Cuenta autorizada</span></div></article><button className="logout-button" onClick={async () => { setBusy(true); await signOut(); setBusy(false); }} disabled={busy}><Icon name="logout" />{busy ? "Cerrando..." : "Cerrar sesión"}</button></div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState("home");
  const [previousScreen, setPreviousScreen] = useState("home");
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: authData }) => { setSession(authData.session); setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthLoading(false); if (!nextSession) setData(EMPTY_DATA); });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadData() {
    if (!session) return false;
    setLoading(true);
    try {
      setData(await fetchAppData());
      return true;
    } catch (error) {
      notify(error.message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [session]);

  function notify(message, type = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }

  async function mutate(action) {
    await action();
    await loadData();
  }

  async function handleManualRefresh() {
    if (loading) return;
    if (await loadData()) notify("Datos actualizados");
  }

  if (authLoading) return <div className="app-loader"><div className="brand-mark">CC</div><span>Cargando Cookie Compass</span></div>;
  if (!session) return <LoginScreen />;

  let content;
  if (screen === "home") content = <HomeScreen data={data} onAdd={() => setShowAdd(true)} />;
  if (screen === "balance") content = <BalanceScreen data={data} />;
  if (screen === "analytics") content = <AnalyticsScreen data={data} />;
  if (screen === "data") content = <DataScreen data={data} mutate={mutate} notify={notify} />;
  if (screen === "settings") content = <SettingsScreen session={session} onBack={() => setScreen(previousScreen)} />;

  return (
    <div className="app-shell">
      <header className="app-header"><button className="wordmark" onClick={() => setScreen("home")}><span>CC</span><strong>Cookie Compass</strong></button><div className="header-actions"><button className="refresh-button" aria-label={loading ? "Actualizando datos" : "Actualizar datos"} aria-busy={loading} title={loading ? "Actualizando datos" : "Actualizar datos"} onClick={handleManualRefresh} disabled={loading}><Icon name="refresh" /></button><button className="profile-button" aria-label="Configuración del perfil" onClick={() => { setPreviousScreen(screen === "settings" ? "home" : screen); setScreen("settings"); }}><Icon name="user" /></button></div></header>
      {loading && <div className="loading-line" />}
      <main className="app-content">{content}</main>
      {screen !== "settings" && <nav className="bottom-nav" aria-label="Navegación principal">{NAV_ITEMS.slice(0, 2).map(([key, label, icon]) => <button key={key} aria-current={screen === key ? "page" : undefined} className={screen === key ? "active" : ""} onClick={() => setScreen(key)}><Icon name={icon} /><span>{label}</span></button>)}<button className="add-button" onClick={() => setShowAdd(true)} aria-label="Registrar movimiento"><Icon name="plus" size={30} /></button>{NAV_ITEMS.slice(2).map(([key, label, icon]) => <button key={key} aria-current={screen === key ? "page" : undefined} className={screen === key ? "active" : ""} onClick={() => setScreen(key)}><Icon name={icon} /><span>{label}</span></button>)}</nav>}
      {showAdd && <QuickAdd data={data} onClose={() => setShowAdd(false)} mutate={mutate} notify={notify} />}
      {toast && <div className={`toast ${toast.type}`} role="status">{toast.message}</div>}
    </div>
  );
}

export default App;
