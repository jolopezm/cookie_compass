# Cookie Compass — Master Document

> Documento de referencia único para el desarrollo de este proyecto. Cualquier agente
> (Claude Code, Codex, o un humano) debe leer este documento antes de generar código.
> Este documento es la fuente de verdad del dominio, la arquitectura y las reglas de
> negocio. El código debe alinearse a este documento, no al revés. Si el código y este
> documento entran en conflicto, se actualiza este documento primero, luego el código.

**Versión:** 1.8
**Última actualización:** 2026-07-30
**Estado:** Fase 0 cerrada. Diseño de Cortes 1 y 2 consolidado. Sin
decisiones bloqueantes para el Corte 0. El Corte 0 tiene un GO preparado y en
espera — ver `GO_CORTE_0.md` — pendiente de autorización explícita de Ed o
José. No se ha implementado ningún código de ningún corte.

## Documentos subordinados

| Documento | Propósito |
|---|---|
| `DISCOVERY NOTES README.md` | Encuesta de descubrimiento original + anotaciones de resolución. |
| `README.md` | Documentación pública del repositorio. No contiene decisiones de dominio. |
| `GO_CORTE_0.md` | GO completo de implementación del Corte 0, validado contra v1.8 y en espera de autorización. |
| `ARQUITECTURA_DEPLOYMENT.md` | Diagrama y explicación de arquitectura, seguridad y deployment. |
| `SOP_USUARIO.md` | Procedimiento operativo estándar para usuarios de la aplicación. |
| `Archive-Ignore/` | Documentos históricos o redundantes; no son fuente de verdad ni instrucciones activas. |

---

## 0. Registro de cambios

### v1.7 → v1.8 (2026-07-30, recursos centralizados)

Solo documentación. Se confirma que `"USER_STAMP"`, `"PROCESS_STAMP"` y
`"DATE_TIME_STAMP"` conservan exactamente esos nombres en inglés y nunca se
traducen. Se agrega `"RESOURCE_FILE_BASE"` como tabla técnica en inglés para
centralizar códigos y textos de excepciones, validaciones y mensajes. Los
RPC/SP emiten códigos breves (`RFB_*`) y no contienen textos extensos.

### v1.6 → v1.7 (2026-07-30, stamps universales de escritura)

Solo documentación. Todas las tablas PostgreSQL, sin excepción, incluyen
`"USER_STAMP"`, `"PROCESS_STAMP"` y `"DATE_TIME_STAMP"`. Toda función/RPC que
inserte o actualice identifica al usuario o identidad de sistema, declara el
proceso estable que ejecuta y registra la hora efectiva de escritura mediante
`clock_timestamp()`. El mecanismo queda incorporado en convenciones DDL,
seguridad, invariantes, Corte 0 y observabilidad.

### v1.5 → v1.6 (2026-07-30, cierre arquitectónico y limpieza documental)

Solo documentación. No se implementó código ni se aplicaron cambios a
Supabase.

1. Se copia íntegramente a la sección 17.1 el protocolo de concurrencia:
   orden global de locks, recálculo post-lock, rollback y pruebas reales. El
   documento vigente ya no remite a v1.4.1 para una regla crítica.
2. Se corrige la afirmación sobre índices: PostgreSQL crea índices para
   primary keys y restricciones `UNIQUE`, no automáticamente para foreign
   keys. Las FK se indexan explícitamente según sus consultas y operaciones.
3. Se valida `GO_CORTE_0.md` contra esta versión.
4. La coherencia de tipo de SKU pasa a ser declarativa mediante claves
   compuestas `(ID, TIPO_SKU)` y valores de tipo restringidos.
5. Se agrega `"PRODUCCIONES"` como cabecera estable que agrupa cada ejecución
   y `"DETALLE_CONSUMO_PRODUCCION"` como sus consumos de insumo.
6. Se cierra el reconocimiento de advertencias: se persisten por línea en
   `"ADVERTENCIAS_PEDIDO"` y un ADMIN las reconoce individualmente mediante
   RPC. `confirmar_pedido` consulta la base y no confía en un booleano del
   frontend.
7. Se archivan guías redundantes y se agregan los documentos activos
   `ARQUITECTURA_DEPLOYMENT.md` y `SOP_USUARIO.md`.

### v1.4.1 → v1.5 (2026-07-30, consolidación de Cortes 1 y 2)

Solo documentación — no se implementó código de ningún corte. Cierra todas
las decisiones pendientes que quedaban de v1.4.1.

**Corte 1 (inventario de insumos):**
1. `"V_DISPONIBILIDAD_INSUMO"` tenía el mismo tipo de bug que se corrigió en
   `"V_SALDO_PEDIDO"` en v1.4: al partir de `"INVENTARIO_MASTER"` en vez de
   `"REGISTRO_SKU"`, si alguna vez existiera más de una fila física para el
   mismo insumo, la reserva total se restaría a *cada* fila por separado en
   vez de una sola vez sobre el agregado. Se corrige agregando existencia y
   reserva en CTE independientes, partiendo de `"REGISTRO_SKU"` (sección
   3.5).
2. Se agrega la restricción que faltaba: como máximo una fila activa de
   `"INVENTARIO_MASTER"` por SKU de tipo `INSUMO` (índice único parcial),
   con el mecanismo de locking exacto para decidir `INSERT` vs. `UPDATE`
   sin depender de una lectura previa del frontend (sección 3.5).
3. `ajustar_inventario` se formaliza con dos modos explícitos
   (`FIJAR_CANTIDAD` / `APLICAR_DIFERENCIA`) en vez de una intención
   ambigua (sección 7).
4. Se formalizan como invariantes explícitas la prohibición de stock
   negativo y de disponibilidad negativa (sección 5).
5. Se formaliza la conversión de unidad de compra a unidad base, con
   política de redondeo explícita (sección 3.2).

**Corte 2 (catálogo, variantes y personalización):**
1. `"INVENTARIO_MASTER"."PEDIDO_ID"` queda **cerrado como eliminado
   permanentemente** — ya no aparece en decisiones pendientes.
2. **Se cierra la decisión de no versionar recetas** para el MVP, y se agrega
   `"DETALLE_CONSUMO_PRODUCCION"` para que el consumo real de producción sea
   reconstruible sin necesidad de versionar la receta de catálogo (sección
   3.6).
3–4. **`"PRODUCTO_PADRE_ID"` se elimina** y se reemplaza por dos tablas
   separadas: `"PRODUCTOS"` (agrupador conceptual, nunca se vende) y
   `"REGISTRO_SKU"` (variante vendible o insumo, con `PRODUCTO_ID`
   obligatorio para todo `PRODUCTO_FINAL`). Con esta separación, el límite de
   un solo nivel de jerarquía deja de necesitar un trigger que recorra
   filas — es imposible por construcción, porque `"PRODUCTOS"` no tiene
   ninguna columna que la haga referenciar a sí misma (sección 3.2). Se
   elimina `RECETA_TIPO` de `"REGISTRO_SKU"` (ver contradicción detectada,
   más abajo).
5. Se formalizan tres caminos para personalización excepcional: variante
   permanente (`"REGISTRO_SKU"`), nota sin impacto productivo
   (`"PEDIDO_DETALLE"."NOTAS"` + `"PEDIDO_DETALLE_PERSONALIZACION"`), y
   receta snapshot con impacto productivo (`"RECETA_PERSONALIZADA_PEDIDO"`,
   nueva) (sección 3.7).
6. Se agregan catálogos comerciales configurables:
   `"TIPOS_PERSONALIZACION"`, `"OPCIONES_PERSONALIZACION"`, `"ALERGENOS"`,
   `"TIPOS_ADVERTENCIA"`, `"UNIDADES_MEDIDA"` — explícitamente distintos de
   los catálogos técnicos que sí siguen fijos por código (sección 3.8).
7. Se formaliza el tratamiento de alérgenos/advertencias sobre esos
   catálogos, incluyendo el requisito de confirmación administrativa antes
   de confirmar un pedido con advertencia activa (sección 3.8, 7).
8. Se formaliza (reafirmando invariantes ya existentes) que editar una
   receta de catálogo nunca afecta pedidos ya confirmados.

**Contradicción detectada y corregida durante esta revisión (no estaba en
la lista del prompt, se reporta explícitamente):** `"REGISTRO_SKU"."RECETA_TIPO"`
(`ESTANDAR`/`CUSTOMIZADA`, v1.3–v1.4) quedaba en conflicto con el nuevo
modelo de tres caminos — nunca determinaba comportamiento distinto en
ningún RPC, y con `"RECETA_PERSONALIZADA_PEDIDO"` cubriendo la
personalización puntual con impacto productivo, mantenerlo habría dejado dos
mecanismos compitiendo por la misma idea. Se elimina esa columna.

**Riesgo de concurrencia (sección 17.1):** reafirmado como protocolo
obligatorio del Corte 3b, sin cambios de fondo respecto a v1.4.1 — se agrega
precisión sobre política de reintento (solo para errores de serialización
transitorios, nunca para `STOCK_INSUFICIENTE`, que es un resultado de
negocio válido, no un error técnico).

### v1.0 → v1.4.1 (resumen; detalle histórico en versiones anteriores de este archivo)

v1.1–v1.2 movieron inventario a Fase 1 y redujeron a 2 roles. v1.3 unificó
insumo/producto final en `"REGISTRO_SKU"`. v1.4 corrigió 7 defectos
estructurales (dependencia del Corte 0, duplicación en `"V_SALDO_PEDIDO"`,
inmutabilidad de pagos, trazabilidad de reserva por línea, doble fuente de
verdad de inventario/pedido, contador cacheado de reserva, agrupación de
variantes). v1.4.1 documentó el protocolo completo de concurrencia del
Corte 3b.

---

## 1. Contexto del proyecto

Sin cambios: mini-CRM para un negocio casero de repostería. Clientes,
catálogo de productos conceptuales con variantes vendibles e insumos con
receta explícita, pedidos, producción, entregas parciales, pagos y
conciliación.

### 1.1 Personas del negocio

| Persona | Rol técnico | Autoridad operativa real |
|---|---|---|
| José Lopez | `ADMIN` | Confirma pagos, negocia precio, autoriza reembolsos, registra compras/ajustes |
| Edbel Lopez | `ADMIN` | Confirma pagos, negocia precio, autoriza reembolsos, registra compras/ajustes |
| Ed Lopez | `ADMIN` | Registra compras/ajustes; rol técnico completo |

Sin cambios respecto a versiones anteriores.

---

## 2. Principio arquitectónico rector

```

### 2.1 Excepciones de nomenclatura en inglés

La convención general continúa siendo tablas y columnas en español,
mayúsculas y citadas. Las únicas excepciones aprobadas son:

1. Las columnas universales `"USER_STAMP"`, `"PROCESS_STAMP"` y
   `"DATE_TIME_STAMP"`.
2. La tabla técnica `"RESOURCE_FILE_BASE"` y sus columnas, por decisión
   explícita de diseño.

No se introducen otros nombres ingleses sin actualizar primero este
documento.

### 2.2 Catálogo central de recursos

Toda excepción, validación o mensaje reutilizable vive en
`"RESOURCE_FILE_BASE"`. El código de recurso es estable; el texto puede
corregirse sin reescribir funciones.

```sql
create table "RESOURCE_FILE_BASE" (
    "OBJECT_ID"       bigint generated always as identity primary key,
    "RESOURCE_CODE"   text not null unique,
    "RESOURCE_TYPE"   text not null
                      check ("RESOURCE_TYPE" in ('EXCEPTION','VALIDATION','MESSAGE')),
    "MESSAGE_TEXT"    text not null,
    "HTTP_STATUS"     int,
    "ACTIVE"          boolean not null default true,
    "USER_STAMP"      text not null,
    "PROCESS_STAMP"   text not null,
    "DATE_TIME_STAMP" timestamptz not null
);
```

Reglas:

- `"OBJECT_ID"` es la PK técnica única, generada con identity.
- `"RESOURCE_CODE"` es el identificador lógico único, por ejemplo
  `RFB_ERROR1`, `RFB_VALIDATION1` o `RFB_MESSAGE1`.
- Un código nunca se reutiliza para otro significado.
- Si deja de usarse, se desactiva; no se elimina si aparece en historial,
  logs, tests o integraciones.
- `"MESSAGE_TEXT"` contiene el texto completo destinado a log o UI.
- `"HTTP_STATUS"` es opcional y ayuda a traducir errores RPC a respuestas
  externas; no reemplaza el código de dominio.
- Las tres columnas stamp aplican igual que en cualquier tabla.
- Solo ADMIN mediante RPC autorizado puede administrar recursos después del
  seed inicial.
- Los códigos técnicos mínimos se crean mediante seed versionado.

Patrón de uso:

```sql
-- Forma mínima aprobada dentro de un RPC/SP:
raise exception 'RFB_ERROR1';
```

El frontend o capa de presentación recibe `RFB_ERROR1`, busca el recurso
activo y muestra `"MESSAGE_TEXT"`. Para procesos server-side que necesiten el
texto completo en el error, se permite un helper común:

```sql
perform raise_resource('RFB_ERROR1');
```

`raise_resource` verifica que el código exista y esté activo y levanta como
mensaje de excepción el propio `RESOURCE_CODE`, no el texto largo. Si el
código no existe o está inactivo, emite `RFB_RESOURCE_NOT_FOUND`. El helper
nunca acepta SQL dinámico ni nombres de objetos desde el usuario.

Los RPC devuelven o levantan **códigos**, no textos como contrato estable.
Tests, UI e integraciones comparan `RESOURCE_CODE`, nunca `MESSAGE_TEXT`.
Frontend web responsive (Vite + Web Components + TypeScript)
        ↓ Supabase SDK / RPC (funciones en snake_case, sin comillas)
Supabase Auth (ADMIN: correo+contraseña · CLIENTE: correo+OTP)
        ↓
Row Level Security (2 roles: ADMIN, CLIENTE)
        ↓
PostgreSQL — tablas y columnas en español, MAYÚSCULA, identificadores citados
        ↓
Funciones transaccionales (PL/pgSQL) para toda operación crítica
```

