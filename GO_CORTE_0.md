# GO — Corte 0 (Cookie Compass)

**Estado: EN ESPERA. NO EJECUTAR.**

Este documento contiene el GO completo para implementar el Corte 0 —
Fundación (auth, roles, `"CLIENTES"`/`"USUARIOS"`, bootstrap de ADMIN, alta
controlada de CLIENTE, RLS, tipos TypeScript, pruebas y frontend mínimo de
login/sesión). Fue aprobado originalmente contra v1.4.1 y validado de nuevo
contra `MASTER.md` v1.8 antes de su ejecución.

Se guarda aquí, sin ejecutar, porque cuando se redactó este GO la
instrucción explícita fue: usarlo únicamente para actualizar documentación
(ver `MASTER.md` sección 17.1, protocolo de concurrencia del Corte 3b, que sí
se documentó) y **no** implementar código todavía. Ningún archivo de código,
migración, configuración de Supabase ni frontend fue creado a partir de este
GO.

**Para ejecutar este GO:** Ed o José deben dar autorización explícita en una
sesión nueva (o esta misma, si sigue abierta), referenciando este archivo.
En ese momento, el agente que lo ejecute debe:
1. Releer `MASTER.md` v1.8 o la versión vigente posterior.
2. Releer `DISCOVERY NOTES README.md`, `README.md`, `package.json` y
   `.gitignore` como pide el GO.
3. Verificar `git status` antes de tocar nada.
4. Presentar el plan breve de Corte 0 que pide el GO **antes** de escribir
   ningún archivo.
5. Seguir el resto del GO tal como está escrito abajo, sin ampliar el
   alcance.

---

## Texto del GO (verbatim, tal como lo aprobó Ed)

GO APROBADO — IMPLEMENTAR ÚNICAMENTE EL CORTE 0 DE COOKIE COMPASS

Actúa como implementador principal. La versión vigente de MASTER.md es la
fuente de verdad; este GO fue validado contra v1.8.

### OBJETIVO

Implementar y verificar el Corte 0 — Fundación:

- Supabase local y migraciones iniciales;
- autenticación de ADMIN con correo y contraseña;
- autenticación de CLIENTE con OTP por correo;
- tablas mínimas `"ROLES"`, `"CLIENTES"` y `"USUARIOS"`;
- bootstrap controlado del primer ADMIN;
- alta y vinculación controlada de CLIENTES;
- funciones auxiliares de identidad;
- Row Level Security;
- tipos TypeScript generados;
- pruebas positivas y negativas de autenticación, autorización y RLS;
- documentación para ejecutar y verificar el corte localmente.

### AUTORIZACIÓN

Puedes:

- crear la estructura local de Supabase;
- crear migraciones versionadas;
- crear seeds de catálogos no sensibles;
- crear funciones SQL, políticas RLS y pruebas;
- configurar TypeScript si es necesario para el Corte 0;
- crear el mínimo frontend necesario para login, logout, sesión y una pantalla protegida;
- actualizar README.md y MASTER.md únicamente para reflejar fielmente lo implementado;
- ejecutar build, linters, tests, migraciones locales y generación de tipos.

No puedes:

- conectarte ni aplicar cambios a producción;
- usar service_role en el frontend;
- incluir secretos reales;
- implementar inventario, SKU, recetas, pedidos, producción, entregas o pagos;
- reescribir componentes no relacionados;
- borrar el prototipo sin necesidad;
- hacer commit, push o deployment;
- ampliar el alcance más allá del Corte 0.

Antes de modificar archivos:

1. Lee completamente:
   - MASTER.md
   - DISCOVERY NOTES README.md
   - README.md
   - package.json
   - .gitignore
2. Inspecciona el estado de Git.
3. Preserva cambios existentes del usuario.
4. Presenta un plan breve y ejecutable del Corte 0.
5. Si encuentras una contradicción que afecte seguridad o integridad, detente y repórtala; no improvises silenciosamente.

### CONVENCIÓN DE NOMENCLATURA CONFIRMADA

