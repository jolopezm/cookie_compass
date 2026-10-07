# Cookie Compass

Aplicación móvil de gestión semanal para planificar entregas, producción, ventas, costos e inventario.

## Funciones principales

- Plan semanal calculado desde la última entrega y la frecuencia de cada cliente.
- Cantidades habituales configurables por cliente y producto.
- Registro transaccional de ventas, compras y producción.
- Balance que separa gastos operacionales de retiros personales.
- Inventario de materias primas derivado de movimientos.
- Recetas, costo unitario estimado y margen por producto.
- Análisis mensual y administración con filtros y exportación CSV.

## Inicio local

```bash
npm install
npm run dev
```

La conexión con Supabase utiliza:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

## Actualizar Supabase

La aplicación conserva `clientes`, `productos`, `ordenes` y `detalle_ordenes`. Las funciones nuevas requieren aplicar:

```text
supabase/migrations/20261006000100_add_planning_inventory_and_production.sql
supabase/migrations/20261007000100_add_sale_annulment_retention.sql
```

La migración es aditiva, protege las tablas mediante RLS y restringe el acceso al rol autenticado. Debe respaldarse la base antes de aplicarla y probarse primero en un proyecto de desarrollo.

Las cuentas que ya existen en Supabase Auth al ejecutar la migración quedan autorizadas en `usuarios_app`. Las cuentas creadas después deben agregarse explícitamente a esa tabla antes de usar la aplicación.

Las ventas anuladas dejan de participar inmediatamente en la planificación y en los cálculos mensuales. Pueden restaurarse durante 15 días; después, un trabajo diario con nombre estable en `pg_cron` elimina primero sus detalles y luego la orden, conservando solamente la evidencia mínima de auditoría. El proyecto de Supabase debe tener `pg_cron` disponible y el propietario debe comprobar que el trabajo `purge-annulled-sales-daily` esté programado para las 03:00 UTC tras aplicar la migración.

Las ventas confirmadas, compras, producciones y movimientos se consultan y exportan desde `Datos`. Los catálogos de clientes, productos, materias primas, recetas y planes disponen de creación, edición y eliminación controlada.

## Verificación

```bash
npm test
npm run build
git diff --check
```
