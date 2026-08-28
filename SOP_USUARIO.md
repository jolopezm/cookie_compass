# Cookie Compass — SOP de usuario

> Procedimiento operativo estándar basado en `MASTER.md` v1.8. Describe el
> flujo objetivo de la aplicación. Las funciones se habilitarán por cortes;
> este documento no afirma que ya estén implementadas.

## 1. Propósito

Establecer una forma consistente de registrar clientes, mantener productos e
inventario, confirmar pedidos, producir, entregar y cobrar sin perder
trazabilidad.

## 2. Roles

### ADMIN

Puede administrar usuarios, clientes, catálogos, inventario, pedidos,
producción, entregas, pagos, reembolsos y advertencias.

### CLIENTE

Puede autenticarse, consultar sus datos y pedidos y crear solicitudes propias.
No confirma precios, reservas, pagos ni producción.

## 3. Reglas generales

1. No compartir cuentas.
2. No registrar datos ficticios en producción.
3. No cambiar inventario para “hacer cuadrar” un pedido sin motivo.
4. No confirmar advertencias que no se hayan revisado.
5. No prometer ausencia de alérgenos solo porque una receta omite un
   ingrediente.
6. Los pagos pendientes no se consideran cobrados.
7. Los registros históricos no se eliminan para corregir errores; se usan
   operaciones compensatorias o ajustes auditados.
8. `USER_STAMP`, `PROCESS_STAMP` y `DATE_TIME_STAMP` son generados por el
   sistema; ningún usuario los edita manualmente.
9. Los códigos `RFB_*` identifican errores y mensajes de forma estable; el
   usuario debe comunicarlos al soporte cuando necesite ayuda.

## 4. Acceso

### ADMIN

1. Abrir la aplicación.
2. Seleccionar acceso administrativo.
3. Ingresar correo y contraseña.
4. Confirmar que aparece el nombre y rol correctos.
5. Al terminar, usar **Cerrar sesión**.

### CLIENTE

1. Abrir la aplicación.
2. Ingresar el correo previamente vinculado por un ADMIN.
3. Solicitar OTP.
4. Abrir el enlace o ingresar el código recibido.
5. Confirmar que solo aparecen sus datos y pedidos.

Si el correo no está vinculado, contactar a un ADMIN. No crear duplicados para
evitar resolver el vínculo.

## 5. Alta de cliente

Responsable: ADMIN.

1. Buscar por nombre, correo y teléfono para evitar duplicados.
2. Crear el cliente si no existe.
3. Registrar nombre y al menos un medio de contacto.
4. Agregar dirección y notas de entrega cuando correspondan.
5. Marcar **Cliente de confianza** únicamente según la política del negocio.
6. Si usará el portal, iniciar el flujo controlado de vinculación con
   Supabase Auth.
7. Verificar que el usuario CLIENTE quedó asociado a la fila correcta.

Para retirar un cliente del uso diario, desactivarlo; no eliminarlo si tiene
historial.

## 6. Productos, variantes e insumos

### Producto conceptual

Ejemplo: “Queque de chocolate”. Sirve para agrupar y no se vende directamente.

### Variante vendible

Ejemplo: “Queque de chocolate grande”. Debe tener:

- SKU único escrito por ADMIN;
- producto conceptual;
- nombre;
- precio;
- receta;
- estado activo.

### Insumo

Debe tener:

- SKU único;
- unidad de compra;
- unidad base;
- factor de conversión;
- stock mínimo.

No reutilizar un SKU para representar otro artículo.

## 7. Compra y ajuste de inventario

### Registrar compra

1. Seleccionar el insumo.
2. Ingresar cantidad en la unidad de compra mostrada.
3. Revisar el factor de conversión.
4. Confirmar la operación.
5. Verificar cantidad base y existencia resultante.

### Ajustar inventario

Elegir claramente:

- **Fijar cantidad:** reemplaza la existencia por el conteo físico ingresado.
- **Aplicar diferencia:** suma o resta una diferencia específica.

Siempre:

1. realizar conteo físico;
2. elegir el modo;
3. ingresar cantidad;
4. escribir motivo;
5. revisar cantidad anterior, nueva y diferencia;
6. confirmar.

El sistema debe rechazar resultados negativos.

## 8. Catálogos comerciales

El ADMIN puede configurar sabores, tamaños, decoraciones, empaques,
personalizaciones, alérgenos, advertencias y unidades.

- Crear opciones nuevas cuando formen parte estable del negocio.
- Desactivar opciones antiguas; no eliminarlas si tienen uso histórico.
- Marcar correctamente si afectan precio, receta, aprobación o advertencia.
- Revisar el texto visible antes de activarlas.

## 9. Crear pedido

1. Seleccionar cliente.
2. Elegir variantes activas.
3. Ingresar cantidades.
4. Programar una o varias entregas.
5. Registrar dirección snapshot de cada entrega.
6. Agregar notas del cliente.
7. Agregar personalizaciones.
8. Guardar como borrador o solicitud.

El total mostrado antes de confirmar es informativo hasta que el servidor
valide precios y descuentos.

## 10. Personalizaciones

### Recurrente

Crear una variante SKU con precio y receta propios.

### Excepcional sin impacto productivo

Guardar como nota o seleccionar una opción configurada. Ejemplo: mensaje
escrito que no cambia ingredientes ni precio.

### Excepcional con impacto productivo

