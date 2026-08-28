# Encuesta de descubrimiento del negocio — COMPLETADA

> Resolución consolidada en `MASTER.md` v1.7. Este archivo conserva la
> evidencia de descubrimiento; no reemplaza al documento maestro.

**Título del formulario:** Cookie Compass — Cómo funciona el negocio hoy

**Descripción del formulario:**
Antes de programar la app se revisó para entender bien cómo se trabaja hoy, para que el
sistema se ajuste a la realidad del negocio y no al revés. Esta encuesta fue completada y las respuestas están abajos, y deberán considerarse para el diseño/desarrollo de la app.

---

## Sección 0 — Sobre ti

**P0.1 — Nombre** Jose Lopez
Tipo: *Administrador*

**P0.2 — ¿Quién más toma decisiones o pedidos en el negocio además de ti?**
Tipo: *Edbel Lopez, Ed Lopez*

---

## Sección 1 — Pedidos

**P1.1 — ¿Quién puede crear un pedido hoy?** `[obligatoria]`
Tipo: *Casillas de verificación* (selección múltiple)
Opciones:

- Otro (especificar): el cliente desde la UI principal con cuenta usuario-cliente, el administrador con cuenta usuario-administrador, en el futuro por WhatsApp o email definido.

**P1.2 — ¿Un pedido puede modificarse después de que ya lo confirmaste?**
Tipo: *Opción múltiple*
Opciones:

- Sí, pero solo si no ha empezado la producción

**P1.3 — Si un pedido confirmado cambia (cantidad, producto, fecha), ¿eso te obliga a recalcular el precio?**
Tipo: *Respuesta corta*

* Si cambia la cantidad sí, si solo cambia la fecha no.

**P1.4 — ¿Un pedido puede entregarse parcialmente (por ejemplo, entregar la mitad ahora y el resto después)?**
Tipo: *Opción múltiple*
Opciones:

- Sí, es algo que pasa

**P1.5 — ¿Se puede cancelar un pedido después de que ya empezaste a producirlo?**
Tipo: *Opción múltiple*
Opciones:

- Sí, y lo que se alcanzó a producir se pierde o se regala
- Sí, y se intenta vender a otro cliente

**P1.6 — ¿Existen pedidos urgentes (para el mismo día o al día siguiente)?**
Tipo: *Opción múltiple*
Opciones:

- Sí, son frecuentes

**P1.7 — ¿Hay clientes que hacen el mismo pedido de forma recurrente (semanal, quincenal)?**
Tipo: *Opción múltiple*
Opciones:

- Sí, varios clientes

**P1.8 — ¿Un mismo pedido puede tener varias fechas de entrega distintas (por ejemplo, entregas parciales programadas)?**
Tipo: *Opción múltiple*
Opciones:

- Sí

**P1.9 — ¿La dirección de entrega de un pedido puede ser distinta a la dirección habitual del cliente?**
Tipo: *Opción múltiple*
Opciones:

- Rara vez

**P1.10 — ¿Existe la opción de retiro en el local en lugar de despacho a domicilio?**
Tipo: *Opción múltiple*
Opciones:

- Se está evaluando

**P1.11 — ¿Cuáles son las personalizaciones más comunes que piden los clientes?**
Tipo: *Párrafo*

* Sin azúcar, con mensaje escrito, tamaño más grande, sin frutos secos, otro sabor, frío, otros

---

## Sección 2 — Productos y precios

**P2.1 — ¿Tus productos tienen variantes (tamaño, sabor, relleno, decoración)?** `[obligatoria]`
Tipo: *Opción múltiple*
Opciones:

- Sí, varias variantes por producto

**P2.2 — Si tienen variantes, ¿esas variantes cambian el precio, la receta (ingredientes), o ambas cosas?**
Tipo: *Casillas de verificación*
Opciones:

- Cambian el precio

**P2.3 — Describe un caso real de producto muy personalizado que hayas vendido últimamente**
Tipo: *Párrafo*