- Tablas y columnas: español, MAYÚSCULAS y citadas en PostgreSQL.
- Funciones/RPC: español, `snake_case` minúscula, sin comillas.
- La nomenclatura visual no es una medida de seguridad.
- No se obliga a convertir a mayúsculas texto escrito por usuarios.
- Los códigos internos de catálogo pueden permanecer en mayúsculas.
- Las excepciones inglesas aprobadas son las tres columnas stamp y la tabla
  técnica `"RESOURCE_FILE_BASE"` con sus columnas.

### STAMPS OBLIGATORIOS DESDE LA PRIMERA MIGRACIÓN

Todas las tablas del Corte 0, y el mecanismo reusable para cortes futuros,
deben incluir:

```sql
"USER_STAMP"      text not null,
"PROCESS_STAMP"   text not null,
"DATE_TIME_STAMP" timestamptz not null
```

Esto aplica a tablas propiedad de Cookie Compass. No alteres tablas internas
administradas por Supabase en los esquemas `auth`, `storage` o equivalentes.

### RESOURCE FILE BASE

Implementa `"RESOURCE_FILE_BASE"` según `MASTER.md` v1.8:

- `"OBJECT_ID"` identity PK;
- `"RESOURCE_CODE"` único;
- `"RESOURCE_TYPE"` limitado a `EXCEPTION`, `VALIDATION` o `MESSAGE`;
- `"MESSAGE_TEXT"`;
- `"HTTP_STATUS"` opcional;
- `"ACTIVE"`;
- los tres stamps.

Incluye seeds versionados para todos los códigos usados por Corte 0 y para
`RFB_RESOURCE_NOT_FOUND`. Implementa `raise_resource(p_resource_code)` o el
mecanismo equivalente. Los RPC/SP emiten códigos `RFB_*`; no duplican textos
largos. UI, tests e integraciones comparan `RESOURCE_CODE`, no
`MESSAGE_TEXT`.

Implementa la convención de `MASTER.md` v1.7 sección 12.3:

- usuario humano derivado de `auth.uid()`, nunca del payload;
- identidad `SYSTEM:*` explícita para migración, seed y bootstrap;
- código de proceso constante definido dentro de cada RPC;
- `clock_timestamp()` para la hora efectiva;
- trigger común `BEFORE INSERT OR UPDATE`;
- rechazo de contexto vacío;
- contexto limitado a la transacción;
- imposibilidad de sobrescribir stamps desde la UI.

### MODELO MÍNIMO DEL CORTE 0

Crear en orden coherente:

1. `"RESOURCE_FILE_BASE"`
2. `"ROLES"`
3. `"CLIENTES"`
4. `"USUARIOS"`

Seeds mínimos:

- `ADMIN`
- `CLIENTE`

Debe mantenerse la invariante:

- `ROL_CODIGO = 'CLIENTE'` exige `CLIENTE_ID` no nulo.
- `ROL_CODIGO = 'ADMIN'` exige `CLIENTE_ID` nulo.
- Ningún CLIENTE puede elegir, reemplazar o desvincular su `CLIENTE_ID`.
- Ningún usuario puede concederse a sí mismo el rol ADMIN.
- Una fila de usuario inactiva no obtiene autorización aunque exista una sesión válida.

### BOOTSTRAP DEL PRIMER ADMIN

Implementa un mecanismo local y controlado para crear el primer ADMIN.

Requisitos:

- no depender de que ya exista otro ADMIN;
- no exponer el bootstrap desde la UI normal;
- no almacenar correo, contraseña, UUID o token real en migraciones;
- recibir el `auth.users.id` mediante variable o paso administrativo documentado;
- permitir bootstrap solamente cuando todavía no exista ningún ADMIN, o requerir privilegios administrativos externos;
- ser idempotente o fallar de forma segura;
- documentar cómo queda inutilizable o restringido después del bootstrap;
- incluir una prueba que demuestre que un usuario normal no puede usarlo.

No inventes credenciales de producción.

### ALTA CONTROLADA DE CLIENTES

Para el MVP:

1. Un ADMIN crea o identifica una fila de `"CLIENTES"`.
2. Un proceso administrativo controlado vincula el usuario de Supabase Auth con esa fila.
3. El CLIENTE inicia sesión mediante OTP.
4. RLS obtiene su identidad desde `"USUARIOS"."AUTH_USER_ID"`.
5. El CLIENTE nunca envía un `CLIENTE_ID` arbitrario para definir su identidad.