**Principio nuevo en esta versión, aplicable a todo el modelo:** las
opciones *comerciales* del negocio (sabores, tamaños, decoraciones,
empaques, preferencias, alérgenos, clasificaciones de personalización) se
administran desde catálogos configurables por `ADMIN` (sección 3.8), nunca
como listas fijas en el código de la aplicación. Esto es distinto de los
catálogos *técnicos* que impulsan la máquina de estados y las invariantes
transaccionales (`"ESTADOS_PEDIDO"`, `"ESTADOS_PAGO"`, `"TIPOS_TRANSACCION"`,
`"ESTADOS_INVENTARIO_PRODUCTO"`) — esos sí permanecen acotados por código,
porque cambiarlos implica cambiar comportamiento del sistema (una fila nueva
en `"ESTADOS_PEDIDO"` no significa nada si ningún RPC sabe qué hacer con
ella), mientras que agregar una opción comercial nueva ("relleno de manjar")
no debería requerir ningún cambio de código.

---

## 3. Modelo de dominio

### 3.1 Seguridad y usuarios

Sin cambios respecto a v1.4.

```sql
create table "ROLES" (
    "CODIGO"          text primary key,
    "DESCRIPCION"     text
);

create table "CLIENTES" (
    "ID"                  uuid primary key default gen_random_uuid(),
    "NOMBRE"              text not null,
    "TELEFONO"            text,
    "CORREO"              text,
    "DIRECCION"           text,
    "NOTAS_ENTREGA"       text,
    "CANAL_PREFERIDO"     text,
    "CLIENTE_CONFIANZA"   boolean not null default false,
    "ACTIVO"              boolean not null default true,
    "CREADO_EN"           timestamptz not null default now(),
    "ACTUALIZADO_EN"      timestamptz not null default now()
);

create table "USUARIOS" (
    "ID"              uuid primary key default gen_random_uuid(),
    "AUTH_USER_ID"    uuid not null unique references auth.users(id) on delete cascade,
    "ROL_CODIGO"      text not null references "ROLES"("CODIGO"),
    "CLIENTE_ID"      uuid references "CLIENTES"("ID"),
    "NOMBRE"          text,
    "ACTIVO"          boolean not null default true,
    "CREADO_EN"       timestamptz not null default now(),

    constraint "CHK_ROL_CLIENTE_COHERENTE" check (
        ("ROL_CODIGO" = 'CLIENTE' and "CLIENTE_ID" is not null)
        or
        ("ROL_CODIGO" = 'ADMIN' and "CLIENTE_ID" is null)
    )
);

create or replace function rol_usuario_actual()
returns text
language sql security definer stable
set search_path = public
as $$ select "ROL_CODIGO" from "USUARIOS" where "AUTH_USER_ID" = auth.uid(); $$;

create or replace function cliente_id_usuario_actual()
returns uuid
language sql security definer stable
set search_path = public
as $$ select "CLIENTE_ID" from "USUARIOS" where "AUTH_USER_ID" = auth.uid(); $$;
```

### 3.2 Productos conceptuales, variantes vendibles e insumos

**Cambio de fondo de esta versión:** se reemplaza `"PRODUCTO_PADRE_ID"`
(auto-referencia dentro de `"REGISTRO_SKU"`, v1.4) por dos tablas separadas.

```sql
-- agrupador puramente conceptual. No se vende directamente, no tiene
-- receta, no tiene precio comercial, no participa directamente en pedidos.
create table "PRODUCTOS" (
    "ID"              uuid primary key default gen_random_uuid(),
    "NOMBRE"          text not null,
    "DESCRIPCION"     text,
    "ACTIVO"          boolean not null default true,
    "CREADO_EN"       timestamptz not null default now(),
    "ACTUALIZADO_EN"  timestamptz not null default now()
);

create table "REGISTRO_SKU" (
    "ID"                    uuid primary key default gen_random_uuid(),
    "TIPO_SKU"              text not null check ("TIPO_SKU" in ('INSUMO','PRODUCTO_FINAL')),
    "PRODUCTO_ID"           uuid references "PRODUCTOS"("ID"),   -- obligatorio si PRODUCTO_FINAL, null si INSUMO
    "SKU"                   text unique not null,   -- lo escribe el ADMIN, nunca generado por el sistema
    "NOMBRE"                text not null,
    "DESCRIPCION"           text,
    "PRECIO"                numeric(12,0) not null default 0 check ("PRECIO" >= 0),

    -- columnas exclusivas de INSUMO
    "UNIDAD_BASE"           text references "UNIDADES_MEDIDA"("CODIGO"),
    "UNIDAD_COMPRA"         text references "UNIDADES_MEDIDA"("CODIGO"),
    "FACTOR_CONVERSION"     numeric(12,4) check ("FACTOR_CONVERSION" is null or "FACTOR_CONVERSION" > 0),
    "STOCK_MINIMO"          numeric(12,3) check ("STOCK_MINIMO" is null or "STOCK_MINIMO" >= 0),

    "ACTIVO"                boolean not null default true,
    "CREADO_EN"             timestamptz not null default now(),
    "ACTUALIZADO_EN"        timestamptz not null default now(),

    constraint "UQ_REGISTRO_SKU_ID_TIPO" unique ("ID", "TIPO_SKU"),

    constraint "CHK_COLUMNAS_POR_TIPO" check (
        ("TIPO_SKU" = 'INSUMO' and "UNIDAD_BASE" is not null and "UNIDAD_COMPRA" is not null
            and "FACTOR_CONVERSION" is not null and "PRODUCTO_ID" is null)
        or
        ("TIPO_SKU" = 'PRODUCTO_FINAL' and "PRODUCTO_ID" is not null
            and "UNIDAD_BASE" is null and "UNIDAD_COMPRA" is null and "FACTOR_CONVERSION" is null)
    )
);
```

**`"RECETA_TIPO"` (`ESTANDAR`/`CUSTOMIZADA`) de v1.3/v1.4 se elimina** — ver
contradicción reportada en la sección 0. Ninguna variante de catálogo
necesita distinguirse por ese campo; la personalización puntual con impacto
productivo ahora vive exclusivamente en `"RECETA_PERSONALIZADA_PEDIDO"`
(sección 3.7), nunca como una fila permanente marcada "customizada" en el
catálogo.

**Por qué la separación en dos tablas elimina la necesidad del trigger de
v1.4** (`fn_validar_producto_padre`): con `"PRODUCTO_PADRE_ID"`, prevenir
auto-referencia, ciclos y más de un nivel exigía código que recorriera
filas. Con `"PRODUCTOS"`/`"REGISTRO_SKU"` como tablas distintas, cada uno de
esos casos queda resuelto por la forma del esquema, no por una validación en
tiempo de ejecución:

| Caso que había que prevenir en v1.4 | Por qué ya no puede ocurrir |
|---|---|
| Autorreferencia | `"REGISTRO_SKU"."PRODUCTO_ID"` apunta a `"PRODUCTOS"`, una tabla distinta — no existe una columna que permita que una fila se referencie a sí misma |
| Padre que no sea un producto conceptual válido | Sigue siendo relevante — la `FK` garantiza que exista, pero no que esté `ACTIVO`; se valida con trigger (abajo) |
| Elegir como padre una fila que ya es variante | Imposible por tipo: el valor de `"PRODUCTO_ID"` solo puede ser un `"PRODUCTOS"."ID"`, nunca un `"REGISTRO_SKU"."ID"` |
| Convertir en variante una fila que ya tiene variantes | No existe operación que convierta una fila de una tabla en fila de la otra — son identidades permanentemente distintas |
| Ciclos por `INSERT`/`UPDATE` | Imposible: `"PRODUCTOS"` no tiene ninguna columna que la haga apuntar a sí misma |
| Más de un nivel de jerarquía | Imposible: `"PRODUCTOS"` no tiene un `"PRODUCTO_ID"` propio — el esquema solo puede expresar un nivel |

El único caso que sigue exigiendo validación activa es "el padre debe estar
`ACTIVO`" — sigue dependiendo de otra fila, así que sigue siendo un trigger,
no un `CHECK`:

```sql
create or replace function fn_validar_producto_activo()
returns trigger
language plpgsql
as $$
declare v_activo boolean;
begin
    if new."PRODUCTO_ID" is null then
        return new;
    end if;
    select "ACTIVO" into v_activo from "PRODUCTOS" where "ID" = new."PRODUCTO_ID";
    if v_activo is distinct from true then
        raise exception 'PRODUCTO_ID debe referenciar un producto conceptual activo';
    end if;
    return new;
end;
$$;

create trigger "TRG_VALIDAR_PRODUCTO_ACTIVO"
before insert or update of "PRODUCTO_ID" on "REGISTRO_SKU"
for each row execute function fn_validar_producto_activo();
```

**Pruebas mínimas para esta sección:** insertar un `INSUMO` con
`PRODUCTO_ID` no nulo falla (`CHK_COLUMNAS_POR_TIPO`); insertar un
`PRODUCTO_FINAL` sin `PRODUCTO_ID` falla; asignar como `PRODUCTO_ID` un
`"PRODUCTOS"` inactivo falla (`TRG_VALIDAR_PRODUCTO_ACTIVO`); asignar como
`PRODUCTO_ID` un `"REGISTRO_SKU"."ID"` falla por tipo de dato/`FK` antes de
llegar a cualquier lógica de negocio.

**Receta de catálogo**, sin cambios de fondo:

```sql
create table "REGISTRO_SKU_RECETA" (
    "ID"                    uuid primary key default gen_random_uuid(),
    "PRODUCTO_FINAL_ID"     uuid not null,
    "PRODUCTO_FINAL_TIPO"   text not null default 'PRODUCTO_FINAL'
                            check ("PRODUCTO_FINAL_TIPO" = 'PRODUCTO_FINAL'),
    "INSUMO_ID"             uuid not null,
    "INSUMO_TIPO"           text not null default 'INSUMO'
                            check ("INSUMO_TIPO" = 'INSUMO'),
    "CANTIDAD_REQUERIDA"    numeric(12,3) not null check ("CANTIDAD_REQUERIDA" > 0),
    "MERMA_PORCENTAJE"      numeric(5,2) not null default 0
                            check ("MERMA_PORCENTAJE" >= 0 and "MERMA_PORCENTAJE" <= 100),

    constraint "FK_RECETA_PRODUCTO_FINAL" foreign key
        ("PRODUCTO_FINAL_ID", "PRODUCTO_FINAL_TIPO")
        references "REGISTRO_SKU"("ID", "TIPO_SKU"),
    constraint "FK_RECETA_INSUMO" foreign key
        ("INSUMO_ID", "INSUMO_TIPO")
        references "REGISTRO_SKU"("ID", "TIPO_SKU"),
    constraint "UQ_RECETA_INSUMO" unique ("PRODUCTO_FINAL_ID", "INSUMO_ID")
);
```

**Conversión de unidad de compra a unidad base (formalizada en esta
versión):**

```
CANTIDAD_BASE = CANTIDAD_COMPRA × FACTOR_CONVERSION
-- ejemplo: 2 kg × 1000 = 2000 g
```

- `UNIDAD_COMPRA`, `UNIDAD_BASE` y `FACTOR_CONVERSION` pertenecen siempre al
  `REGISTRO_SKU` del insumo, nunca se envían recalculados desde el frontend.
- El RPC (`registrar_compra_insumo`) obtiene `FACTOR_CONVERSION` leyéndolo
  de la base dentro de la misma transacción — la UI envía la cantidad **en
  unidad de compra**, nunca la cantidad base ya calculada.
- **Redondeo:** el resultado de la multiplicación se redondea a 3 decimales
  (la escala de `numeric(12,3)` usada para cantidades) con redondeo estándar
  (`round()`, mitad hacia arriba) — nunca truncamiento. Para las cantidades y
  factores que maneja este negocio (gramos/kilos, mililitros/litros), el
  error de redondeo introducido es despreciable frente al volumen real de
  producción.
- La auditoría de cada compra conserva `CANTIDAD_COMPRA`, `UNIDAD_COMPRA`,
  `FACTOR_CONVERSION` utilizado y `CANTIDAD_BASE` resultante — no solo el
  resultado final (sección 3.6).

### 3.3 Catálogo de estados de inventario de producto final

Sin cambios respecto a v1.4:

```sql
create table "ESTADOS_INVENTARIO_PRODUCTO" (
    "CODIGO"      text primary key,   -- EN_PROCESO, PROCESADO, ENTREGADO, DESPERDICIO, DONACION
    "ETIQUETA"    text not null
);
```

### 3.4 Inventario (cantidades, no identidad)

Sin cambios de fondo respecto a v1.4:

```sql
create table "INVENTARIO_MASTER" (
    "ID"                    uuid primary key default gen_random_uuid(),
    "TIPO_SKU"              text not null check ("TIPO_SKU" in ('INSUMO','PRODUCTO_FINAL')),
    "REGISTRO_SKU_ID"       uuid not null,
    "CANTIDAD_FISICA"       numeric(12,3) not null check ("CANTIDAD_FISICA" > 0),
    "ESTADO"                text references "ESTADOS_INVENTARIO_PRODUCTO"("CODIGO"),
    "CREADO_EN"             timestamptz not null default now(),
    "ACTUALIZADO_EN"        timestamptz not null default now(),

    constraint "UQ_INVENTARIO_ID_TIPO" unique ("ID", "TIPO_SKU"),
    constraint "FK_INVENTARIO_SKU_TIPO" foreign key
        ("REGISTRO_SKU_ID", "TIPO_SKU")
        references "REGISTRO_SKU"("ID", "TIPO_SKU"),
    constraint "CHK_ESTADO_POR_TIPO" check (
        ("TIPO_SKU" = 'PRODUCTO_FINAL' and "ESTADO" is not null)
        or
        ("TIPO_SKU" = 'INSUMO' and "ESTADO" is null)
    )
);
```

**Nuevo en esta versión — como máximo una fila activa de INSUMO por SKU:**

```sql
create unique index "UQ_INVENTARIO_INSUMO_UNICO"
    on "INVENTARIO_MASTER" ("REGISTRO_SKU_ID")
    where "TIPO_SKU" = 'INSUMO';
```

Un índice único parcial — se aplica solo a filas `INSUMO`, así que
`PRODUCTO_FINAL` sigue pudiendo tener múltiples filas simultáneas (distintos
lotes de producción, distintas asignaciones) sin conflicto. Esta restricción
se relajará conscientemente cuando se introduzca `"LOTES_INVENTARIO"`
(trabajo futuro, sección 12.4) — hasta entonces, para el MVP, un insumo es
una sola cantidad física agregada.

**Mecanismo para respetar esta restricción sin condición de carrera** (no se
decide con una consulta previa del frontend entre `INSERT` y `UPDATE`):

1. El RPC (`registrar_compra_insumo` o `ajustar_inventario`) primero
   bloquea la fila **estable** de `"REGISTRO_SKU"` del insumo
   (`SELECT ... FOR UPDATE`) — este lock es el punto de serialización: toda
   operación concurrente sobre el mismo insumo, exista o no todavía una fila
   física, espera aquí.
2. Con el lock del SKU ya en mano, busca (también `FOR UPDATE`) la fila de
   `"INVENTARIO_MASTER"` para ese `REGISTRO_SKU_ID`.
3. Si existe, `UPDATE` sobre esa fila. Si no existe, `INSERT`. Como el lock
   del paso 1 serializa completamente, no hay ventana donde dos
   transacciones concurrentes puedan decidir ambas "no existe" e insertar
   dos filas — la segunda transacción, al esperar el lock del paso 1, ve el
   estado ya actualizado cuando le toca su turno.
4. Si el resultado de la operación deja `CANTIDAD_FISICA` en exactamente
   cero, se elimina la fila (regla ya vigente desde v1.3).

**Regla central, sin cambios respecto a v1.4:** una fila existe mientras
`CANTIDAD_FISICA > 0`; al llegar a cero, se elimina.

### 3.5 Reserva de insumo, asignación de producto final y disponibilidad agregada

Sin cambios de fondo respecto a v1.4 en `"REQUERIMIENTO_PRODUCCION"`,
`"RESERVA_INVENTARIO"` y `"ASIGNACION_INVENTARIO_PEDIDO"`:

```sql
create table "REQUERIMIENTO_PRODUCCION" (
    "ID"                        uuid primary key default gen_random_uuid(),
    "PEDIDO_DETALLE_ID"         uuid not null references "PEDIDO_DETALLE"("ID"),
    "REGISTRO_SKU_ID"           uuid not null,
    "TIPO_SKU"                   text not null default 'PRODUCTO_FINAL'
                                 check ("TIPO_SKU" = 'PRODUCTO_FINAL'),
    "CANTIDAD_A_PRODUCIR"       numeric(12,3) not null check ("CANTIDAD_A_PRODUCIR" > 0),
    "ESTADO"                    text not null default 'PENDIENTE'
                                check ("ESTADO" in ('PENDIENTE','EN_PROCESO','COMPLETADO','CANCELADO')),
    "CREADO_EN"                 timestamptz not null default now(),
    "ACTUALIZADO_EN"            timestamptz not null default now(),
    constraint "FK_REQUERIMIENTO_PRODUCTO_FINAL" foreign key
        ("REGISTRO_SKU_ID", "TIPO_SKU")
        references "REGISTRO_SKU"("ID", "TIPO_SKU")
);

create table "RESERVA_INVENTARIO" (
    "ID"                            uuid primary key default gen_random_uuid(),
    "REQUERIMIENTO_PRODUCCION_ID"   uuid not null references "REQUERIMIENTO_PRODUCCION"("ID"),
    "REGISTRO_SKU_ID"               uuid not null,
    "TIPO_SKU"                       text not null default 'INSUMO'
                                     check ("TIPO_SKU" = 'INSUMO'),
    "CANTIDAD"                      numeric(12,3) not null check ("CANTIDAD" > 0),
    "ESTADO"                        text not null default 'ACTIVA'
                                    check ("ESTADO" in ('ACTIVA','LIBERADA','CONSUMIDA')),
    "CREADO_EN"                     timestamptz not null default now(),
    "LIBERADO_EN"                   timestamptz,
    "CONSUMIDO_EN"                  timestamptz,
    constraint "FK_RESERVA_INSUMO" foreign key
        ("REGISTRO_SKU_ID", "TIPO_SKU")
        references "REGISTRO_SKU"("ID", "TIPO_SKU")
);

create table "ASIGNACION_INVENTARIO_PEDIDO" (
    "ID"                    uuid primary key default gen_random_uuid(),
    "PEDIDO_DETALLE_ID"     uuid not null references "PEDIDO_DETALLE"("ID"),
    "INVENTARIO_MASTER_ID"  uuid not null,
    "TIPO_SKU_INVENTARIO"   text not null default 'PRODUCTO_FINAL'
                            check ("TIPO_SKU_INVENTARIO" = 'PRODUCTO_FINAL'),
    "CANTIDAD_ASIGNADA"     numeric(12,3) not null check ("CANTIDAD_ASIGNADA" > 0),
    "ESTADO"                text not null default 'ACTIVA'
                            check ("ESTADO" in ('ACTIVA','ENTREGADA','LIBERADA')),
    "CREADO_EN"             timestamptz not null default now(),
    "ACTUALIZADO_EN"        timestamptz not null default now(),
    constraint "FK_ASIGNACION_PRODUCTO_FINAL" foreign key
        ("INVENTARIO_MASTER_ID", "TIPO_SKU_INVENTARIO")
        references "INVENTARIO_MASTER"("ID", "TIPO_SKU")
);
```

**Nota de cierre:** `"INVENTARIO_MASTER"."PEDIDO_ID"` queda **eliminado
permanentemente** — no se reintroduce como caché ni campo derivado bajo
ninguna circunstancia. `"ASIGNACION_INVENTARIO_PEDIDO"` es la única fuente
de verdad para relacionar inventario de producto final con líneas de
pedido. Esta decisión ya no aparece en la lista de pendientes (sección 14).

**`"V_DISPONIBILIDAD_INSUMO"`, corregida (defecto real detectado):** la
versión de v1.4 partía de `"INVENTARIO_MASTER"`, así que si alguna vez
hubiera más de una fila física para el mismo insumo (algo que la nueva
restricción de la sección 3.4 ya no debería permitir, pero la vista no debe
depender de esa restricción para ser correcta), la reserva total del SKU se
habría restado a *cada fila* por separado, en vez de una sola vez sobre el
agregado.

```sql
create view "V_DISPONIBILIDAD_INSUMO" as
with "EXISTENCIA_FISICA" as (
    select "REGISTRO_SKU_ID", sum("CANTIDAD_FISICA") as "CANTIDAD_FISICA"
    from "INVENTARIO_MASTER"
    where "TIPO_SKU" = 'INSUMO'
    group by "REGISTRO_SKU_ID"
),
"RESERVA_ACTIVA" as (
    select "REGISTRO_SKU_ID", sum("CANTIDAD") as "CANTIDAD_RESERVADA"
    from "RESERVA_INVENTARIO"
    where "ESTADO" = 'ACTIVA'
    group by "REGISTRO_SKU_ID"
)
select
    rs."ID" as "REGISTRO_SKU_ID",
    coalesce(ef."CANTIDAD_FISICA", 0) as "CANTIDAD_FISICA",
    coalesce(ra."CANTIDAD_RESERVADA", 0) as "CANTIDAD_RESERVADA",
    coalesce(ef."CANTIDAD_FISICA", 0) - coalesce(ra."CANTIDAD_RESERVADA", 0) as "CANTIDAD_DISPONIBLE"
from "REGISTRO_SKU" rs
left join "EXISTENCIA_FISICA" ef on ef."REGISTRO_SKU_ID" = rs."ID"
left join "RESERVA_ACTIVA" ra on ra."REGISTRO_SKU_ID" = rs."ID"
where rs."TIPO_SKU" = 'INSUMO';
```

Cada agregación vive en su propio CTE **antes** de unir — así ninguna de las
dos se multiplica contra la otra, y la vista parte de `"REGISTRO_SKU"` (no
de `"INVENTARIO_MASTER"`), así que un SKU sin ninguna fila física aparece
con `CANTIDAD_FISICA = 0` (vía `COALESCE`), no ausente.

**Criterio de prueba obligatorio:** un insumo con dos filas físicas de 2.000
y 3.000 (existencia física total 5.000) y reservas activas por 4.000 debe
devolver `CANTIDAD_DISPONIBLE = 1.000` — nunca un valor que reste 4.000 dos
veces (lo que daría un resultado negativo incorrecto) ni que ignore alguna
de las dos filas físicas.

`"V_DISPONIBILIDAD_PRODUCTO"` (análoga, para producto final vía
`"ASIGNACION_INVENTARIO_PEDIDO"`) sin cambios respecto a v1.4:

```sql
create view "V_DISPONIBILIDAD_PRODUCTO" as
select
    im."ID" as "INVENTARIO_MASTER_ID",
    im."REGISTRO_SKU_ID",
    im."CANTIDAD_FISICA",
    coalesce(asig."CANTIDAD_ASIGNADA", 0) as "CANTIDAD_ASIGNADA",
    im."CANTIDAD_FISICA" - coalesce(asig."CANTIDAD_ASIGNADA", 0) as "CANTIDAD_DISPONIBLE"
from "INVENTARIO_MASTER" im
left join (
    select "INVENTARIO_MASTER_ID", sum("CANTIDAD_ASIGNADA") as "CANTIDAD_ASIGNADA"
    from "ASIGNACION_INVENTARIO_PEDIDO"
    where "ESTADO" = 'ACTIVA'
    group by "INVENTARIO_MASTER_ID"
) asig on asig."INVENTARIO_MASTER_ID" = im."ID"
where im."TIPO_SKU" = 'PRODUCTO_FINAL';
```

**Regla explícita para ambas vistas:** son de **solo lectura**. Ningún RPC
toma una decisión financiera o de inventario basándose en una lectura previa
y no bloqueada de `"V_DISPONIBILIDAD_INSUMO"`/`"V_DISPONIBILIDAD_PRODUCTO"`
— todo RPC que reserva, asigna o consume recalcula la disponibilidad **con
los locks ya adquiridos**, dentro de su propia transacción (sección 17.1).

### 3.6 Consumo real de producción — sin versión de receta

**Se cierra la decisión de no incorporar una tabla de versiones de receta
para el MVP.** Editar `"REGISTRO_SKU_RECETA"` genera auditoría completa
(`"HISTORIAL_TRANSACCIONES"`, `CAMBIO_RECETA`); las reservas
(`"RESERVA_INVENTARIO"`) congelan los insumos calculados al confirmar; y el
consumo real que ocurre al producir se registra de forma reconstruible en
una tabla nueva:

```sql
-- Una fila por ejecución de producción. Agrupa todos los ingredientes
-- consumidos, incluso cuando la producción es anticipada y no existe pedido.
create table "PRODUCCIONES" (
    "ID"                          uuid primary key default gen_random_uuid(),
    "ORIGEN_TIPO"                 text not null
                                  check ("ORIGEN_TIPO" in ('PEDIDO','ANTICIPADO')),
    "REQUERIMIENTO_PRODUCCION_ID" uuid references "REQUERIMIENTO_PRODUCCION"("ID"),
    "REGISTRO_SKU_PRODUCIDO_ID"   uuid not null,
    "TIPO_SKU_PRODUCIDO"          text not null default 'PRODUCTO_FINAL'
                                  check ("TIPO_SKU_PRODUCIDO" = 'PRODUCTO_FINAL'),
    "CANTIDAD_PRODUCIDA"          numeric(12,3) not null
                                  check ("CANTIDAD_PRODUCIDA" > 0),
    "USUARIO_ID"                  uuid references "USUARIOS"("ID"),
    "CREADO_EN"                   timestamptz not null default now(),

    constraint "FK_PRODUCCION_PRODUCTO_FINAL" foreign key
        ("REGISTRO_SKU_PRODUCIDO_ID", "TIPO_SKU_PRODUCIDO")
        references "REGISTRO_SKU"("ID", "TIPO_SKU"),
    constraint "CHK_ORIGEN_PRODUCCION_COHERENTE" check (
        ("ORIGEN_TIPO" = 'PEDIDO' and "REQUERIMIENTO_PRODUCCION_ID" is not null)
        or
        ("ORIGEN_TIPO" = 'ANTICIPADO' and "REQUERIMIENTO_PRODUCCION_ID" is null)
    )
);

create table "DETALLE_CONSUMO_PRODUCCION" (
    "ID"                    uuid primary key default gen_random_uuid(),
    "PRODUCCION_ID"         uuid not null references "PRODUCCIONES"("ID"),
    "INVENTARIO_MASTER_ID"  uuid,   -- referencia histórica, sin FK
    "INSUMO_ID"             uuid not null,
    "TIPO_SKU_INSUMO"       text not null default 'INSUMO'
                            check ("TIPO_SKU_INSUMO" = 'INSUMO'),
    "CANTIDAD_CONSUMIDA"    numeric(12,3) not null
                            check ("CANTIDAD_CONSUMIDA" > 0),
    "CREADO_EN"             timestamptz not null default now(),

    constraint "FK_DETALLE_CONSUMO_INSUMO" foreign key
        ("INSUMO_ID", "TIPO_SKU_INSUMO")
        references "REGISTRO_SKU"("ID", "TIPO_SKU")
);
```

**Por qué `"INVENTARIO_MASTER_ID"` no lleva `FK`:** a diferencia de casi todo
el resto del esquema, esta es una excepción deliberada. `"INVENTARIO_MASTER"`
elimina físicamente sus filas por diseño (sección 3.4) — si esta columna
tuviera `FK`, o bien bloquearía para siempre borrar una fila de inventario ya
entregada (rompiendo la regla central de esa tabla), o exigiría
`on delete set null` y perdería el dato. Se guarda como referencia histórica
sin garantía de que la fila todavía exista, y se complementa con
`"PRODUCCIONES"."REGISTRO_SKU_PRODUCIDO_ID"` (siempre estable, nunca se
borra) para que la
trazabilidad de "qué producto se hizo" nunca dependa de una fila que puede
haber desaparecido.

`"PRODUCCIONES"` identifica inequívocamente cada ejecución y responde quién,
cuándo, cuánto y si surgió de pedido o producción anticipada.
`"DETALLE_CONSUMO_PRODUCCION"` responde qué insumos y cantidades se usaron
realmente. `producir_stock_anticipado` e `iniciar_produccion` crean la cabecera
y todos sus detalles en una sola transacción; ninguna ruta queda con menor
auditoría.

**Responsabilidades distintas, sin redundancia real:** `CAMBIO_RECETA` en
`"HISTORIAL_TRANSACCIONES"` dice *qué definición de receta cambió*;
`"DETALLE_CONSUMO_PRODUCCION"` dice *qué se usó realmente* en cada
producción. Son preguntas distintas y ninguna reemplaza a la otra.

### 3.7 Personalización — tres caminos

**A. Variante estable o recurrente.** Se registra como una fila normal de
`"REGISTRO_SKU"` (`PRODUCTO_FINAL`) bajo el `"PRODUCTOS"` que corresponda —
SKU propio escrito por `ADMIN`, precio, receta y estado activo/inactivo
propios. No requiere ninguna tabla nueva; es exactamente el modelo de la
sección 3.2.

**B. Personalización excepcional sin impacto productivo.** Vive como texto
libre en `"PEDIDO_DETALLE"."NOTAS"` cuando no altera ingredientes,
cantidades, inventario, precio ni proceso de producción. Opcionalmente
puede referenciar una opción del catálogo configurable (sección 3.8) para
mantener trazabilidad y saber si generó advertencia:

```sql
create table "PEDIDO_DETALLE_PERSONALIZACION" (
    "ID"                        uuid primary key default gen_random_uuid(),
    "PEDIDO_DETALLE_ID"         uuid not null references "PEDIDO_DETALLE"("ID"),
    "OPCION_PERSONALIZACION_ID" uuid not null references "OPCIONES_PERSONALIZACION"("ID"),
    "NOMBRE_SNAPSHOT"           text not null,
    "GENERO_ADVERTENCIA"        boolean not null default false,
    "CREADO_EN"                 timestamptz not null default now()
);
```

`NOMBRE_SNAPSHOT` congela el nombre de la opción tal como se veía al
momento del pedido — si el catálogo cambia o se desactiva después, el
pedido histórico no cambia de significado.

**C. Personalización excepcional con impacto productivo.** No crea un SKU
permanente. Usa una receta snapshot exclusiva de esa línea de pedido:

```sql
create table "RECETA_PERSONALIZADA_PEDIDO" (
    "ID"                    uuid primary key default gen_random_uuid(),
    "PEDIDO_DETALLE_ID"     uuid not null references "PEDIDO_DETALLE"("ID"),
    "INSUMO_ID"             uuid not null,
    "TIPO_SKU_INSUMO"       text not null default 'INSUMO'
                            check ("TIPO_SKU_INSUMO" = 'INSUMO'),
    "CANTIDAD_REQUERIDA"    numeric(12,3) not null check ("CANTIDAD_REQUERIDA" > 0),
    "MERMA_PORCENTAJE"      numeric(5,2) not null default 0
                            check ("MERMA_PORCENTAJE" >= 0 and "MERMA_PORCENTAJE" <= 100),
    "APROBADO_POR"          uuid not null references "USUARIOS"("ID"),
    "APROBADO_EN"           timestamptz not null default now(),

    constraint "FK_RECETA_PERSONALIZADA_INSUMO" foreign key
        ("INSUMO_ID", "TIPO_SKU_INSUMO")
        references "REGISTRO_SKU"("ID", "TIPO_SKU"),
    constraint "UQ_RECETA_PERSONALIZADA_INSUMO" unique ("PEDIDO_DETALLE_ID", "INSUMO_ID")
);
```

**La aprobación queda garantizada por construcción, no por un estado
"pendiente/aprobado" separado:** solo `ADMIN` puede ejecutar el RPC
(`aprobar_receta_personalizada_pedido`) que inserta estas filas (sección 9,
principio de que ninguna tabla de negocio se escribe directamente desde el
frontend) — `APROBADO_POR`/`APROBADO_EN` nunca son nulos porque la única
forma de que la fila exista es que un `ADMIN` la haya creado.

**Cálculo de insumos requeridos al confirmar (regla de precedencia):** para
cada línea de pedido, `confirmar_pedido` usa `"RECETA_PERSONALIZADA_PEDIDO"`
si existe alguna fila para ese `PEDIDO_DETALLE_ID`; si no existe ninguna,
usa `"REGISTRO_SKU_RECETA"` del producto de catálogo de esa línea. Nunca
mezcla ambas para la misma línea.

Puede convertirse después en variante permanente (camino A) mediante una
acción administrativa separada — esa conversión no modifica pedidos
históricos, que siguen apuntando a su propio snapshot en
`"RECETA_PERSONALIZADA_PEDIDO"`.

### 3.8 Catálogos comerciales configurables

Nuevo en esta versión. Administrables por `ADMIN` desde UI en un corte
futuro apropiado (no se construye esa UI todavía) — lo que se fija ahora es
solo el esquema, para que ningún corte futuro tenga que introducir estas
listas como constantes de código.

```sql
create table "UNIDADES_MEDIDA" (
    "CODIGO"    text primary key,   -- 'g','ml','kg','L','unidad', etc.
    "ETIQUETA"  text not null,
    "ACTIVO"    boolean not null default true
);

create table "TIPOS_PERSONALIZACION" (
    "CODIGO"        text primary key,
    "ETIQUETA"      text not null,
    "ACTIVO"        boolean not null default true,
    "ORDEN_VISUAL"  int
);

create table "OPCIONES_PERSONALIZACION" (
    "ID"                            uuid primary key default gen_random_uuid(),
    "TIPO_PERSONALIZACION_CODIGO"   text not null references "TIPOS_PERSONALIZACION"("CODIGO"),
    "NOMBRE"                        text not null,
    "AFECTA_PRECIO"                 boolean not null default false,
    "AFECTA_RECETA"                 boolean not null default false,
    "REQUIERE_APROBACION"           boolean not null default false,
    "GENERA_ADVERTENCIA"            boolean not null default false,
    "TIPO_ADVERTENCIA_CODIGO"       text,
    "ACTIVO"                        boolean not null default true,
    "ORDEN_VISUAL"                  int
);

create table "ALERGENOS" (
    "CODIGO"    text primary key,
    "ETIQUETA"  text not null,
    "ACTIVO"    boolean not null default true
);

create table "TIPOS_ADVERTENCIA" (
    "CODIGO"    text primary key,
    "ETIQUETA"  text not null,
    "ACTIVO"    boolean not null default true
);

alter table "OPCIONES_PERSONALIZACION"
    add constraint "FK_OPCION_TIPO_ADVERTENCIA"
    foreign key ("TIPO_ADVERTENCIA_CODIGO")
    references "TIPOS_ADVERTENCIA"("CODIGO");

create table "OPCION_PERSONALIZACION_ALERGENO" (
    "OPCION_PERSONALIZACION_ID" uuid not null references "OPCIONES_PERSONALIZACION"("ID"),
    "ALERGENO_CODIGO"           text not null references "ALERGENOS"("CODIGO"),
    primary key ("OPCION_PERSONALIZACION_ID", "ALERGENO_CODIGO")
);

-- Snapshot operacional por línea. confirmar_pedido consulta esta tabla y
-- no confía en un booleano enviado por el frontend.
create table "ADVERTENCIAS_PEDIDO" (
    "ID"                          uuid primary key default gen_random_uuid(),
    "PEDIDO_DETALLE_ID"           uuid not null references "PEDIDO_DETALLE"("ID"),
    "TIPO_ADVERTENCIA_CODIGO"     text not null references "TIPOS_ADVERTENCIA"("CODIGO"),
    "ALERGENO_CODIGO"             text references "ALERGENOS"("CODIGO"),
    "MENSAJE_SNAPSHOT"            text not null,
    "RECONOCIDA_POR"              uuid references "USUARIOS"("ID"),
    "RECONOCIDA_EN"               timestamptz,
    "CREADO_EN"                   timestamptz not null default now(),
    constraint "CHK_RECONOCIMIENTO_ADVERTENCIA" check (
        ("RECONOCIDA_POR" is null and "RECONOCIDA_EN" is null)
        or
        ("RECONOCIDA_POR" is not null and "RECONOCIDA_EN" is not null)
    )
);
```

**Regla de eliminación:** nunca se borran físicamente si tienen uso
histórico — se desactivan (`ACTIVO = false`). Los pedidos históricos que
referenciaron una opción ya desactivada siguen mostrando su snapshot
(`"PEDIDO_DETALLE_PERSONALIZACION"."NOMBRE_SNAPSHOT"`), nunca dependen de que
la fila de catálogo siga activa.

**Distinción explícita, ya introducida en la sección 2:** estos son
catálogos *comerciales*. Los catálogos *técnicos* (`"ESTADOS_PEDIDO"`,
`"ESTADOS_PAGO"`, `"TIPOS_TRANSACCION"`, `"ESTADOS_INVENTARIO_PRODUCTO"`,
`"CANCELACION_PEDIDO"` → disposición) siguen siendo tablas catálogo también,
pero su contenido lo define el equipo de ingeniería al construir cada corte,
no un `ADMIN` desde una pantalla de configuración — agregar un valor ahí sin
que ningún RPC sepa interpretarlo no tiene efecto.

**Alérgenos y advertencias (formalización):** "sin azúcar" y "sin frutos
secos" describen ingredientes o configuración de receta (vía
`"RECETA_PERSONALIZADA_PEDIDO"` o una variante permanente) — **no
garantizan ausencia de contaminación cruzada**, y el sistema no debe
permitir ni sugerir la frase "libre de alérgenos" sin que exista un
procedimiento operacional verificable fuera del software. Una opción
relacionada con alergias genera una fila snapshot en
`"ADVERTENCIAS_PEDIDO"` por línea y advertencia aplicable. Un ADMIN reconoce
cada advertencia mediante `reconocer_advertencia_pedido`; el RPC registra
usuario, fecha y mensaje mostrado. `confirmar_pedido` consulta la base y
rechaza continuar si existe alguna advertencia sin reconocer. Nunca acepta
un booleano global del frontend como prueba. No se fija en código ninguna
lista cerrada de clasificaciones
(`PREFERENCIA`, `INTOLERANCIA`, `ALERGIA`) — si se necesitan, se agregan
como filas de `"TIPOS_PERSONALIZACION"`.

### 3.9 Cambios de receta con pedidos confirmados (formalización)

Reafirma invariantes ya vigentes, ahora explícitas en un solo lugar: editar
`"REGISTRO_SKU_RECETA"` (`editar_receta`) solo afecta confirmaciones
*futuras* — un pedido ya `CONFIRMADO` conserva su `"REQUERIMIENTO_PRODUCCION"`
y `"RESERVA_INVENTARIO"` calculados con la receta vigente al momento de
confirmar, y **nunca** se recalculan automáticamente ni se libera/sustituye
su inventario reservado solo porque el catálogo cambió después. Cualquier
cambio excepcional a un pedido ya confirmado pasa por
`actualizar_pedido_antes_de_produccion`, que libera y vuelve a calcular
dentro de una transacción explícita y auditada — nunca hay un camino
alternativo que edite `"PEDIDO_DETALLE"` directamente. Una vez iniciada la
producción (`iniciar_produccion`), la línea y su receta asociada quedan
inmutables (invariante 8, sección 5).

