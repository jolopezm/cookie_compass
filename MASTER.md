# Cookie Compass — Master Document

> Documento de referencia único para el desarrollo de este proyecto. Cualquier agente
> (Claude Code, Codex, o un humano) debe leer este documento antes de generar código.
> Este documento es la fuente de verdad del dominio, la arquitectura y las reglas de
> negocio. El código debe alinearse a este documento, no al revés. Si el código y este
> documento entran en conflicto, se actualiza este documento primero, luego el código.

**Versión:** 1.0
**Última actualización:** 2026-07-30
**Estado:** Pre-implementación — Fase 0 (Descubrimiento) en curso

---

## 0. Contexto del proyecto

Aplicación web tipo mini-CRM para automatizar un negocio casero familiar de venta de
queques (repostería). Cubre: registro de clientes, toma de pedidos, inventario de
productos terminados y materias primas, contabilización de ventas y cobros, y
producción.

### 0.1 Estado actual del código (antes de este rediseño)

- Frontend: JavaScript vanilla, Web Components, Vite, Pico CSS.
- Backend: ninguno propio. Acceso directo a Supabase (PostgreSQL) desde el navegador.
- **No existe backend Java.** Cualquier referencia previa a Java/Spring Boot en
  conversaciones anteriores no refleja el código real. Confirmado contra
  `package.json` y `README.md` del repositorio.
- Persistencia real: `localStorage` usado como copia completa de las tablas —
  **esto es un anti-patrón y debe eliminarse** (ver sección 8).
- UI organizada alrededor de tablas técnicas (`clientes`, `productos`, `ordenes`,
  `detalle_ordenes`, `vista_ventas`) en lugar de procesos de negocio.
- Creación de pedidos no transaccional: se inserta la orden y luego cada línea por
  separado, sin transacción. Riesgo de pedidos huérfanos o incompletos.
- Sin autenticación real, sin Row Level Security, sin roles.

### 0.2 Qué se conserva del prototipo actual

- Vite como bundler.
- Web Components + Custom Events (bubbling) como patrón de comunicación entre
  componentes — no se necesita un state manager para este tamaño de proyecto.
- Pico CSS + CSS propio.
- Un archivo central de acceso a Supabase (`supabase.js`) — bueno para aislar el
  acoplamiento al proveedor.
- PostgreSQL / Supabase como backend gestionado.
- La tabla genérica (`dataTable.js`) — se conserva pero se restringe su uso a
  catálogos administrativos simples (ver sección 5), no como interfaz principal.

---

## 1. Principio arquitectónico rector

Para este negocio, la arquitectura correcta es: **simple, barata, segura,
mantenible por una sola persona, usable desde teléfono/tablet/PC, y suficientemente
sólida para no perder plata ni inventario por una condición de carrera o un pedido
a medio insertar.**

No se optimiza por currículum ni por moda tecnológica. No se introduce Java/Spring
Boot en esta fase — ver sección 12 para las condiciones bajo las cuales sí tendría
sentido.

```
Frontend web responsive (Vite + Web Components)
        ↓ Supabase SDK / RPC
Supabase Auth + Row Level Security
        ↓
PostgreSQL
        ↓
Funciones transaccionales (PL/pgSQL) para toda operación crítica
```

---

## 2. Fase 0 — Descubrimiento (bloqueante, hacer antes de programar)

Esto no es opcional ni es "documentación después". Es la fase que evita construir
la estructura equivocada. El error más caro de este proyecto sería seguir agregando
pantallas sobre un modelo mal cerrado.

Entregables antes de escribir el esquema definitivo:

1. **Workflow real del negocio** — entrevistar a quien toma los pedidos hoy
   (tu hermano). Observar cómo registra pedidos, cobra, y compra materia prima
   *ahora*, en papel o en la cabeza. No asumir el proceso ideal; documentar el
   proceso real y luego decidir qué automatizar.
2. **Diccionario de estados reales** — qué significa "confirmado", "pagado",
   "cancelado" en la práctica del negocio. Ej: ¿un pedido cancelado después de
   producir se convierte en desperdicio o se puede vender a otro cliente?