* Se han hecho queques de chocolate, grande, sin azúcar, con decoración especial, a pedido del cliente, pero siempre predomina la receta original

**P2.4 — ¿Alguna vez cobras un precio distinto al de lista, negociado directamente con el cliente?**
Tipo: *Opción múltiple*
Opciones:

- Sí, rara vez

**P2.5 — ¿Das descuentos?**
Tipo: *Casillas de verificación*
Opciones:

- Solo sobre el total del pedido
- Depende del cliente (frecuencia, cantidad, etc.)

**P2.6 — ¿Cobras algún impuesto o recargo formal sobre tus ventas?**
Tipo: *Opción múltiple*
Opciones:

- No estoy seguro

**P2.7 — ¿En qué moneda vendes realmente?**
Tipo: *Respuesta corta*

* Peso chileno

**P2.8 — ¿Necesitas llevar un historial de cuándo y cómo cambiaron tus precios en el tiempo?**
Tipo: *Opción múltiple*
Opciones:

- Sí, me importa saber qué precio tenía cada producto en el pasado

**P2.9 — Cuando un cliente pide algo muy personalizado que no está en tu catálogo, ¿cómo lo registras hoy?**
Tipo: *Opción múltiple*
Opciones:

- Como un producto nuevo en mi lista sólo si el pedido en sí es recurrente
- Como una nota o comentario dentro del pedido si se trata de ocaciones especiales

---

## Sección 3 — Pagos

**P3.1 — ¿Aceptas abonos (pagos parciales) por un pedido?** `[obligatoria]`
Tipo: *Opción múltiple*
Opciones:

- Sí, en casos puntuales

**P3.2 — ¿Puedes entregar un pedido aunque quede saldo pendiente de pago?**
Tipo: *Opción múltiple*
Opciones:

- Depende del cliente (confianza)

**P3.3 — Cuando un cliente te paga por transferencia, ¿en qué momento consideras que el pago está confirmado?**
Tipo: *Opción múltiple*
Opciones:

- Apenas el cliente me muestra el comprobante
- Cuando reviso el estado de cuenta más tarde (no en el momento)

**P3.4 — ¿Quién confirma que un pago se recibió correctamente?**
Tipo: *Respuesta corta*

* Jose Lopez, Edbel Lopez

**P3.5 — ¿Has tenido que hacer devoluciones parciales de dinero a un cliente?**
Tipo: *Opción múltiple*
Opciones:

- Sí, ha pasado, raras ocasiones

**P3.6 — ¿Necesitas que el sistema permita adjuntar una foto/comprobante de pago?**
Tipo: *Opción múltiple*
Opciones:

- No es necesario
- En el futuro quizá

**P3.7 — ¿Qué medios de pago usan tus clientes?**
Tipo: *Casillas de verificación*
Opciones:

- Efectivo
- Transferencia bancaria

**P3.8 — ¿Necesitas un cierre de caja diario o una conciliación de lo vendido vs. lo cobrado?**
Tipo: *Opción múltiple*
Opciones:

- Sí, semanal

---

## Sección 4 — Producción e inventario

**P4.1 — Para la primera versión del sistema, ¿el control de inventario de materias primas es imprescindible, o puede esperar a una segunda etapa?** `[obligatoria]`
Tipo: *Opción múltiple*
Opciones:

- Es imprescindible desde el día uno

**P4.2 — ¿En qué momento del proceso descuentas materia prima de tu inventario mentalmente?**
Tipo: *Opción múltiple*
Opciones:

- Cuando confirmo el pedido (antes de producir)

**P4.3 — ¿"Reservas" materia prima para un pedido confirmado (aunque no la hayas consumido aún), para no comprometerla en otro pedido?**
Tipo: *Opción múltiple*
Opciones:

- Sí

**P4.4 — ¿Cómo registras hoy tus compras de ingredientes, los desperdicios, o los ajustes de inventario?**
Tipo: *Párrafo*