### 3.10 Pedidos

Sin cambios de fondo respecto a v1.4, salvo que `"PEDIDO_DETALLE"` ya no
depende de `"RECETA_TIPO"` para nada (eliminado, sección 3.2):

```sql
create table "ESTADOS_PEDIDO" (
    "CODIGO"      text primary key,
    "ETIQUETA"    text not null,
    "ORDEN"       int not null
);

create table "PEDIDOS" (
    "ID"                          uuid primary key default gen_random_uuid(),
    "NUMERO_PEDIDO"               bigint generated always as identity,
    "CLIENTE_ID"                  uuid not null references "CLIENTES"("ID"),
    "ESTADO"                      text not null references "ESTADOS_PEDIDO"("CODIGO") default 'BORRADOR',
    "ORIGEN"                      text not null default 'ADMIN'
                                  check ("ORIGEN" in ('ADMIN','PORTAL_CLIENTE','WHATSAPP','CORREO','TELEFONO')),
    "FECHA_ENTREGA_SOLICITADA"    timestamptz,
    "CONFIRMADO_EN"               timestamptz,
    "COMPLETADO_EN"               timestamptz,
    "CANCELADO_EN"                timestamptz,
    "SUBTOTAL"                    numeric(12,0) not null default 0,
    "DESCUENTO_TOTAL"             numeric(12,0) not null default 0
                                  check ("DESCUENTO_TOTAL" >= 0 and "DESCUENTO_TOTAL" <= "SUBTOTAL"),
    "MOTIVO_DESCUENTO"            text,
    "COSTO_ENVIO"                 numeric(12,0) not null default 0,
    "TOTAL"                       numeric(12,0) not null default 0
                                  check ("TOTAL" = "SUBTOTAL" - "DESCUENTO_TOTAL" + "COSTO_ENVIO"),
    "MONEDA"                      text not null default 'CLP',
    "NOTAS_CLIENTE"               text,
    "NOTAS_INTERNAS"              text,
    "CREADO_POR"                  uuid references "USUARIOS"("ID"),
    "CREADO_EN"                   timestamptz not null default now(),
    "ACTUALIZADO_EN"              timestamptz not null default now()
);

create table "PEDIDO_DETALLE" (
    "ID"                          uuid primary key default gen_random_uuid(),
    "PEDIDO_ID"                   uuid not null references "PEDIDOS"("ID") on delete cascade,
    "REGISTRO_SKU_ID"             uuid not null,
    "TIPO_SKU"                     text not null default 'PRODUCTO_FINAL'
                                   check ("TIPO_SKU" = 'PRODUCTO_FINAL'),
    "NOMBRE_PRODUCTO_SNAPSHOT"    text not null,
    "CANTIDAD"                    numeric(12,3) not null check ("CANTIDAD" > 0),
    "PRECIO_LISTA_SNAPSHOT"       numeric(12,0) not null check ("PRECIO_LISTA_SNAPSHOT" >= 0),
    "PRECIO_UNITARIO"             numeric(12,0) not null check ("PRECIO_UNITARIO" >= 0),
    "PRECIO_NEGOCIADO"            boolean not null default false,
    "MOTIVO_NEGOCIACION"          text,
    "TOTAL_LINEA"                 numeric(12,0) not null,
    "NOTAS"                       text,
    "CREADO_EN"                   timestamptz not null default now(),
    constraint "FK_PEDIDO_DETALLE_PRODUCTO_FINAL" foreign key
        ("REGISTRO_SKU_ID", "TIPO_SKU")
        references "REGISTRO_SKU"("ID", "TIPO_SKU")
);
```

### 3.11 Historial de estados del pedido

Sin cambios respecto a v1.4:

```sql
create table "HISTORIAL_ESTADOS_PEDIDO" (
    "ID"                uuid primary key default gen_random_uuid(),
    "PEDIDO_ID"         uuid not null references "PEDIDOS"("ID"),
    "ESTADO_ANTERIOR"   text,
    "ESTADO_NUEVO"      text not null,
    "USUARIO_ID"        uuid references "USUARIOS"("ID"),
    "MOTIVO"            text,
    "CREADO_EN"         timestamptz not null default now()
);
```

### 3.12 Entregas

Sin cambios respecto a v1.4:

```sql
create table "ENTREGAS" (
    "ID"                          uuid primary key default gen_random_uuid(),
    "PEDIDO_ID"                   uuid not null references "PEDIDOS"("ID"),
    "TIPO_ENTREGA"                text not null default 'DOMICILIO' check ("TIPO_ENTREGA" in ('DOMICILIO')),
    "PROGRAMADA_EN"               timestamptz,
    "ENTREGADA_EN"                timestamptz,
    "ESTADO"                      text not null default 'PROGRAMADA'
                                  check ("ESTADO" in ('PROGRAMADA','ENTREGADA','CANCELADA')),
    "DIRECCION_ENTREGA_SNAPSHOT"  text,
    "NOTAS"                       text,
    "CREADO_POR"                  uuid references "USUARIOS"("ID"),
    "CREADO_EN"                   timestamptz not null default now()
);

create table "ENTREGA_DETALLE" (
    "ID"                    uuid primary key default gen_random_uuid(),
    "ENTREGA_ID"            uuid not null references "ENTREGAS"("ID") on delete cascade,
    "PEDIDO_DETALLE_ID"     uuid not null references "PEDIDO_DETALLE"("ID"),
    "CANTIDAD_ENTREGADA"    numeric(12,3) not null check ("CANTIDAD_ENTREGADA" > 0),
    "CREADO_EN"             timestamptz not null default now(),

    constraint "UQ_LINEA_POR_ENTREGA" unique ("ENTREGA_ID", "PEDIDO_DETALLE_ID")
);

create view "V_PROGRESO_ENTREGA_DETALLE" as
select
    pd."ID" as "PEDIDO_DETALLE_ID",
    pd."PEDIDO_ID",
    pd."CANTIDAD" as "CANTIDAD_PEDIDA",
    coalesce(sum(ed."CANTIDAD_ENTREGADA"), 0) as "CANTIDAD_ENTREGADA",
    pd."CANTIDAD" - coalesce(sum(ed."CANTIDAD_ENTREGADA"), 0) as "CANTIDAD_PENDIENTE"
from "PEDIDO_DETALLE" pd
left join "ENTREGA_DETALLE" ed on ed."PEDIDO_DETALLE_ID" = pd."ID"
group by pd."ID", pd."PEDIDO_ID", pd."CANTIDAD";
```

### 3.13 Pagos y reembolsos

Sin cambios respecto a v1.4 (inmutabilidad en tres capas, `"V_SALDO_PEDIDO"`
corregida con CTE independientes) — ver v1.4 sección 3.10 para el detalle
completo, reproducido aquí sin modificaciones:

```sql
create table "ESTADOS_PAGO" (
    "CODIGO"      text primary key,
    "ETIQUETA"    text not null
);

create table "PAGOS" (
    "ID"                uuid primary key default gen_random_uuid(),
    "PEDIDO_ID"         uuid not null references "PEDIDOS"("ID"),
    "MONTO"             numeric(12,0) not null check ("MONTO" > 0),
    "METODO_PAGO"       text not null check ("METODO_PAGO" in ('EFECTIVO','TRANSFERENCIA')),
    "ESTADO"            text not null default 'PENDIENTE' references "ESTADOS_PAGO"("CODIGO"),
    "REFERENCIA"        text,
    "PAGADO_EN"         timestamptz,
    "CONFIRMADO_POR"    uuid references "USUARIOS"("ID"),
    "CONFIRMADO_EN"     timestamptz,
    "CREADO_POR"        uuid references "USUARIOS"("ID"),
    "CREADO_EN"         timestamptz not null default now()
);

create table "REEMBOLSOS" (
    "ID"                uuid primary key default gen_random_uuid(),
    "PEDIDO_ID"         uuid not null references "PEDIDOS"("ID"),
    "MONTO"             numeric(12,0) not null check ("MONTO" > 0),
    "MOTIVO"            text not null,
    "ESTADO"            text not null default 'PENDIENTE' references "ESTADOS_PAGO"("CODIGO"),
    "CREADO_POR"        uuid references "USUARIOS"("ID"),
    "CONFIRMADO_POR"    uuid references "USUARIOS"("ID"),
    "CONFIRMADO_EN"     timestamptz,
    "CREADO_EN"         timestamptz not null default now()
);

create view "V_SALDO_PEDIDO" as
with "PAGOS_AGREGADOS" as (
    select "PEDIDO_ID", sum("MONTO") filter (where "ESTADO" = 'CONFIRMADO') as "PAGADO_CONFIRMADO"
    from "PAGOS"
    group by "PEDIDO_ID"
),
"REEMBOLSOS_AGREGADOS" as (
    select "PEDIDO_ID", sum("MONTO") filter (where "ESTADO" = 'CONFIRMADO') as "REEMBOLSADO_CONFIRMADO"
    from "REEMBOLSOS"
    group by "PEDIDO_ID"
)
select
    p."ID" as "PEDIDO_ID",
    p."TOTAL",
    coalesce(pa."PAGADO_CONFIRMADO", 0) as "PAGADO_CONFIRMADO",
    coalesce(re."REEMBOLSADO_CONFIRMADO", 0) as "REEMBOLSADO_CONFIRMADO",
    p."TOTAL" - coalesce(pa."PAGADO_CONFIRMADO", 0) + coalesce(re."REEMBOLSADO_CONFIRMADO", 0) as "SALDO_PENDIENTE"
from "PEDIDOS" p
left join "PAGOS_AGREGADOS" pa on pa."PEDIDO_ID" = p."ID"
left join "REEMBOLSOS_AGREGADOS" re on re."PEDIDO_ID" = p."ID";
```

Trigger de inmutabilidad económica (sin cambios respecto a v1.4):

```sql
create or replace function fn_bloquear_edicion_economica_pago()
returns trigger
language plpgsql
as $$
begin
    if old."MONTO" is distinct from new."MONTO"
       or old."PEDIDO_ID" is distinct from new."PEDIDO_ID"
       or old."METODO_PAGO" is distinct from new."METODO_PAGO" then
        raise exception 'No se puede modificar MONTO, PEDIDO_ID ni METODO_PAGO de un pago ya creado';
    end if;
    if old."ESTADO" in ('CONFIRMADO','RECHAZADO') then
        raise exception 'Un pago en estado terminal (%) no puede modificarse', old."ESTADO";
    end if;
    return new;
end;
$$;

create trigger "TRG_BLOQUEAR_EDICION_PAGO"
before update on "PAGOS"
for each row execute function fn_bloquear_edicion_economica_pago();
```

### 3.14 Cancelación de pedido

Sin cambios respecto a v1.4:

```sql
create table "CANCELACION_PEDIDO" (
    "ID"                uuid primary key default gen_random_uuid(),
    "PEDIDO_ID"         uuid not null references "PEDIDOS"("ID"),
    "ESTADO_ANTERIOR"   text not null,
    "DISPOSICION"       text check ("DISPOSICION" is null or "DISPOSICION" in ('DESPERDICIO','DONACION')),
    "MOTIVO"            text,
    "CANCELADO_POR"     uuid references "USUARIOS"("ID"),
    "CREADO_EN"         timestamptz not null default now(),

    constraint "UQ_CANCELACION_POR_PEDIDO" unique ("PEDIDO_ID")
);
```

### 3.15 Historial de transacciones (7 tipos)

Sin cambios respecto a v1.4:

```sql
create table "TIPOS_TRANSACCION" (
    "CODIGO"      text primary key,
    "ETIQUETA"    text not null
);
-- seed: AJUSTE_INVENTARIO, CANCELACION_PEDIDO, CAMBIO_RECETA, INGRESO_PEDIDO,
--       INGRESO_INVENTARIO, CAMBIO_STOCK, CAMBIO_PRECIO

create table "HISTORIAL_TRANSACCIONES" (
    "ID"                  uuid primary key default gen_random_uuid(),
    "TIPO_ENTIDAD"        text not null,
    "ENTIDAD_ID"          uuid not null,
    "TIPO_TRANSACCION"    text not null references "TIPOS_TRANSACCION"("CODIGO"),
    "VALOR_ANTERIOR"      jsonb,
    "VALOR_NUEVO"         jsonb,
    "USUARIO_ID"          uuid references "USUARIOS"("ID"),
    "MOTIVO"              text,
    "CREADO_EN"           timestamptz not null default now()
);
```

`INGRESO_INVENTARIO` conserva ahora, dentro de `"VALOR_NUEVO"`,
`CANTIDAD_COMPRA`, `UNIDAD_COMPRA`, `FACTOR_CONVERSION` utilizado y
`CANTIDAD_BASE` resultante (sección 3.2). `AJUSTE_INVENTARIO` conserva
`CANTIDAD_ANTERIOR`, `CANTIDAD_NUEVA`, `DIFERENCIA` y `MODO`
(`FIJAR_CANTIDAD`/`APLICAR_DIFERENCIA`) además de `MOTIVO`, usuario y fecha
(sección 7).

---