3. **Definición de "pagado"** — ¿existe pago parcial en la práctica? ¿Se fía?
   ¿Hay devoluciones?
4. **Catálogo real de productos y variaciones** — tamaños, personalización,
   ingredientes opcionales (ej. "sin azúcar").
5. **Unidades de materia prima** — cómo compra tu hermano insumos (kilos, bolsas,
   unidades) vs. cómo se consumen en receta (gramos).
6. **Roles reales** — ¿solo tu hermano administra, o también alguien más toma
   pedidos? ¿Los clientes van a usar el portal o siempre piden por WhatsApp?
7. **Reparto de trabajo del proyecto** — decisión explícita: ¿quién escribe las
   funciones PL/pgSQL transaccionales y las políticas RLS (la parte que requiere
   más rigor), y quién construye el frontend? No asumir que el sobrino cubre
   ambas capas solo si está aprendiendo.

**No avanzar a Fase 1 (sección 13) sin cerrar esto.** El modelo de datos de este
documento es el punto de partida razonable, pero debe validarse contra las
respuestas reales antes de congelarse.

---

## 3. Modelo de dominio

Diferencia clave: **un editor de tablas organiza registros; una aplicación de
negocio organiza procesos, reglas y estados.** El objetivo es lo segundo.

### 3.1 Flujo de negocio

```
1. Cliente solicita un pedido (o administrador lo ingresa directamente)
2. Administrador revisa y confirma
3. Se calculan cantidades y precios (server-side, nunca confiado al cliente)
4. Se reserva o consume inventario
5. Se registra producción
6. Se registra pago parcial o total
7. Se despacha o entrega
8. El pedido se cierra, cancela o archiva (lógicamente, no físicamente)
9. La operación queda disponible para reportes
```

### 3.2 Estados de pedido (`order_status`)

Estado comercial y estado de pago son **independientes**. No usar un campo
`active = true/false`; el estado explica exactamente qué está ocurriendo.

| Estado | Significado |
|---|---|
| `DRAFT` | Borrador, aún no enviado ni confirmado |
| `REQUESTED` | Cliente lo solicitó (portal, WhatsApp, email); pendiente de revisión |
| `CONFIRMED` | Administrador validó precio, fecha y disponibilidad |
| `IN_PRODUCTION` | En fabricación; consume materia prima |
| `READY` | Producción terminada, pendiente de despacho |
| `DISPATCHED` | Salió para entrega |
| `DELIVERED` | Entregado al cliente |
| `CANCELLED` | Cancelado en cualquier etapa anterior a `DELIVERED` |

### 3.3 Estado de pago (`payment_status`) — independiente del estado comercial

| Estado | Significado |
|---|---|
| `UNPAID` | Sin abonos registrados |
| `PARTIALLY_PAID` | Abono parcial registrado |
| `PAID` | Saldo cubierto en su totalidad |
| `REFUNDED` | Reembolsado, total o parcialmente |

Combinaciones válidas de negocio, por ejemplo:
`DELIVERED + PARTIALLY_PAID` (se fía), `CONFIRMED + PAID` (pagó por adelantado),
`CANCELLED + REFUNDED`.

**Recomendación de implementación:** usar una **tabla catálogo**
(`order_statuses`, `payment_statuses`) con una columna `code` y `sort_order`, no
un `ENUM` nativo de PostgreSQL. Los `ENUM` de Postgres son costosos de modificar
en producción (`ALTER TYPE ... ADD VALUE` no puede ejecutarse dentro de la misma
transacción que lo usa, en versiones anteriores a PG12, y sigue siendo rígido).
Si el negocio evoluciona y aparece un estado nuevo (ej. `ON_HOLD`), una tabla
catálogo se actualiza con un `INSERT`; un `ENUM` requiere una migración de
esquema. Dado que valoramos "future flexibility" y bajo riesgo de migración,
tabla catálogo gana.

### 3.4 Origen del pedido (`order_source`)

`ADMIN`, `CUSTOMER_PORTAL`, `WHATSAPP`, `EMAIL`, `PHONE`.