* Anoto en un cuaderno o en una hoja excel, sería ideal que pueda registrarlo en la app

**P4.5 — Para cada ingrediente principal que usas, ¿en qué unidad lo compras y en qué unidad lo usas en tus recetas?**
Tipo: *Párrafo*

* Compro las materias primas en KG, pero la receta usa gramos

**P4.6 — ¿Tus recetas cambian con el tiempo (ajustas cantidades, cambias ingredientes)?**
Tipo: *Opción múltiple*
Opciones:

- Rara vez

**P4.7 — ¿Necesitas saber de qué lote o con qué fecha de vencimiento es cada ingrediente que usas?**
Tipo: *Opción múltiple*
Opciones:

- Sí, es importante para mí, pero opcional

---

## Sección final — Cierre

**PF.1 — ¿Hay algo del negocio que no te pregunté y que crees que es importante que sepamos antes de construir el sistema?**
Tipo: *Párrafo*

* Nada en particular

**PF.2 — ¿Prefieres conversar esto en persona además de responder por escrito?**
Tipo: *Opción múltiple*
Opciones:

- No es necesario, con esto basta

## Notas para ti (no van en el formulario)

- Las respuestas de **P1.11, P2.3, P4.4 y P4.5** son las más críticas para el
  modelo de datos — son las que van a determinar si `products` necesita una
  tabla de variantes (`product_variants`) o si las personalizaciones se
  resuelven con notas de texto en la línea del pedido.
- Si P2.1/P2.2 muestran que las variantes cambian tanto precio como receta de
  forma estructurada (no solo texto libre), hay que extender el modelo de la
  sección 4.3/4.5 del `MASTER.md` con una tabla `product_variants` antes de
  cerrar el esquema — avísame cuando tengas las respuestas y ajusto el
  documento maestro.
- Las respuestas de la Sección 4 (producción/inventario) determinan si esa
  fase se mantiene como Fase 2 del roadmap o si necesita adelantarse.

---

## Resolución de la encuesta contra MASTER.md v1.2 (2026-07-30)

Fase 0 cerrada, sin decisiones bloqueantes ni diferibles pendientes. Detalle
completo en `MASTER.md` secciones 0, 1.2, 4 y 12.

**Resueltas sin ambigüedad** (incorporadas directamente al modelo de datos):
P1.1–P1.4, P1.6–P1.9, P1.11, P2.1–P2.5, P2.7–P2.9, P3.1, P3.2, P3.5, P3.7,
P3.8, P4.1–P4.6.

**Resueltas por interpretación razonable de respuestas múltiples**
(`MASTER.md` sección 6): cancelación en producción → disposición elegida caso
a caso (desperdicio/donación/reventa); confirmación de transferencia → flujo
de dos pasos pendiente→confirmado; inventario → reserva al confirmar, consumo
al iniciar producción.

**Resueltas por respuesta directa de Ed (2026-07-30), ya incorporadas a
`MASTER.md` v1.2:**
1. Variantes de tamaño y receta → no aplica; cada producto (incluidos los
   personalizados) declara su propia lista de insumos, sin escalado.
2. Roles técnicos → solo dos: `ADMIN` y `CLIENTE`. José, Edbel y Ed son
   `ADMIN`.
3–5. Autoridad para negociar precio, reembolsos y confirmar pagos → José y
   Edbel en la práctica operativa (documentado, no restringido técnicamente
   entre administradores — ver `MASTER.md` sección 1.2).
6. Autocancelación de cliente → no en el MVP; el cliente lo solicita, el
   `ADMIN` ejecuta la cancelación.
7. Registro de compras/ajustes de inventario → José, Edbel y Ed (todos
   `ADMIN`).

**Ajustado fuera del MVP original:** lote/vencimiento (P4.7) **sí** se
incluye ahora, en forma limitada — cálculo automático para producto final,
captura manual opcional para insumos (`MASTER.md` sección 3.4).