## 4. Roles y permisos

Sin cambios: `ADMIN` puede todo; `CLIENTE` solo ve y crea su propio pedido.

---

## 5. Invariantes del sistema

1. `CANTIDAD_DISPONIBLE` (insumo, agregada) = `sum(INVENTARIO_MASTER.
   CANTIDAD_FISICA)` menos `sum(RESERVA_INVENTARIO.CANTIDAD)` `ACTIVA`, para
   el mismo `REGISTRO_SKU_ID` — nunca calculada fila por fila.
2. `CANTIDAD_DISPONIBLE` (producto final, por fila) = `CANTIDAD_FISICA` de
   esa fila menos `ASIGNACION_INVENTARIO_PEDIDO` `ACTIVA` sobre ella.
3. **`CANTIDAD_FISICA` nunca es negativa** — ni en una fila individual
   (`CHECK > 0`, la fila se borra antes de llegar a cero) ni en el agregado.
4. **`CANTIDAD_DISPONIBLE` nunca es negativa al completar una operación** —
   ninguna reserva, asignación, ajuste o consumo puede dejarla por debajo de
   cero; si lo haría, la operación completa falla, sin escrituras parciales,
   con un código de dominio (`STOCK_INSUFICIENTE`/`RESULTADO_NEGATIVO`), no
   con el error crudo de una restricción de Postgres.
5. Como máximo una fila activa de `INVENTARIO_MASTER` por `REGISTRO_SKU_ID`
   de tipo `INSUMO` (índice único parcial, sección 3.4).
6. `"RESERVA_INVENTARIO"`/`"ASIGNACION_INVENTARIO_PEDIDO"` liberadas o
   consumidas usan siempre la cantidad registrada en su propia fila, nunca
   una recalculada contra el estado actual de la receta o del inventario.
7. Un pago o reembolso `PENDIENTE` no afecta `"SALDO_PENDIENTE"`.
8. `"PAGOS"`/`"REEMBOLSOS"` en estado terminal no se modifican; sus campos
   económicos originales nunca se modifican desde que se insertan.
9. Un pedido no edita `"PEDIDO_DETALLE"` una vez `ESTADO ∈ (EN_PRODUCCION,
   LISTO, CANCELADO)`.
10. `sum("ENTREGA_DETALLE"."CANTIDAD_ENTREGADA") <= "PEDIDO_DETALLE"."CANTIDAD"`
    por línea.
11. `"REEMBOLSOS"."MONTO"` nunca excede `PAGADO_CONFIRMADO -
    REEMBOLSADO_CONFIRMADO` al momento de crearse.
12. Los precios en `"PEDIDO_DETALLE"` nunca se recalculan contra
    `"REGISTRO_SKU"."PRECIO"` vigente.
13. `"PEDIDOS"."TOTAL" = SUBTOTAL - DESCUENTO_TOTAL + COSTO_ENVIO` siempre.
14. No se inicia producción si algún insumo requerido no tiene
    `CANTIDAD_DISPONIBLE` suficiente.
15. `"PAGOS"`, `"REEMBOLSOS"`, `"HISTORIAL_TRANSACCIONES"`,
    `"HISTORIAL_ESTADOS_PEDIDO"`, `"CANCELACION_PEDIDO"`,
    `"PRODUCCIONES"`, `"DETALLE_CONSUMO_PRODUCCION"`: solo inserción.
16. Toda operación con más de una escritura relacionada es atómica.
17. Un usuario `CLIENTE` siempre tiene `CLIENTE_ID`; un `ADMIN` nunca lo
    tiene.
18. Editar una receta de catálogo (`editar_receta`) nunca afecta un pedido
    ya `CONFIRMADO` — sus reservas ya calculadas no se recalculan ni se
    liberan automáticamente por ese cambio (sección 3.9).
19. Para calcular insumos requeridos de una línea, `confirmar_pedido` usa
    `"RECETA_PERSONALIZADA_PEDIDO"` si existe para esa línea; si no, usa
    `"REGISTRO_SKU_RECETA"` del producto de catálogo — nunca ambas a la vez.
20. Toda fila de toda tabla contiene `"USER_STAMP"`, `"PROCESS_STAMP"` y
    `"DATE_TIME_STAMP"`; ningún INSERT/UPDATE queda con origen desconocido.
21. `"USER_STAMP"` representa `auth.uid()` para acciones humanas o una
    identidad `SYSTEM:*` autorizada para migraciones, bootstrap, webhooks y
    tareas internas.
22. `"PROCESS_STAMP"` es un código estable definido dentro del RPC/proceso,
    nunca texto libre confiado al frontend.
23. `"DATE_TIME_STAMP"` registra cada INSERT/UPDATE con
    `clock_timestamp()` y no sustituye fechas de negocio.
24. Toda excepción, validación o mensaje reutilizable usa un
    `"RESOURCE_FILE_BASE"."RESOURCE_CODE"` estable; ningún contrato depende
    del texto de `"MESSAGE_TEXT"`.
25. Todo código `RFB_*` usado por un RPC/SP existe, está activo y cuenta con
    seed o migración versionada antes de desplegar la función que lo utiliza.

---

## 6. Máquina de estados del pedido

Sin cambios respecto a v1.4, agregando que el cálculo de insumos en
`confirmar_pedido`/`actualizar_pedido_antes_de_produccion` respeta la
invariante 19, y que `iniciar_produccion`/`producir_stock_anticipado`
escriben `"DETALLE_CONSUMO_PRODUCCION"`.

| Estado inicial | Acción | Estado final | Efectos |
|---|---|---|---|
| (ninguno) | `crear_pedido` | `SOLICITADO`/`BORRADOR` | `HISTORIAL_ESTADOS_PEDIDO`, `HISTORIAL_TRANSACCIONES` (`INGRESO_PEDIDO`) |
| `SOLICITADO` | `confirmar_pedido` | `CONFIRMADO` | por línea: asigna stock `PROCESADO` sin dueño si alcanza; para el resto, `REQUERIMIENTO_PRODUCCION` + `RESERVA_INVENTARIO` (receta personalizada si existe, si no, de catálogo) |
| `CONFIRMADO` | `actualizar_pedido_antes_de_produccion` | `CONFIRMADO` | libera y recalcula asignaciones/reservas afectadas |
| `SOLICITADO`,`CONFIRMADO` | `cancelar_pedido` (pre-producción) | `CANCELADO` | libera reservas y asignaciones `ACTIVA→LIBERADA` |
| `CONFIRMADO` | `iniciar_produccion` | `EN_PRODUCCION` | consume reserva; crea fila `PRODUCTO_FINAL` `EN_PROCESO`; escribe `DETALLE_CONSUMO_PRODUCCION` |
| `EN_PRODUCCION` | `marcar_listo` | `LISTO` | `ESTADO = PROCESADO`; `REQUERIMIENTO_PRODUCCION → COMPLETADO` |
| `EN_PRODUCCION`,`LISTO` | `cancelar_pedido` (post-producción) | `CANCELADO` | disposición obligatoria |
| `LISTO` | `crear_entrega`/`confirmar_entrega` | `LISTO` | asignación `ACTIVA→ENTREGADA`; reduce/borra fila de inventario |

---

## 7. Contratos conceptuales de RPC

> Nombres en `snake_case`, sin comillas.

**`crear_pedido(p_cliente_id, p_origen, p_fecha_entrega_solicitada, p_items, p_notas_cliente)`**
Roles: ADMIN, CLIENTE (propio). Validaciones: cliente/variante activos,
cantidades > 0. Tablas: `PEDIDOS`, `PEDIDO_DETALLE`, `HISTORIAL_ESTADOS_PEDIDO`,
`HISTORIAL_TRANSACCIONES` (`INGRESO_PEDIDO`).

**`actualizar_pedido_antes_de_produccion(p_pedido_id, p_items, p_fecha_entrega_solicitada)`**
Roles: ADMIN. Válido solo si `ESTADO = 'CONFIRMADO'`. Errores:
`PEDIDO_YA_EN_PRODUCCION`, `STOCK_INSUFICIENTE`.

**`reconocer_advertencia_pedido(p_advertencia_id)`**
Roles: ADMIN. Bloquea la advertencia, exige que pertenezca a un pedido aún no
confirmado y registra `RECONOCIDA_POR`/`RECONOCIDA_EN`. Es idempotente para
el mismo reconocimiento y no permite sustituir al usuario que ya reconoció.

**`confirmar_pedido(p_pedido_id)`**
Roles: ADMIN. Consulta `"ADVERTENCIAS_PEDIDO"` dentro de la transacción y
rechaza el pedido si existe alguna advertencia no reconocida. No recibe
booleanos ni listas de reconocimiento como autoridad desde la UI. Locking:
sección 17.1. Errores:
`STOCK_INSUFICIENTE`, `ADVERTENCIA_NO_CONFIRMADA`.

**`iniciar_produccion(p_pedido_id)`**
Roles: ADMIN. Tablas: `INVENTARIO_MASTER`, `RESERVA_INVENTARIO`,
`REQUERIMIENTO_PRODUCCION`, `PRODUCCIONES` (`ORIGEN_TIPO = 'PEDIDO'`),
`DETALLE_CONSUMO_PRODUCCION`, `HISTORIAL_TRANSACCIONES` (`CAMBIO_STOCK`).

**`producir_stock_anticipado(p_registro_sku_id, p_cantidad)`**
Roles: ADMIN. Tablas: `INVENTARIO_MASTER`, `PRODUCCIONES`
(`ORIGEN_TIPO = 'ANTICIPADO'`), `DETALLE_CONSUMO_PRODUCCION`,
`HISTORIAL_TRANSACCIONES` (`CAMBIO_STOCK`).
Mismo nivel de auditoría que `iniciar_produccion`.

**`cancelar_pedido(p_pedido_id, p_motivo, p_disposicion)`**
Sin cambios de fondo respecto a v1.4.

**`crear_entrega(...)`** / **`confirmar_entrega(p_entrega_id)`**
Sin cambios de fondo respecto a v1.4.

**`registrar_pago`** / **`confirmar_pago`** / **`rechazar_pago`** /
**`registrar_reembolso`** / **`confirmar_reembolso`** / **`rechazar_reembolso`**
Sin cambios respecto a v1.4.

**`registrar_compra_insumo(p_registro_sku_id, p_cantidad_compra)`**
Roles: ADMIN. Parámetros: SKU, cantidad en unidad de compra. Validaciones:
`p_cantidad_compra > 0`. Locking: `FOR UPDATE` sobre `"REGISTRO_SKU"` (punto
de serialización, sección 3.4), luego sobre la fila de inventario si existe.
Cálculo: `CANTIDAD_BASE = p_cantidad_compra × FACTOR_CONVERSION` (leído de
la base, redondeado a 3 decimales). Tablas: `INVENTARIO_MASTER` (crea o
incrementa la única fila activa de ese insumo), `HISTORIAL_TRANSACCIONES`
(`INGRESO_INVENTARIO`, con cantidad de compra/unidad/factor/cantidad base en
`VALOR_NUEVO`). Auditoría: sí. Idempotencia: no aplica (cada compra es un
evento nuevo). Errores de dominio: `CANTIDAD_INVALIDA`.

**`ajustar_inventario(p_registro_sku_id, p_modo, p_cantidad, p_motivo)`**
Roles: ADMIN. Parámetros: `p_modo in ('FIJAR_CANTIDAD','APLICAR_DIFERENCIA')`
— validado como intención explícita dentro del RPC (no es una columna de
tabla, así que no lleva `CHECK`, se valida con una condición al inicio de la
función). Validaciones: `p_motivo` obligatorio. Locking: igual que
`registrar_compra_insumo`. Cálculo:
`FIJAR_CANTIDAD` → `CANTIDAD_NUEVA = p_cantidad`, `DIFERENCIA = CANTIDAD_NUEVA
- CANTIDAD_ANTERIOR`;
`APLICAR_DIFERENCIA` → `DIFERENCIA = p_cantidad`, `CANTIDAD_NUEVA =
CANTIDAD_ANTERIOR + DIFERENCIA`.
Si `CANTIDAD_NUEVA < 0`: falla completa (`RESULTADO_NEGATIVO`). Si
`CANTIDAD_NUEVA = 0`: elimina la fila. Si no existía fila y
`CANTIDAD_NUEVA > 0`: la crea. Tablas: `INVENTARIO_MASTER`,
`HISTORIAL_TRANSACCIONES` (`AJUSTE_INVENTARIO`, con `CANTIDAD_ANTERIOR`,
`CANTIDAD_NUEVA`, `DIFERENCIA`, `MODO`, `MOTIVO`, usuario, fecha en
`VALOR_ANTERIOR`/`VALOR_NUEVO`). El frontend nunca escribe
`"INVENTARIO_MASTER"` ni `"HISTORIAL_TRANSACCIONES"` directamente — todo
pasa por este RPC. Errores de dominio: `RESULTADO_NEGATIVO`,
`MODO_INVALIDO`, `MOTIVO_REQUERIDO`.

**`editar_precio(p_registro_sku_id, p_precio_nuevo)`**
Sin cambios respecto a v1.4.

**`editar_receta(p_producto_final_id, p_items)`**
Sin cambios de fondo — agrega auditoría `CAMBIO_RECETA` sin afectar pedidos
ya confirmados (invariante 18).