---

## 4. Modelo de datos (DDL de referencia)

> Este es el modelo mínimo funcional. Las columnas de auditoría (`created_at`,
> `updated_at`, `created_by`) se omiten en algunas tablas por brevedad pero deben
> incluirse en la implementación real.

### 4.1 Seguridad y usuarios

```sql
-- catálogo de roles como tabla, no enum, por la misma razón que order_statuses
create table roles (
    code            text primary key,       -- 'ADMIN', 'OPERATOR', 'CUSTOMER'
    description     text
);

create table profiles (
    id              uuid primary key default gen_random_uuid(),
    auth_user_id    uuid not null unique references auth.users(id) on delete cascade,
    role_code       text not null references roles(code),
    customer_id     uuid references customers(id),  -- null salvo role_code = 'CUSTOMER'
    display_name    text,
    active          boolean not null default true,
    created_at      timestamptz not null default now()
);
```

**Nota de seguridad crítica (RLS recursivo):** las políticas RLS de `orders`,
`customers`, etc. van a necesitar saber el rol del usuario actual. Si esa consulta
se hace vía un `SELECT` directo a `profiles` **dentro** de la política, y
`profiles` también tiene RLS activo, se puede generar recursión de políticas o
bloqueos de rendimiento. La forma correcta es exponer el rol mediante una
función `SECURITY DEFINER` que bypasea RLS internamente:

```sql
create or replace function current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
    select role_code from profiles where auth_user_id = auth.uid();
$$;

create or replace function current_user_customer_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
    select customer_id from profiles where auth_user_id = auth.uid();
$$;
```

Las políticas RLS llaman a estas funciones en lugar de subconsultar `profiles`
directamente. Alternativa igualmente válida: guardar el rol y `customer_id` como
custom claims en el JWT (vía Auth Hooks de Supabase) para evitar el round-trip a
la tabla en cada evaluación de política.

### 4.2 Clientes

```sql
create table customers (
    id                       uuid primary key default gen_random_uuid(),
    name                     text not null,
    phone                    text,
    email                    text,
    address                  text,
    delivery_notes           text,
    preferred_contact_method text,   -- 'WHATSAPP', 'EMAIL', 'PHONE'
    active                   boolean not null default true,
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now()
);
```

No se eliminan físicamente clientes con ventas asociadas; se desactivan con
`active = false`.

### 4.3 Catálogo de productos

```sql
create table products (
    id              uuid primary key default gen_random_uuid(),
    sku             text unique not null,
    name            text not null,
    description     text,
    unit            text not null,               -- 'unidad', 'kg', etc.
    current_price   numeric(12,2) not null check (current_price >= 0),
    active          boolean not null default true,
    made_to_order   boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
```

**Precisión numérica:** siempre `numeric(12,2)` para montos en la moneda local
(o el equivalente según el sistema monetario del negocio), nunca `float` ni
`double precision`. `numeric` sin escala definida permite precisión arbitraria
y puede producir inconsistencias en sumas/comparaciones; fijar `(12,2)`
explícitamente evita ambigüedad.

### 4.4 Materias primas

```sql
create table raw_materials (
    id              uuid primary key default gen_random_uuid(),
    sku             text unique not null,
    name            text not null,
    base_unit       text not null,     -- unidad base consistente, ej. 'gramos'
    minimum_stock   numeric(12,3) not null default 0,
    active          boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
```

Definir una unidad base consistente (ej. todo en gramos) y convertir solo en la
capa de presentación. No mezclar "1 kilo", "500 gramos", "0.25 bolsas" como
valores de la misma columna.

### 4.5 Recetas (Bill of Materials)

```sql
create table recipes (
    id              uuid primary key default gen_random_uuid(),
    product_id      uuid not null references products(id),
    version         int not null default 1,
    yield_quantity  numeric(12,3) not null,
    active          boolean not null default true,
    created_at      timestamptz not null default now()
);

create table recipe_items (
    id                 uuid primary key default gen_random_uuid(),
    recipe_id          uuid not null references recipes(id) on delete cascade,
    raw_material_id    uuid not null references raw_materials(id),
    quantity_required  numeric(12,3) not null,
    waste_percentage   numeric(5,2) not null default 0
);
```