No implementar registro público libre en este corte.

### FUNCIONES DE IDENTIDAD

Implementa las funciones conceptuales:

- `rol_usuario_actual()`
- `cliente_id_usuario_actual()`

Requisitos de toda función `SECURITY DEFINER`:

- esquema de objetos calificado explícitamente;
- `search_path` endurecido; preferir vacío cuando sea viable y calificar `public."TABLA"` y `auth.uid()`;
- validar `auth.uid()`;
- validar que `"USUARIOS"."ACTIVO" = true`;
- `REVOKE EXECUTE ... FROM PUBLIC`;
- `GRANT EXECUTE` únicamente a los roles que realmente lo necesiten;
- no aceptar `AUTH_USER_ID`, rol o `CLIENTE_ID` desde el frontend cuando puedan derivarse de la sesión;
- no confiar únicamente en RLS de la tabla consultada.

### ROW LEVEL SECURITY

Activa y prueba RLS en todas las tablas del Corte 0.

Cobertura mínima:

**ADMIN:**

- puede consultar y administrar clientes según las operaciones autorizadas;
- puede realizar el alta controlada de usuarios/clientes;
- no puede saltarse invariantes de rol/cliente;
- las operaciones privilegiadas deben pasar por RPC cuando corresponda.

**CLIENTE:**

- puede leer únicamente su propio perfil y su propia información de cliente;
- no puede consultar otros clientes;
- no puede cambiar su rol;
- no puede cambiar `AUTH_USER_ID`;
- no puede cambiar `CLIENTE_ID`;
- no puede crear otra fila de usuario;
- no puede activar una cuenta inactiva.

**ANON:**

- no puede leer ni modificar datos empresariales;
- solo participa en el flujo de autenticación permitido por Supabase Auth.

No confundas ocultar controles de UI con autorización.

### PRUEBAS OBLIGATORIAS

Incluye pruebas reales para demostrar:

1. Se crean los seeds `ADMIN` y `CLIENTE`.
2. La base rechaza:
   - ADMIN con `CLIENTE_ID`;
   - CLIENTE sin `CLIENTE_ID`;
   - rol no reconocido.
3. Un usuario autenticado solo resuelve su propia identidad.
4. Un CLIENTE solo puede leer su fila y su cliente relacionado.
5. Un CLIENTE no puede leer otro cliente.
6. Un CLIENTE no puede modificar rol, `CLIENTE_ID` ni `AUTH_USER_ID`.
7. Un usuario inactivo no obtiene autorización.
8. `anon` no puede consultar tablas empresariales.
9. El bootstrap crea únicamente el primer ADMIN y no puede abusarse desde una sesión ordinaria.
10. Las funciones no quedan ejecutables por `PUBLIC` accidentalmente.
11. Las migraciones funcionan desde una base local vacía.
12. El rollback o reset local permite recrear el esquema.
13. Los tipos TypeScript se generan desde el esquema real.
14. La build del frontend pasa.
15. Login, sesión, logout y ruta/pantalla protegida funcionan en un navegador.
16. Todas las filas de `ROLES`, `CLIENTES` y `USUARIOS` contienen los tres
    stamps.
17. INSERT y UPDATE refrescan `DATE_TIME_STAMP` y registran el proceso
    correcto.
18. Un usuario no puede falsificar `USER_STAMP` ni `PROCESS_STAMP` mediante
    payload o escritura directa.
19. Seeds y bootstrap registran identidades `SYSTEM:*` explícitas.
20. Una escritura sin contexto válido falla completamente.
21. `RESOURCE_FILE_BASE.OBJECT_ID` se genera por identity y
    `RESOURCE_CODE` rechaza duplicados.
22. Todo código `RFB_*` usado en Corte 0 existe y está activo.
23. Cambiar `MESSAGE_TEXT` no rompe contratos ni tests.
24. Un código inexistente o inactivo produce `RFB_RESOURCE_NOT_FOUND`.

Las pruebas deben verificar permisos reales usando roles/JWT adecuados. No basta con ejecutar consultas como superusuario, porque eso puede bypassar RLS.

### FRONTEND MÍNIMO

Implementa únicamente:

- configuración del cliente Supabase mediante variables de entorno;
- login ADMIN;
- solicitud de OTP CLIENTE;
- restauración de sesión;
- logout;
- pantalla protegida mínima;
- estados de carga y error;
- redirección básica según sesión.

No construyas todavía dashboards ni pantallas de negocio.

Variables esperadas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Incluye `.env.example` sin valores sensibles. Asegura que archivos `.env` reales estén ignorados por Git.

### RIESGO DE CONCURRENCIA — ACTUALIZAR SECCIÓN 17

*(Ya ejecutado — ver `MASTER.md` sección 17.1. Se deja este texto aquí solo
como parte del registro verbatim del GO original.)*

El riesgo técnico más caro no se implementa en Corte 0 porque pertenece al Corte 3b, pero debes actualizar MASTER.md para describir su mitigación completa.

No basta con decir "usar FOR UPDATE".

Documenta este protocolo obligatorio futuro:

1. `confirmar_pedido` bloquea primero la fila del pedido.
2. Determina todos los SKU involucrados.
3. Bloquea las filas estables de `"REGISTRO_SKU"` involucradas en orden determinista por ID.
   - Esto serializa incluso cuando un SKU todavía no tiene fila en `"INVENTARIO_MASTER"`.
4. Después bloquea las filas físicas de `"INVENTARIO_MASTER"` involucradas, también en orden determinista.
5. Todos los RPC que compitan por inventario usan exactamente el mismo orden global:
   - pedido, cuando corresponda;
   - SKU ordenados;
   - filas de inventario ordenadas.
6. Después de adquirir los locks, ejecuta una consulta nueva que recalcula:
   - existencia física;
   - reservas activas;
   - asignaciones activas;
   - disponibilidad real.
7. Solo entonces crea asignaciones y reservas.
8. Todo ocurre en una única transacción.
9. Si no hay disponibilidad suficiente, falla toda la operación sin escrituras parciales.
10. Configura manejo explícito de:
    - `lock_timeout`;
    - deadlock;
    - serialización/reintento cuando corresponda;
    - mensajes de dominio seguros para la UI.
11. La implementación futura debe incluir una prueba real con dos conexiones concurrentes:
    - ambas compiten por el mismo producto final y los mismos insumos;
    - exactamente una confirma;
    - la otra falla íntegramente por stock insuficiente o reintenta de forma controlada;
    - nunca hay sobreventa;
    - nunca quedan reservas parciales;
    - nunca aparece un deadlock no controlado.
12. Agrega una segunda prueba para disponibilidad cero/sin fila física, demostrando que el lock estable por SKU evita que dos transacciones creen compromisos incompatibles.

Aclara que bloquear solamente filas de `"INVENTARIO_MASTER"` no es suficiente cuando:
- no existe una fila física;
- las reservas se guardan en otra tabla;
- una consulta empezó antes de que la transacción rival confirmara.

La disponibilidad debe recalcularse en una sentencia posterior a adquirir los locks.

No implementes todavía `confirmar_pedido`; solo deja este protocolo como requisito explícito y criterio obligatorio del Corte 3b.

### VERIFICACIÓN

Ejecuta realmente:

- reset/migración local desde cero;
- tests SQL/RLS;
- generación de tipos;
- tests frontend;
- build;
- prueba manual o automatizada del flujo de autenticación en navegador.

Si una herramienta local requerida no está disponible, informa exactamente qué validación no pudo ejecutarse. No simules resultados.

### ENTREGABLE FINAL

Reporta:

1. Veredicto:
   - DONE
   - DONE_WITH_CONCERNS
   - BLOCKED
2. Archivos creados y modificados.
3. Migraciones creadas y su orden.
4. Políticas RLS y funciones implementadas.
5. Mecanismo de bootstrap del primer ADMIN.
6. Flujo de alta controlada del CLIENTE.
7. Pruebas ejecutadas con salida real resumida.
8. Pruebas negativas de RLS realizadas.
9. Resultado de build y navegador.
10. Riesgos o trabajo pendiente.
11. Confirmación de que no se implementaron cortes posteriores.
12. Confirmación de que no hubo commit, push, deployment ni cambios en producción.

No declares DONE si las pruebas RLS fueron ejecutadas únicamente como superusuario o si no se verificó el aislamiento entre dos clientes diferentes.