**`crear_producto(p_nombre, p_descripcion)`** / **`editar_producto(p_producto_id, p_nombre, p_descripcion, p_activo)`**
*(nuevas)* Roles: ADMIN. Tablas: `PRODUCTOS`. Validaciones: `p_nombre` no
vacío. No requieren auditoría en `"HISTORIAL_TRANSACCIONES"` (no son datos
financieros ni de inventario) — el propio `UPDATE` en una tabla de catálogo
administrativa simple es suficiente; `"PRODUCTOS"` no participa en ninguna
invariante transaccional.

**`crear_variante_sku(p_producto_id, p_tipo_sku, p_sku, p_nombre, p_precio, ...)`** /
**`editar_variante_sku(...)`**
*(nuevas)* Roles: ADMIN. Validaciones: `CHK_COLUMNAS_POR_TIPO`,
`TRG_VALIDAR_PRODUCTO_ACTIVO`, unicidad de `SKU`. El precio inicial pasa por
la misma auditoría que `editar_precio` (`CAMBIO_PRECIO`).

**`administrar_catalogo_comercial(p_catalogo, p_accion, p_valores)`**
*(nueva, conceptual)* Roles: ADMIN. Cubre alta/edición/desactivación de
`"TIPOS_PERSONALIZACION"`, `"OPCIONES_PERSONALIZACION"`, `"ALERGENOS"`,
`"TIPOS_ADVERTENCIA"`, `"UNIDADES_MEDIDA"`. Nunca elimina físicamente si hay
uso histórico — solo desactiva.

**`aprobar_receta_personalizada_pedido(p_pedido_detalle_id, p_items)`**
*(nueva)* Roles: ADMIN. Parámetros: línea de pedido, lista de
`{insumo_id, cantidad_requerida, merma_porcentaje}`. Validaciones: el
`PEDIDO_DETALLE` referenciado pertenece a un pedido aún no `CONFIRMADO` (o
según se decida al implementar, ver sección 15). Tablas:
`RECETA_PERSONALIZADA_PEDIDO` (`APROBADO_POR`/`APROBADO_EN` = el `ADMIN`
que ejecuta el RPC, ahora). Es la aprobación en sí misma — no existe un
estado "pendiente" previo en esta tabla.

---

## 8. Restricciones, índices y mecanismo de protección

| Protección | Mecanismo |
|---|---|
| `USUARIOS.ROL_CODIGO` coherente con `CLIENTE_ID` | `CHECK` (misma fila) |
| Columnas exclusivas de INSUMO/PRODUCTO_FINAL, incluido `PRODUCTO_ID` | `CHECK` (misma fila) |
| El tipo usado por inventario, recetas, pedidos, reservas, requerimientos y consumos coincide con `REGISTRO_SKU.TIPO_SKU` | **FK compuesta** `(REGISTRO_SKU_ID, TIPO_SKU)` contra `UNIQUE (ID, TIPO_SKU)` |
| `PRODUCTO_ID` debe referenciar un `"PRODUCTOS"` activo | **Trigger** (depende de otra fila) |
| Auto-referencia, ciclos y más de un nivel en la jerarquía de productos | **Estructural** (dos tablas distintas, sección 3.2) — ya no requiere trigger de ciclos |
| Unicidad de insumo dentro de una receta de catálogo | `UNIQUE (PRODUCTO_FINAL_ID, INSUMO_ID)` |
| Unicidad de insumo dentro de una receta personalizada de pedido | `UNIQUE (PEDIDO_DETALLE_ID, INSUMO_ID)` en `RECETA_PERSONALIZADA_PEDIDO` |
| `MERMA_PORCENTAJE` entre 0 y 100 | `CHECK` |
| `FACTOR_CONVERSION > 0` | `CHECK` |
| `STOCK_MINIMO >= 0` | `CHECK` |
| `ESTADO` de `INVENTARIO_MASTER` coherente con `TIPO_SKU` | `CHECK` (misma fila) |
| Máximo una fila activa de `INVENTARIO_MASTER` por insumo | **Índice único parcial** (`where TIPO_SKU = 'INSUMO'`) |
| Decisión `INSERT` vs. `UPDATE` de inventario sin condición de carrera | **RPC** con lock del SKU estable primero (sección 3.4) |
| `ORIGEN` de pedido limitado a valores válidos | `CHECK` |
| `DESCUENTO_TOTAL >= 0` y `<= SUBTOTAL` | `CHECK` |
| `TOTAL` coherente con sus componentes | `CHECK` |
| `ESTADO` de entrega limitado a valores válidos | `CHECK` |
| Una línea no se repite dentro de la misma entrega | `UNIQUE` |
| Una sola cancelación por pedido | `UNIQUE` |
| `DISPOSICION` limitada a valores válidos | `CHECK` |
| `METODO_PAGO` limitado a valores válidos | `CHECK` |
| No editar campos económicos de `PAGOS`/`REEMBOLSOS` tras crear | **Trigger** |
| Solo transición `PENDIENTE → CONFIRMADO`/`RECHAZADO` | **RPC** + ausencia de política `UPDATE` en RLS |
| `p_modo` de `ajustar_inventario` es una intención válida | **RPC** (parámetro de función, no columna — validado en el cuerpo) |
| No reservar/asignar/ajustar/consumir por encima de la disponibilidad | **RPC** con `FOR UPDATE` y recálculo post-lock (depende de agregados de otra tabla) |
| Origen de consumo (`PEDIDO`/`ANTICIPADO`) coherente con `REQUERIMIENTO_PRODUCCION_ID` | `CHECK` (misma fila) |
| No escribir tablas de auditoría/negocio directamente desde el frontend | RLS sin `INSERT`/`UPDATE` para clientes; solo vía RPC `security definer` |
| Una advertencia debe reconocerse individualmente antes de confirmar | `"ADVERTENCIAS_PEDIDO"` + RPC `reconocer_advertencia_pedido`; `confirmar_pedido` verifica la base |
| Stamps obligatorios en toda escritura | Columnas `NOT NULL` + contexto confiable del RPC + trigger genérico `BEFORE INSERT OR UPDATE` |
| Código RFB único, activo y tipificado | PK identity + `UNIQUE (RESOURCE_CODE)` + `CHECK (RESOURCE_TYPE)` + validación en helper/RPC |

PostgreSQL crea automáticamente índices para primary keys y restricciones
`UNIQUE`; **no crea automáticamente índices sobre columnas foreign key**.
Cada FK se evalúa e indexa explícitamente según joins, borrados y consultas
operacionales.

**Índices explícitos principales:**

`"PEDIDOS"("ESTADO")`, `"PEDIDOS"("CLIENTE_ID","ESTADO")`,
`"REGISTRO_SKU"("PRODUCTO_ID")`, `"INVENTARIO_MASTER"("REGISTRO_SKU_ID","TIPO_SKU")`,
`"RESERVA_INVENTARIO"("REGISTRO_SKU_ID","ESTADO")`,
`"ASIGNACION_INVENTARIO_PEDIDO"("INVENTARIO_MASTER_ID","ESTADO")`,
`"ASIGNACION_INVENTARIO_PEDIDO"("PEDIDO_DETALLE_ID")`,
`"REQUERIMIENTO_PRODUCCION"("PEDIDO_DETALLE_ID","ESTADO")`,
`"DETALLE_CONSUMO_PRODUCCION"("INSUMO_ID")`,
`"DETALLE_CONSUMO_PRODUCCION"("PRODUCCION_ID")`,
`"PRODUCCIONES"("REQUERIMIENTO_PRODUCCION_ID")`,
`"ADVERTENCIAS_PEDIDO"("PEDIDO_DETALLE_ID","RECONOCIDA_EN")`,
`"PAGOS"("PEDIDO_ID","ESTADO")`, `"REEMBOLSOS"("PEDIDO_ID","ESTADO")`,
`"HISTORIAL_TRANSACCIONES"("TIPO_ENTIDAD","ENTIDAD_ID","CREADO_EN")`,
`"HISTORIAL_ESTADOS_PEDIDO"("PEDIDO_ID","CREADO_EN")`,
`"OPCIONES_PERSONALIZACION"("TIPO_PERSONALIZACION_CODIGO")`.

---

## 9. Seguridad

Sin cambios respecto a v1.4: ninguna tabla que participe en dinero,
inventario o auditoría tiene política RLS de escritura directa para
`ADMIN`/`CLIENTE` — toda escritura de negocio pasa por una función `security
definer` que valida el rol explícitamente. Se extiende el mismo principio a
`"PRODUCTOS"`, `"REGISTRO_SKU"`, `"RECETA_PERSONALIZADA_PEDIDO"` y los
catálogos comerciales de la sección 3.8.

La auditoría de stamps no sustituye RLS ni autorización de dominio. El
frontend no puede enviar valores autoritativos para `"USER_STAMP"` o
`"PROCESS_STAMP"`. Toda función que escriba valida primero sesión, usuario
activo, rol y estado de negocio; después activa el contexto transaccional de
stamps.

### 9.1 Concurrencia — protocolo obligatorio del Corte 3b

El protocolo completo y autocontenido está en la sección 17.1. Un error de
**serialización transitorio** (el que Postgres puede
seguir señalando en escenarios no cubiertos por el orden determinístico —
un bug de implementación, no del diseño) puede reintentarse una vez, de
forma automática y transparente; `STOCK_INSUFICIENTE` **nunca** se
reintenta automáticamente — es un resultado de negocio válido (no alcanza
el inventario), no un error técnico, y debe llegar a la UI como tal.

---

## 10. Caché y estado local

Sin cambios.

---

## 11. Roadmap por cortes verticales

| # | Corte | Contenido | Depende de |
|---|---|---|---|
| 0 | Fundación | Auth, `"RESOURCE_FILE_BASE"` + seeds RFB, `"CLIENTES"`/`"USUARIOS"` con coherencia rol↔cliente, RLS de prueba | — |
| 1 | Insumos | `"REGISTRO_SKU"` (INSUMO), `"UNIDADES_MEDIDA"`, `"INVENTARIO_MASTER"` con índice único por insumo, `"V_DISPONIBILIDAD_INSUMO"` corregida, `registrar_compra_insumo`, `ajustar_inventario` con modo explícito | 0 |
| 2 | Catálogo, variantes y personalización | `"PRODUCTOS"`, `"REGISTRO_SKU"` (PRODUCTO_FINAL), `"REGISTRO_SKU_RECETA"`, catálogos comerciales (`"TIPOS_PERSONALIZACION"`, `"OPCIONES_PERSONALIZACION"`, `"ALERGENOS"`, `"TIPOS_ADVERTENCIA"`), `editar_precio`, `editar_receta`, `crear_producto`/`crear_variante_sku`, `administrar_catalogo_comercial` | 0, 1 |
| 3a | Creación de pedido | `"PEDIDOS"`, `"PEDIDO_DETALLE"`, `"PEDIDO_DETALLE_PERSONALIZACION"`, `"HISTORIAL_ESTADOS_PEDIDO"`, `crear_pedido` | 2 |
| 3b | Confirmación con reserva/asignación | `"REQUERIMIENTO_PRODUCCION"`, `"RESERVA_INVENTARIO"`, `"ASIGNACION_INVENTARIO_PEDIDO"`, `"RECETA_PERSONALIZADA_PEDIDO"`, `"ADVERTENCIAS_PEDIDO"`, `aprobar_receta_personalizada_pedido`, `reconocer_advertencia_pedido`, `confirmar_pedido`, `actualizar_pedido_antes_de_produccion`, `cancelar_pedido` pre-producción, **protocolo completo de concurrencia (sección 17.1) y sus pruebas obligatorias** | 1, 2, 3a |
| 4 | Producción y consumo | `iniciar_produccion`, `producir_stock_anticipado`, `"PRODUCCIONES"`, `"DETALLE_CONSUMO_PRODUCCION"`, `marcar_listo`, `cancelar_pedido` post-producción | 3b |
| 5 | Entregas parciales | `"ENTREGAS"`, `"ENTREGA_DETALLE"` | 4 |
| 6 | Pagos y conciliación | `"PAGOS"`, `"REEMBOLSOS"`, `"V_SALDO_PEDIDO"` | 3a |
| 7 | Reportes/dashboard | Ventas, producción requerida, inventario vs. mínimo | 1, 2, 3b, 5, 6 |
| 8 | Duplicar pedido | Pre-llenar `crear_pedido` desde un pedido pasado | 3a |

**Verificación de consistencia:** el orden de creación del DDL (sección
12.1) sigue sin crear ninguna tabla antes que las que referencia —
`"PRODUCTOS"` se crea antes que `"REGISTRO_SKU"` (que ahora depende de
ella); `"RECETA_PERSONALIZADA_PEDIDO"` y
`"PEDIDO_DETALLE_PERSONALIZACION"` se crean después de `"PEDIDO_DETALLE"` y
de los catálogos comerciales, de los que dependen;
`"DETALLE_CONSUMO_PRODUCCION"` se crea después de `"REQUERIMIENTO_PRODUCCION"`.
Ningún corte del roadmap usa una tabla antes del corte que la introduce.

MVP operacional mínimo = cortes 0–6, sin cambios. **Primer corte
recomendado: Corte 0** (ya tiene GO preparado en `GO_CORTE_0.md`).

---

## 12. DDL — convenciones

### 12.1 Orden de creación