### 4.6 Pedidos

```sql
create table orders (
    id                     uuid primary key default gen_random_uuid(),
    order_number           bigint generated always as identity,
    customer_id            uuid not null references customers(id),
    status                 text not null references order_statuses(code) default 'DRAFT',
    payment_status          text not null references payment_statuses(code) default 'UNPAID',
    source                 text not null default 'ADMIN',
    requested_delivery_at  timestamptz,
    confirmed_at           timestamptz,
    completed_at           timestamptz,
    cancelled_at           timestamptz,
    subtotal               numeric(12,2) not null default 0,
    discount_total         numeric(12,2) not null default 0,
    delivery_fee           numeric(12,2) not null default 0,
    total                  numeric(12,2) not null default 0,
    currency               text not null default 'CLP',
    customer_notes         text,
    internal_notes         text,
    created_by             uuid references profiles(id),
    created_at             timestamptz not null default now(),
    updated_at             timestamptz not null default now()
);

create table order_statuses (
    code        text primary key,
    label       text not null,
    sort_order  int not null
);

create table payment_statuses (
    code        text primary key,
    label       text not null,
    sort_order  int not null
);
```

### 4.7 Líneas de pedido

```sql
create table order_items (
    id                     uuid primary key default gen_random_uuid(),
    order_id               uuid not null references orders(id) on delete cascade,
    product_id             uuid not null references products(id),
    product_name_snapshot  text not null,
    quantity               numeric(12,3) not null check (quantity > 0),
    unit_price             numeric(12,2) not null check (unit_price >= 0),
    discount               numeric(12,2) not null default 0,
    line_total             numeric(12,2) not null,
    notes                  text,
    created_at             timestamptz not null default now()
);
```

`product_name_snapshot` y `unit_price` se congelan al momento de crear la
línea. Si el producto cambia de nombre o precio después, una venta histórica
debe seguir mostrando el nombre y precio que tenía cuando fue realizada. **Nunca
recalcular un pedido histórico contra `products.current_price`.**

### 4.8 Pagos

```sql
create table payments (
    id              uuid primary key default gen_random_uuid(),
    order_id        uuid not null references orders(id),
    amount          numeric(12,2) not null check (amount > 0),
    payment_method  text not null,      -- 'CASH','TRANSFER','CARD','OTHER'
    payment_status  text not null,      -- 'PENDING','CONFIRMED','REJECTED','REFUNDED'
    reference       text,
    paid_at         timestamptz,
    notes           text,
    created_by      uuid references profiles(id),
    created_at      timestamptz not null default now()
);
```

Saldo pendiente = `order.total - sum(payments confirmados)`.

### 4.9 Inventario (por movimientos, no por "stock actual" plano)

```sql
create table inventory_locations (
    id      uuid primary key default gen_random_uuid(),
    code    text unique not null,   -- ej. 'COCINA'
    name    text not null
);

create table inventory_movements (
    id              uuid primary key default gen_random_uuid(),
    material_id     uuid not null references raw_materials(id),
    location_id     uuid not null references inventory_locations(id),
    movement_type   text not null,   -- 'PURCHASE','CONSUMPTION','ADJUSTMENT_IN',
                                     -- 'ADJUSTMENT_OUT','WASTE','RETURN'
    quantity        numeric(12,3) not null,
    reference_type  text,            -- ej. 'ORDER', 'MANUAL'
    reference_id    uuid,
    notes           text,
    created_by      uuid references profiles(id),
    created_at      timestamptz not null default now()
);
```

El stock se **deriva**, no se almacena como verdad única:
`stock = sum(entradas) - sum(salidas)`. Puede mantenerse un campo de caché
(`raw_materials.current_stock_cache`) recalculado por trigger o vista
materializada, pero la fuente de verdad es la bitácora de movimientos.

### 4.10 Historial de estados