**Sigue fuera del MVP, sin cambios:** retiro en local (P1.10, aún en
evaluación por el propio negocio), cálculo/emisión tributaria (P2.6, requiere
definición contable primero), adjuntos de comprobante de pago (P3.6).

**Segunda ronda de notas de Ed (2026-07-30) — incorporada en `MASTER.md`
v1.3:** nombres de tabla/columna en mayúscula; `REGISTRO_SKU` como maestro
único de artículos (reemplaza `insumos`/`producto_final` separados);
`INVENTARIO_MASTER` pasa a ser un registro de cantidades que se borra en
cero, no un catálogo; `RESERVA_INVENTARIO` vuelve a ser tabla propia (con
autorización de Ed, por una razón técnica concreta: la receta es mutable y
auditada, así que la cantidad reservada no se puede recalcular de forma
segura después); sí puede existir producto final sin pedido asociado (stock
anticipado, nueva función `PRODUCIR_STOCK_ANTICIPADO`); `HISTORIAL_TRANSACCIONES`
acotado a exactamente 7 tipos de transacción.

**Tercera ronda de notas de Ed (2026-07-30) — incorporada en `MASTER.md`
v1.4, corrección de 7 defectos estructurales:**
1. Nomenclatura queda decidida: tablas/columnas en español, mayúscula,
   identificadores citados (visual, no de seguridad); funciones/RPC en
   español, `snake_case`, minúscula, sin comillas.
2. El Corte 0 incluye la estructura mínima de `CLIENTES`; se agrega
   restricción que obliga a todo `CLIENTE` a tener `CLIENTE_ID` y a todo
   `ADMIN` a no tenerlo.
3. Se corrige un bug real de duplicación en `V_SALDO_PEDIDO` (unir pagos y
   reembolsos directamente multiplicaba montos); se agrega criterio de
   prueba explícito.
4. Se formaliza la inmutabilidad de pagos/reembolsos con tres capas: RLS sin
   `UPDATE` directo, RPC como único camino de transición, y trigger que
   bloquea la edición de campos económicos.
5–7. Se agregan `REQUERIMIENTO_PRODUCCION` (trazabilidad de reserva por
   línea de pedido) y `ASIGNACION_INVENTARIO_PEDIDO` (reemplaza
   `INVENTARIO_MASTER.PEDIDO_ID`, evita una segunda fuente de verdad); la
   disponibilidad de insumo y de producto final pasa a calcularse por vista
   en vez de un contador cacheado.
8. SKU sigue siendo texto libre que escribe el `ADMIN`, nunca generado por
   el sistema; se agrega `PRODUCTO_PADRE_ID` para agrupar variantes bajo un
   producto conceptual (ej. "Queque de chocolate" con variantes "pequeño",
   "grande", "sin azúcar", cada una con su propio SKU/precio/receta).
9. Cambios de precio y receta quedan exclusivamente detrás de RPC
   (`editar_precio`/`editar_receta`); no se incorpora versión explícita de
   receta (justificación en `MASTER.md` sección 3.2).
10. Se agregó una tabla completa de restricciones e índices con su
    mecanismo exacto (constraint, índice, RPC o trigger) en `MASTER.md`
    sección 8.
11. Lote y vencimiento se eliminan por completo del MVP (ya no es un punto
    abierto ambiguo); queda documentado como trabajo futuro.
12. Se agrega `HISTORIAL_ESTADOS_PEDIDO` como bitácora inmutable específica
    de transiciones de estado del pedido, separada de los 7 tipos genéricos
    de `HISTORIAL_TRANSACCIONES`.

Adicionalmente, se restauró `actualizar_pedido_antes_de_produccion` (P1.2,
P1.3), que se había perdido en la reescritura de v1.3 sin que mediara una
decisión explícita de eliminarla.

