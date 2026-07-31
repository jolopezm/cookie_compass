# Cookie Compass

Sistema de gestión para un negocio familiar de repostería: clientes,
productos y variantes, pedidos, producción, inventario, entregas y pagos.

## Estado

El repositorio contiene un prototipo CRUD funcional y una arquitectura nueva
documentada para desarrollarse por cortes. La implementación del nuevo diseño
aún no ha comenzado.

- Fuente de verdad: [`MASTER.md`](MASTER.md)
- Primer corte preparado: [`GO_CORTE_0.md`](GO_CORTE_0.md)
- Arquitectura y deployment: [`ARQUITECTURA_DEPLOYMENT.md`](ARQUITECTURA_DEPLOYMENT.md)
- Procedimiento de usuario: [`SOP_USUARIO.md`](SOP_USUARIO.md)

No debe interpretarse el prototipo actual como un sistema listo para operar
ventas, pagos o inventario reales.

## Inicio rápido

```bash
npm install
npm run dev
```

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo con Vite |
| `npm run build` | Compila para producción |
| `npm run preview` | Previsualiza la build de producción |

## Stack objetivo

- Vite + TypeScript + Web Components
- Pico CSS
- Supabase Auth
- PostgreSQL con RLS
- RPC transaccionales PL/pgSQL
- Supabase Edge Functions para integraciones futuras