```sql
create table order_status_history (
    id          uuid primary key default gen_random_uuid(),
    order_id    uuid not null references orders(id),
    old_status  text,
    new_status  text not null,
    changed_by  uuid references profiles(id),
    reason      text,
    created_at  timestamptz not null default now()
);
```

Permite responder: ¿cuándo fue confirmado?, ¿quién lo canceló?, ¿cuánto tiempo
estuvo en producción?, ¿qué estado tenía antes?

### 4.11 Integraciones (WhatsApp / Email)

```sql
create table inbound_messages (
    id                  uuid primary key default gen_random_uuid(),
    channel             text not null,             -- 'WHATSAPP','EMAIL'
    external_message_id text not null,
    sender              text,
    raw_payload          jsonb,
    message_text         text,
    processing_status    text not null default 'PENDING',
    matched_customer_id  uuid references customers(id),
    matched_order_id     uuid references orders(id),
    received_at          timestamptz not null default now(),
    processed_at         timestamptz,
    error_message         text,

    -- idempotencia: un webhook puede reintentarse por timeout o falla de red.
    -- sin esta restricción, un reintento crea un pedido duplicado.
    constraint uq_inbound_message unique (channel, external_message_id)
);
```

Al insertar, usar `ON CONFLICT (channel, external_message_id) DO NOTHING` (o
`DO UPDATE` si se necesita registrar el reintento) para que un webhook
reenviado no genere una segunda solicitud de pedido.

---

## 5. Datos activos e históricos

**No mover datos a tablas `_archive` cada N meses.** Mover información genera:
claves foráneas más frágiles, reportes que necesitan `UNION`, duplicación de
estructuras, mayor riesgo de pérdida de datos durante la transferencia, y mayor
complejidad de auditoría. Para el volumen esperado de este negocio (probablemente
miles o decenas de miles de registros en varios años), una sola tabla PostgreSQL
no representa un problema de rendimiento.

En su lugar, usar **vistas** o filtros de consulta:

```sql
-- pedidos recientes (vista de trabajo diario)
create view v_orders_recent as
select * from orders where created_at >= current_date - interval '3 months';

-- histórico completo
create view v_orders_all as
select * from orders;
```

La regla de "datos vivos de 3 meses" es una **regla de presentación**, no una
separación física.

---

## 6. Seguridad

### 6.1 Autenticación

Supabase Auth. Roles: `ADMIN`, `OPERATOR`, `CUSTOMER` (tabla `roles`, sección 4.1).

| Rol | Puede |
|---|---|
| `ADMIN` | Leer, crear, actualizar, operar pedidos, registrar pagos, gestionar inventario, administrar usuarios |
| `OPERATOR` | Trabajar con pedidos, actualizar producción, registrar entregas, consultar inventario. **No** administra usuarios, no borra datos, no altera reportes históricos |
| `CUSTOMER` | Leer sus propios pedidos, crear una solicitud, consultar estado, adjuntar comprobante si se habilita |

### 6.2 Row Level Security

Todas las tablas expuestas al cliente vía Supabase deben tener RLS activado.
Ejemplo de política para clientes viendo sus propios pedidos:

```sql
alter table orders enable row level security;

create policy customer_reads_own_orders
    on orders for select
    using (
        current_user_role() = 'CUSTOMER'
        and customer_id = current_user_customer_id()
    );

create policy staff_reads_all_orders
    on orders for select
    using (current_user_role() in ('ADMIN', 'OPERATOR'));

create policy admin_writes_orders
    on orders for insert
    with check (current_user_role() in ('ADMIN', 'OPERATOR'));
```

Ver sección 4.1 para las funciones `current_user_role()` /
`current_user_customer_id()` que evitan la recursión de políticas.

### 6.3 Clave `anon` de Supabase

La clave `anon` visible en el navegador **no es por sí sola un error
arquitectónico** — así está diseñado Supabase. El riesgo real aparece si: no hay
RLS, las políticas son demasiado amplias, alguna tabla permite CRUD público sin
restricción, o se expone accidentalmente la `service_role` key en el frontend
(nunca debe estar ahí). La prioridad no es "ocultar la anon key"; es diseñar
correctamente cada política.