**Ninguna decisión bloquea el Corte 0** (`MASTER.md` sección 14). Quedan tres
decisiones de esta ronda para confirmar antes del corte correspondiente, no
bloqueantes (`MASTER.md` sección 15): si `INVENTARIO_MASTER.PEDIDO_ID` se
elimina por completo o se mantiene como dato derivado de conveniencia (antes
del Corte 3b); no incorporar versión explícita de receta (antes del Corte 2);
`PRODUCTO_PADRE_ID` limitado a un solo nivel de agrupación (antes del
Corte 2).

**Cuarta ronda de notas de Ed (2026-07-30) — consolidación de Cortes 1 y 2,
incorporada en `MASTER.md` v1.5. Cierra las tres decisiones que quedaban
abiertas arriba, más seis nuevas:**

*Corte 1:* `V_DISPONIBILIDAD_INSUMO` corregida (partía de
`INVENTARIO_MASTER` en vez de `REGISTRO_SKU`, mismo tipo de bug que se había
corregido en `V_SALDO_PEDIDO`); máximo una fila activa de inventario por SKU
de insumo (índice único parcial); `ajustar_inventario` formalizado con dos
modos explícitos (`FIJAR_CANTIDAD`/`APLICAR_DIFERENCIA`); prohibición de
stock negativo como invariante explícita; conversión de unidad de compra a
unidad base formalizada con política de redondeo.

*Corte 2:* `INVENTARIO_MASTER.PEDIDO_ID` eliminado permanentemente (cerrado,
ya no es "a evaluar"); no se incorpora versionado de receta — en su lugar,
`DETALLE_CONSUMO_PRODUCCION` audita el consumo real de cada producción;
`PRODUCTO_PADRE_ID` se reemplaza por dos tablas separadas (`PRODUCTOS`
agrupador conceptual + `REGISTRO_SKU` variante vendible), lo que vuelve
estructuralmente imposible la mayoría de los casos que antes requerían un
trigger de validación; se formalizan tres caminos de personalización
excepcional (variante permanente, nota sin impacto productivo, receta
snapshot con impacto productivo vía `RECETA_PERSONALIZADA_PEDIDO`); se
agregan catálogos comerciales configurables (`TIPOS_PERSONALIZACION`,
`OPCIONES_PERSONALIZACION`, `ALERGENOS`, `TIPOS_ADVERTENCIA`,
`UNIDADES_MEDIDA`), explícitamente distintos de los catálogos técnicos que
siguen fijos por código.

**Contradicción detectada durante esta revisión (no pedida explícitamente,
reportada igual):** `REGISTRO_SKU.RECETA_TIPO` (`ESTANDAR`/`CUSTOMIZADA` de
v1.3/v1.4) quedaba compitiendo con el nuevo modelo de tres caminos sin
aportar comportamiento propio — se eliminó esa columna.

**Resolución final de arquitectura — v1.7:** el reconocimiento de advertencias
se cierra como registro individual por línea en `ADVERTENCIAS_PEDIDO`, con
usuario, fecha y mensaje snapshot; `confirmar_pedido` verifica la base y no
acepta un booleano global del frontend. Se agregan `PRODUCCIONES` como
cabecera de cada ejecución, coherencia declarativa del tipo de SKU mediante
claves compuestas, el protocolo completo de concurrencia autocontenido y la
corrección sobre índices de foreign keys. No quedan decisiones
arquitectónicas bloqueantes. Además, todas las tablas incorporan
`USER_STAMP`, `PROCESS_STAMP` y `DATE_TIME_STAMP`; los RPC capturan la sesión,
el proceso estable y `clock_timestamp()` sin confiar en valores enviados por
la UI.

**Convención v1.8:** `USER_STAMP`, `PROCESS_STAMP` y `DATE_TIME_STAMP`
permanecen en inglés. Se agrega la tabla técnica inglesa
`RESOURCE_FILE_BASE`, con PK identity `OBJECT_ID`, para centralizar códigos
`RFB_*`, excepciones, validaciones y mensajes sin textos largos duplicados en
RPC/SP.