1. Crear la personalización en la línea.
2. Preparar receta snapshot de esa línea.
3. Ingresar insumos y cantidades.
4. Solicitar aprobación ADMIN.
5. No confirmar el pedido hasta que la receta esté aprobada.

Si luego se vuelve recurrente, convertirla en variante sin modificar pedidos
históricos.

## 11. Alérgenos y advertencias

1. Revisar cada advertencia por línea.
2. Confirmar que el cliente comprende la diferencia entre “sin ingrediente”
   y “libre de contaminación cruzada”.
3. No usar “libre de alérgenos” sin procedimiento operacional verificable.
4. El ADMIN reconoce cada advertencia individualmente.
5. Confirmar que quedan registrados usuario, fecha y mensaje snapshot.
6. No confirmar el pedido mientras exista una advertencia pendiente.

## 12. Confirmar pedido

Responsable: ADMIN.

1. Revisar cliente, líneas, cantidades, precio y descuento.
2. Revisar recetas personalizadas.
3. Resolver todas las advertencias.
4. Revisar fechas y direcciones.
5. Seleccionar **Confirmar pedido** una sola vez.
6. Esperar el resultado del servidor.

Al confirmar, el sistema intenta:

- asignar productos finales disponibles;
- reservar insumos para lo que debe producirse;
- registrar historial;
- completar todo o hacer rollback.

Si aparece `STOCK_INSUFICIENTE`, no reintentar repetidamente. Ajustar el
pedido, reponer inventario o cambiar la fecha.

## 13. Modificar pedido confirmado

Solo antes de producción:

1. abrir el pedido;
2. seleccionar edición controlada;
3. cambiar productos, cantidades o fecha;
4. revisar nuevo precio y disponibilidad;
5. confirmar recálculo.

Cambiar cantidad o producto recalcula precio y reservas. Cambiar solo la fecha
no cambia el precio. Después de iniciar producción, las líneas no se editan.

## 14. Producción

### Para pedido

1. Abrir pedido confirmado.
2. Revisar requerimientos y reservas.
3. Seleccionar **Iniciar producción**.
4. Verificar que se cree una ejecución de producción.
5. Al terminar, marcar producto listo.

### Anticipada

1. Seleccionar variante.
2. Ingresar cantidad.
3. Revisar disponibilidad de insumos.
4. Confirmar producción anticipada.

En ambos casos deben registrarse la cabecera de producción y los consumos
reales de cada insumo.

## 15. Cancelación

### Antes de producir

1. Abrir pedido.
2. Seleccionar cancelar.
3. Ingresar motivo.
4. Confirmar liberación de reservas y asignaciones.

### Durante o después de producir

Además, elegir disposición:

- desperdicio;
- donación;
- disponible para reventa.

Revisar cualquier reembolso necesario. La cancelación debe quedar auditada.

## 16. Entregas parciales

1. Abrir pedido listo.
2. Crear entrega con fecha y dirección.
3. Seleccionar cantidades por línea.
4. Confirmar que no exceden lo pendiente.
5. Al entregar, registrar fecha efectiva.
6. Repetir hasta completar todas las líneas.

No marcar el pedido completo mientras exista cantidad pendiente.

## 17. Pagos y reembolsos

### Efectivo

Registrar monto y fecha. Confirmar según el procedimiento del negocio.

### Transferencia

1. Registrar como pendiente cuando el cliente presenta evidencia.
2. Verificar posteriormente el dinero.
3. Confirmar o rechazar mediante la acción correspondiente.

Solo pagos confirmados reducen el saldo.

### Reembolso

1. Registrar operación nueva.
2. Ingresar monto y motivo.
3. Confirmar por usuario autorizado.

No editar ni eliminar el monto original. Si hubo un error, usar operación
compensatoria.

## 18. Conciliación semanal

1. Seleccionar período.
2. Comparar pedidos, pagos confirmados y reembolsos.
3. Revisar operaciones pendientes o rechazadas.
4. Comparar con efectivo y cuenta bancaria.
5. Investigar diferencias.
6. Registrar correcciones mediante operaciones auditadas.
7. Cerrar la revisión según la política administrativa.

## 19. Manejo de errores

| Mensaje | Acción |
|---|---|
| Sesión vencida | Iniciar sesión nuevamente |
| Sin autorización | Confirmar cuenta/rol; no intentar evadir el control |
| Stock insuficiente | Reponer, reducir pedido o reprogramar |
| Advertencia no confirmada | Revisar y reconocer cada advertencia |
| Conflicto concurrente | Recargar y verificar el estado actual |
| Pago no pendiente | No repetir; revisar historial |
| Error inesperado | Guardar hora, pantalla y operación; informar al responsable |

No compartir capturas que contengan OTP, tokens o información innecesaria de
otros clientes.

## 20. Cierre de sesión y fin de jornada

1. Revisar pedidos urgentes y entregas pendientes.
2. Revisar pagos pendientes.
3. Confirmar que no haya producción sin estado actualizado.
4. Cerrar sesión en equipos compartidos.
5. No exportar datos a dispositivos personales sin autorización.

## 21. Escalamiento

Escalar al responsable técnico cuando:

- una operación aparece parcial;
- el inventario queda negativo o incoherente;
- hay un deadlock o timeout repetido;
- un cliente ve información ajena;
- un pago cambia sin autorización;
- falla una migración o deployment;
- se sospecha exposición de credenciales.

Detener la operación afectada hasta verificar integridad. No corregir
directamente tablas de producción con SQL improvisado.