### 6.4 Concurrencia — bloqueo de filas en operaciones críticas

**Gap importante no cubierto en el análisis inicial.** Si dos pedidos se
confirman casi simultáneamente y ambos requieren la misma materia prima
limitada, sin bloqueo explícito ambos pueden pasar la validación de stock antes
de que se descuente, resultando en sobreventa. La función que reserva/consume
inventario debe usar `SELECT ... FOR UPDATE` sobre las filas de
`raw_materials` afectadas dentro de la misma transacción:

```sql
-- dentro de create_order() o confirm_order(), antes de descontar:
select current_stock_cache into v_stock
from raw_materials
where id = v_material_id
for update;   -- bloquea la fila hasta el commit/rollback de esta transacción

if v_stock < v_required_quantity then
    raise exception 'Stock insuficiente para % (disponible: %, requerido: %)',
        v_material_name, v_stock, v_required_quantity;
end if;
```

Esto serializa el acceso a esa fila específica para transacciones concurrentes,
evitando la condición de carrera clásica de "leer-decidir-escribir" sin lock.

---

## 7. Creación transaccional de pedidos

Este es el cambio técnico más urgente sobre el prototipo actual. Actualmente el
código: crea la orden → obtiene el ID → inserta las líneas una por una, sin
transacción. Si falla la segunda o tercera línea, queda un pedido incompleto.

Debe reemplazarse por una única función PL/pgSQL, invocada por RPC desde el
frontend en una sola llamada:

```sql
create or replace function create_order(
    p_customer_id uuid,
    p_requested_delivery_at timestamptz,
    p_items jsonb,          -- [{"product_id": "...", "quantity": 2}, ...]
    p_customer_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_order_id uuid;
    v_item jsonb;
    v_product record;
    v_subtotal numeric(12,2) := 0;
    v_line_total numeric(12,2);
begin
    -- validar cliente
    if not exists (select 1 from customers where id = p_customer_id and active) then
        raise exception 'Cliente % no existe o está inactivo', p_customer_id;
    end if;

    -- crear encabezado en estado DRAFT/REQUESTED
    insert into orders (customer_id, status, payment_status, source,
                         requested_delivery_at, customer_notes)
    values (p_customer_id, 'REQUESTED', 'UNPAID', 'ADMIN',
            p_requested_delivery_at, p_customer_notes)
    returning id into v_order_id;

    -- crear líneas, validando cada producto y congelando precio vigente
    for v_item in select * from jsonb_array_elements(p_items)
    loop
        select id, name, current_price into v_product
        from products
        where id = (v_item->>'product_id')::uuid and active
        for update;   -- evita lectura de precio a mitad de una actualización de catálogo

        if v_product.id is null then
            raise exception 'Producto % no existe o está inactivo', v_item->>'product_id';
        end if;

        v_line_total := v_product.current_price * (v_item->>'quantity')::numeric;

        insert into order_items (order_id, product_id, product_name_snapshot,
                                  quantity, unit_price, line_total)
        values (v_order_id, v_product.id, v_product.name,
                (v_item->>'quantity')::numeric, v_product.current_price, v_line_total);

        v_subtotal := v_subtotal + v_line_total;
    end loop;

    update orders set subtotal = v_subtotal, total = v_subtotal, updated_at = now()
    where id = v_order_id;

    insert into order_status_history (order_id, old_status, new_status, reason)
    values (v_order_id, null, 'REQUESTED', 'Pedido creado');

    return v_order_id;
exception
    when others then
        raise;  -- el ROLLBACK es automático en PL/pgSQL ante cualquier excepción
end;
$$;
```

La UI hace **una sola llamada**:

```javascript
const { data, error } = await supabase.rpc('create_order', {
    p_customer_id: customerId,
    p_requested_delivery_at: deliveryDate,
    p_items: items,
    p_customer_notes: notes
});
```

El total **nunca se confía al frontend**. Se recalcula server-side contra el
precio vigente en `products.current_price` en el momento de la transacción.

---

## 8. Caché y estado local