`"RESOURCE_FILE_BASE"` → `"ROLES"` → `"CLIENTES"` → `"PRODUCTOS"` → `"UNIDADES_MEDIDA"` →
`"REGISTRO_SKU"` → `"REGISTRO_SKU_RECETA"` → `"TIPOS_PERSONALIZACION"` →
`"ALERGENOS"` → `"TIPOS_ADVERTENCIA"` → `"OPCIONES_PERSONALIZACION"` →
`"OPCION_PERSONALIZACION_ALERGENO"` →
`"ESTADOS_INVENTARIO_PRODUCTO"` → `"INVENTARIO_MASTER"` →
`"ESTADOS_PEDIDO"` → `"ESTADOS_PAGO"` → `"TIPOS_TRANSACCION"` →
`"USUARIOS"` → `"PEDIDOS"` → `"HISTORIAL_ESTADOS_PEDIDO"` →
`"PEDIDO_DETALLE"` → `"PEDIDO_DETALLE_PERSONALIZACION"` →
`"ADVERTENCIAS_PEDIDO"` → `"RECETA_PERSONALIZADA_PEDIDO"` →
`"ASIGNACION_INVENTARIO_PEDIDO"` →
`"REQUERIMIENTO_PRODUCCION"` → `"RESERVA_INVENTARIO"` →
`"PRODUCCIONES"` → `"DETALLE_CONSUMO_PRODUCCION"` →
`"ENTREGAS"` → `"ENTREGA_DETALLE"` →
`"PAGOS"` → `"REEMBOLSOS"` → `"CANCELACION_PEDIDO"` →
`"HISTORIAL_TRANSACCIONES"`.

### 12.2 Precisión numérica, moneda, zona horaria, eliminaciones

Sin cambios: `numeric(12,0)` para CLP, `timestamptz` en toda columna
temporal, render en `America/Santiago`. `"INVENTARIO_MASTER"` sigue siendo
la única tabla con eliminación física rutinaria por diseño. Los catálogos
comerciales (sección 3.8) se desactivan, nunca se eliminan si tienen uso
histórico.

### 12.3 Convención universal de stamps

Todas las tablas creadas por cualquier corte incluyen físicamente estas
columnas, aunque los fragmentos DDL conceptuales anteriores las omitan para
evitar repetición:

```sql
"USER_STAMP"      text not null,
"PROCESS_STAMP"   text not null,
"DATE_TIME_STAMP" timestamptz not null
```

“Todas las tablas” significa todas las tablas propiedad de Cookie Compass en
sus esquemas de aplicación. No se alteran tablas internas administradas por
Supabase (`auth`, `storage`, extensiones o metadatos de plataforma); sus
eventos se relacionan con las tablas de aplicación mediante `auth.uid()`.

Estos tres nombres permanecen en inglés exactamente como están escritos. Son
las únicas columnas inglesas permitidas fuera de la tabla técnica
`"RESOURCE_FILE_BASE"`, cuyas columnas también permanecen en inglés por
decisión explícita de la sección 2.1.

| Columna | Contenido |
|---|---|
| `"USER_STAMP"` | `AUTH:<auth.uid()>` para usuario autenticado o identidad controlada `SYSTEM:<proceso>` cuando no existe usuario humano |
| `"PROCESS_STAMP"` | Código estable del procedimiento, por ejemplo `confirmar_pedido:v1` |
| `"DATE_TIME_STAMP"` | Hora efectiva de cada escritura mediante `clock_timestamp()` |

PostgreSQL no implementa `GETDATE()`; esa función pertenece a otros motores.
Se usa `clock_timestamp()` porque captura la hora real de cada modificación,
incluso dentro de una transacción larga. `timestamptz` se presenta en
`America/Santiago`.

`CREADO_EN`, `ACTUALIZADO_EN` y las fechas de dominio continúan existiendo
cuando aportan semántica. Los stamps responden quién/proceso/cuándo realizó
la última escritura; no reemplazan fechas como pago, entrega, aprobación o
cancelación.

#### Captura segura

1. El RPC obtiene la identidad humana desde `auth.uid()`; no acepta
   `USER_STAMP` desde el frontend.
2. El RPC establece internamente un identificador constante de proceso; no
   acepta `PROCESS_STAMP` libre desde la UI.
3. Un trigger común `BEFORE INSERT OR UPDATE` asigna los tres stamps y falla
   si falta identidad o proceso.
4. Migración, seed, bootstrap, webhook o tarea interna usan una identidad
   explícita como `SYSTEM:MIGRATION`, `SYSTEM:BOOTSTRAP` o `SYSTEM:WEBHOOK`.
   Solo funciones y roles privilegiados pueden establecerla.
5. Toda actualización refresca los tres valores. Una tabla append-only solo
   los establece al insertar.
6. Las funciones `SECURITY DEFINER` califican esquemas, endurecen
   `search_path` y validan sesión/rol antes de activar el contexto.

Patrón conceptual:

```sql
-- Dentro del RPC, después de validar sesión y rol:
perform set_config('app.user_stamp', 'AUTH:' || auth.uid()::text, true);
perform set_config('app.process_stamp', 'confirmar_pedido:v1', true);

-- Trigger común:
new."USER_STAMP" := current_setting('app.user_stamp', true);
new."PROCESS_STAMP" := current_setting('app.process_stamp', true);
new."DATE_TIME_STAMP" := clock_timestamp();
```

La implementación rechaza valores nulos o vacíos. El tercer parámetro `true`
de `set_config` limita el contexto a la transacción. Las pruebas deben
demostrar que el usuario no puede sobrescribir stamps mediante payload,
INSERT o UPDATE directo.

### 12.4 Trabajo futuro explícitamente diferido

Lotes/vencimiento y `"LOTES_INVENTARIO"` con política FEFO — sin cambios
respecto a v1.4, fuera del MVP. Al implementarse, reemplazará
conscientemente la restricción de "una sola fila activa por insumo"
(sección 3.4).

---

## 13. Decisiones que quedan cerradas en esta versión

- `"INVENTARIO_MASTER"."PEDIDO_ID"`: eliminado permanentemente.
- Versionado formal de receta para el MVP: no se incorpora — se resuelve
  con `"RESERVA_INVENTARIO"` + `"DETALLE_CONSUMO_PRODUCCION"` +
  `"HISTORIAL_TRANSACCIONES"`.
- Límite de jerarquía de productos: un solo nivel, estructural (`"PRODUCTOS"`
  / `"REGISTRO_SKU"`), ya no depende de un trigger de ciclos.
- Naturaleza del producto conceptual: `"PRODUCTOS"` es agrupador puro, sin
  precio ni receta propios.
- Disponibilidad agregada por SKU de insumo: `"V_DISPONIBILIDAD_INSUMO"`
  corregida.
- Una fila activa por SKU de insumo durante el MVP: índice único parcial.
- Lotes/vencimiento fuera del MVP: sin cambios respecto a v1.4.
- Catálogos comerciales configurables: esquema definido (sección 3.8).
- Tratamiento de personalizaciones excepcionales: tres caminos formalizados
  (sección 3.7).
- `"REGISTRO_SKU"."RECETA_TIPO"`: eliminado (contradicción detectada y
  corregida, sección 0).

## 14. Decisiones que bloquean el Corte 0

**Ninguna.**

## 15. Decisiones que siguen abiertas

**Ninguna decisión arquitectónica bloqueante.** El reconocimiento de
advertencias queda cerrado como registro individual por línea en
`"ADVERTENCIAS_PEDIDO"`, ejecutado por RPC y verificado desde la base.

---

## 16. Criterios de aceptación del MVP (cortes 0–6)

Sin cambios de fondo respecto a v1.4, agregando:

- El criterio de `"V_DISPONIBILIDAD_INSUMO"` de la sección 3.5 (2.000 +
  3.000 físico, 4.000 reservado → 1.000 disponible) pasa antes de cerrar el
  Corte 1.
- Un segundo intento de `registrar_compra_insumo`/`ajustar_inventario`
  concurrente sobre el mismo insumo sin fila previa: exactamente una
  transacción crea la fila, la otra la actualiza — nunca dos filas para el
  mismo `REGISTRO_SKU_ID` de tipo `INSUMO` (verificable contra el índice
  único parcial).
- `ajustar_inventario` con `APLICAR_DIFERENCIA` negativo que dejaría
  `CANTIDAD_FISICA < 0` falla completa, sin fila modificada.
- Insertar un `INSUMO` con `PRODUCTO_ID` no nulo, o un `PRODUCTO_FINAL` sin
  `PRODUCTO_ID`, falla (`CHK_COLUMNAS_POR_TIPO`) antes de cerrar el Corte 2.
- Asignar como padre un `"PRODUCTOS"` inactivo falla
  (`TRG_VALIDAR_PRODUCTO_ACTIVO`) antes de cerrar el Corte 2.
- Una línea de pedido con `"RECETA_PERSONALIZADA_PEDIDO"` usa esa receta al
  confirmar, no la de catálogo — verificable comparando los insumos
  reservados contra ambas fuentes con valores deliberadamente distintos en
  la prueba.

---

## 17. Riesgos

### 17.1 Concurrencia en `confirmar_pedido` — protocolo obligatorio (Corte 3b)

Este protocolo es obligatorio para `confirmar_pedido` y para cualquier RPC
que compita por el mismo inventario. No basta con usar `FOR UPDATE` de forma
aislada.

**Orden global de adquisición de locks:**

1. Bloquear la fila de `"PEDIDOS"` cuando la operación pertenezca a un
   pedido.
2. Determinar el conjunto completo de SKU involucrados.
3. Bloquear las filas estables de `"REGISTRO_SKU"` en orden ascendente por
   `"ID"`. Este es el punto de serialización incluso cuando todavía no existe
   una fila física en `"INVENTARIO_MASTER"`.
4. Bloquear las filas físicas involucradas de `"INVENTARIO_MASTER"` en orden
   ascendente por `"ID"`.
5. Todos los RPC de compras, ajustes, reserva, asignación, consumo,
   cancelación y entrega deben respetar el mismo orden relativo de recursos.

**Regla post-lock:** después de adquirir todos los locks, el RPC ejecuta una
consulta nueva que recalcula existencia física, reservas activas,
asignaciones activas y disponibilidad. No se usa como autoridad una vista o
consulta leída antes de bloquear. Esto evita snapshots obsoletos mientras
otra transacción estaba confirmando.

**Atomicidad y fallos:**

- asignaciones, reservas, consumos, historial y cambio de estado ocurren en
  una sola transacción;
- si falta stock, la operación lanza `STOCK_INSUFICIENTE` y hace rollback
  completo;
- no quedan encabezados, reservas, asignaciones ni historial parcial;
- `STOCK_INSUFICIENTE` no se reintenta automáticamente porque es un resultado
  de negocio;
- un error transitorio de serialización puede reintentarse una sola vez con
  la misma intención e idempotency key cuando el RPC la requiera;
- se configura `lock_timeout` para evitar esperas indefinidas;
- deadlocks y timeouts se registran con contexto técnico y se traducen a un
  mensaje seguro para la UI.

Bloquear únicamente `"INVENTARIO_MASTER"` es insuficiente cuando no existe
una fila física, cuando las reservas viven en otra tabla o cuando una lectura
comenzó antes del commit rival. El lock estable por SKU y el recálculo
posterior son partes inseparables del protocolo.

**Pruebas concurrentes obligatorias antes de cerrar el Corte 3b:**

1. Dos conexiones confirman pedidos que compiten por el mismo producto final
   y los mismos insumos. Exactamente una obtiene los recursos; la otra espera
   y luego falla íntegramente por disponibilidad o reintenta solo ante un
   error técnico permitido.
2. Dos conexiones compiten por un SKU sin fila física previa. El lock sobre
   `"REGISTRO_SKU"` impide compromisos o inserts incompatibles.
3. Al terminar, se verifica que no exista sobreventa, stock negativo,
   reserva parcial, asignación parcial ni deadlock no controlado.
4. Las pruebas usan conexiones PostgreSQL reales y barreras de
   sincronización; no se simula concurrencia mediante llamadas secuenciales.

### 17.2 Otros riesgos

- Migración del precio plano del prototipo → primera fila de
  `"HISTORIAL_TRANSACCIONES"` (`CAMBIO_PRECIO`).
- Riesgo de cumplimiento tributario — diferido a otra fase.
- Costo operativo de identificadores citados en mayúscula — mitigado
  exigiendo que todo acceso pase por RPC o por un cliente tipado generado.
- Las advertencias de alérgenos dependen de configuración correcta y de que
  el ADMIN reconozca cada fila; se mitiga con snapshots, RPC individual,
  bloqueo de confirmación y pruebas negativas.

---

## 18. Fuentes de este documento

v1.0–v1.4.1: ver secciones de registro de cambios de versiones anteriores.
v1.5 consolida las decisiones definitivas de diseño para los Cortes 1 y 2:
disponibilidad de insumo corregida y agregada correctamente, una fila activa
por insumo, modos explícitos de ajuste de inventario, prohibición formal de
stock negativo, conversión de unidad formalizada, eliminación definitiva de
`INVENTARIO_MASTER.PEDIDO_ID`, `"DETALLE_CONSUMO_PRODUCCION"` en reemplazo
de versionado de receta, separación de `"PRODUCTOS"`/`"REGISTRO_SKU"` en
reemplazo de `PRODUCTO_PADRE_ID`, tres caminos de personalización
excepcional, catálogos comerciales configurables, y eliminación de
`"RECETA_TIPO"` (contradicción detectada durante esta revisión). No se
implementó código de ningún corte.