El prototipo actual usa `localStorage` como copia completa de las tablas de
Supabase. Esto debe eliminarse como fuente de verdad.

```
Supabase (PostgreSQL)  =  fuente de verdad
Memoria de la página    =  estado de sesión / UI
localStorage            =  preferencias no sensibles únicamente
```

`localStorage` puede usarse para: última pestaña abierta, filtros preferidos,
tema visual, borradores no sensibles. **No debe usarse para**: clientes, ventas,
saldos, permisos, inventario oficial, o cualquier dato que otro dispositivo/
usuario necesite ver actualizado. Problemas del enfoque actual: solo guarda
strings, no maneja grandes conjuntos eficientemente, no ofrece transacciones,
un usuario puede modificarlo desde DevTools, puede quedar desactualizado, y no
sincroniza entre dispositivos.

Offline real (PWA + IndexedDB + cola de sincronización + resolución de
conflictos) queda fuera del alcance del MVP; se evalúa después de estabilizar
el flujo principal.

---

## 9. Inventario — reglas de negocio

No agregar la capa de productos terminados (fabricado / reservado / entregado /
descartado) hasta que el flujo básico de pedidos y pagos funcione
correctamente. Fase 2, no Fase 1.

La receta (`recipes` + `recipe_items`) permite responder: cuánto material
requiere un pedido, qué ingredientes faltan, cuánto puede producirse con el
stock actual, cuánto se consumió, y qué desperdicio hubo.

---

## 10. WhatsApp y correo electrónico

Fase posterior al MVP. No comenzar con un chatbot de IA de entrada; un flujo
estructurado es más confiable para un negocio pequeño y evita ambigüedad.

```
WhatsApp/Email → Webhook → Supabase Edge Function → inbound_messages
    → parser por reglas (o IA en fase futura) → pedido en estado REQUESTED
    → confirmación administrativa obligatoria
```

**Regla no negociable:** ninguna integración externa (WhatsApp, email, IA)
puede crear un pedido en estado `CONFIRMED` directamente. Siempre entra como
`REQUESTED` y requiere revisión humana antes de pasar a `CONFIRMED`, porque
pueden existir: fechas imposibles, falta de materia prima, cantidades
ambiguas, productos personalizados, dirección fuera del área de reparto, o
necesidad de precio especial.

Si más adelante se usa un LLM para interpretar mensajes en lenguaje natural
("dos queques de chocolate para el viernes"), su salida es una **propuesta
estructurada** (JSON) que pasa por las mismas validaciones que cualquier otro
canal — nunca debe modificar inventario, pagos o precios directamente. Esto es
consistente con el principio de "razonar con IA, ejecutar con software,
validar con tests".

---

## 11. Reportes iniciales

No se necesita un sistema de BI. PostgreSQL puede producir los primeros
reportes mediante vistas: ventas por período, ventas por producto, pedidos por
estado, producción requerida, inventario (stock actual vs. mínimo vs.
proyectado), historial de cliente. Formato inicial: cards, tablas, CSV
descargable, impresión a PDF del navegador. Nada de Tableau/Power BI para este
volumen.

---

## 12. Cuándo sí introducir un backend Java/Spring Boot

No en este momento. Agregar Spring Boot ahora implica mantener: servidor Java,
hosting adicional, configuración de conexiones, API propia, autenticación
duplicada, despliegues, logging, variables secretas, y probablemente otro
costo mensual — sin necesidad de negocio que lo justifique todavía.

Reconsiderar cuando:

- El objetivo académico explícito pase a ser que tu sobrino aprenda Java backend
  empresarial (esto es una decisión de aprendizaje, no solo técnica).
- Las reglas de negocio se vuelvan mucho más complejas que lo descrito acá.
- Crezcan mucho las integraciones externas.
- Se necesite procesamiento pesado en background que Edge Functions no cubran
  bien.
- Se necesite independencia total de la API autogenerada de Supabase.
- El negocio escale a un volumen que justifique una capa de servicio propia.

Si se introduce, el patrón sería `Frontend → Spring Boot → PostgreSQL (el mismo
Supabase Postgres o uno propio)`, y Spring Boot asumiría las reglas que hoy
viven en funciones PL/pgSQL — no ambas cosas duplicadas.

---

## 13. Roadmap

### Fase 0 — Descubrimiento (ver sección 2, bloqueante)

### Fase 1 — MVP operacional

- Autenticación (Supabase Auth) y roles (`ADMIN`, `OPERATOR`, `CUSTOMER`).
- RLS activado en todas las tablas expuestas, usando las funciones
  `current_user_role()` / `current_user_customer_id()`.
- Clientes, productos, pedidos, líneas de pedido.
- Estados de pedido y de pago (tablas catálogo, sección 3.3).
- `create_order()` transaccional con locking de stock/precio (sección 7).
- Pagos y cálculo de saldo.
- Dashboard básico: pedidos de hoy, pendientes, ventas del mes, saldo por cobrar.
- Migraciones versionadas desde el día 1 (Supabase CLI `migrations/`), nunca
  cambios de esquema aplicados a mano contra producción.

### Fase 2 — Producción e inventario

- Materias primas, recetas, movimientos de inventario con `FOR UPDATE`.
- Historial de estados (`order_status_history`).
- Reportes simples (vistas SQL + export CSV).
- Portal del cliente (lectura de pedidos propios vía RLS).

### Fase 3 — Integraciones

- PWA / offline básico.
- Webhook de WhatsApp con idempotencia (`inbound_messages`, constraint único).
- Webhook de Email.
- Notificaciones.
- Interpretación de mensajes con IA (con validación humana obligatoria).

---

## 14. Checklist de arranque para Codex/Claude Code

Antes de generar código para cualquier módulo, confirmar:

- [ ] ¿Existe una función PL/pgSQL transaccional para esta operación, o se está
      por hacer múltiples inserts sueltos desde el frontend? Si es lo segundo,
      detenerse y proponer la función RPC primero.
- [ ] ¿La tabla involucrada tiene RLS activado y una política que cubra el rol
      que va a usar esta pantalla?
- [ ] ¿Algún monto se está calculando en JavaScript en lugar de recibirse ya
      calculado desde la base de datos?
- [ ] ¿Se está guardando algo sensible (saldos, permisos, inventario oficial)
      en `localStorage`?
- [ ] ¿Esta migración de esquema está versionada en `migrations/`, o se está
      aplicando directamente contra la base?
- [ ] ¿Una operación sobre stock limitado necesita `SELECT ... FOR UPDATE`?
- [ ] ¿Un webhook nuevo tiene una restricción de idempotencia (`UNIQUE` sobre
      el identificador externo del mensaje)?

---

## 15. Decisión tecnológica final

```
Frontend:              Vite + Web Components + JavaScript/TypeScript + Pico CSS
Backend:               Supabase
Base de datos:         PostgreSQL
Autenticación:         Supabase Auth
Autorización:          Row Level Security + funciones security definer
Operaciones críticas:  Funciones PL/pgSQL (RPC), con locking explícito
Integraciones:         Supabase Edge Functions
Hosting frontend:      Cloudflare Pages / Netlify / Vercel (estático)
Migraciones:           Supabase CLI, versionadas en el repositorio
Java/Spring Boot:      No en esta fase — ver sección 12
```

---

## 16. Fuentes de este documento

Este documento consolida: el análisis de arquitectura realizado en ChatGPT sobre
el código fuente real del prototipo (README, package.json, supabase.js,
ordenes.js, dataTable.js, main.js, formularioOrden.js), más una revisión
técnica adicional que identificó y corrigió los siguientes puntos no cubiertos
en el análisis original: bloqueo de filas para evitar condiciones de carrera en
inventario y precios (sección 6.4), resolución de RLS recursivo mediante
funciones `security definer` (sección 4.1), idempotencia de webhooks mediante
restricción única (sección 4.11), uso de tabla catálogo en lugar de `ENUM` para
estados (sección 3.3), precisión numérica explícita `numeric(12,2)` (sección
4.3), y control de versiones de esquema vía migraciones (secciones 12 y 14).
