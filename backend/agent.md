# Guía de desarrollo del backend

## Alcance y arquitectura

El backend es una API HTTP construida con NestJS y TypeScript. Sigue una
arquitectura de monolito modular: `src/app.module.ts` conecta autenticación,
base de datos y el módulo agregador de la API (`src/modules/api/api.module.ts`).
Los dominios viven en `src/modules/`; evita concentrar lógica de dominio en
`AppModule`.

La aplicación escucha en `PORT` (3000 por defecto) y permite el origen indicado
por `CLIENT_ORIGIN` (por defecto `http://localhost:5173`), con credenciales
habilitadas para la cookie de sesión.

## Organización del código

- `src/auth/`: inicio y cierre de sesión, renovación de tokens, guard y hash de
  contraseñas.
- `src/common/authorization/`: obtención del contexto de empresa/entorno y
  evaluación de permisos.
- `src/common/crud/`: controlador CRUD generado por recurso y lógica
  compartida de acceso a datos.
- `src/database/`: conexión PostgreSQL, migraciones y seed inicial.
- `src/modules/<dominio>/`: módulo Nest y declaración de sus recursos.
- `src/modules/api/`: agrega los módulos de dominio en la API.

Cada recurso se declara en `resources.ts` del dominio con su nombre de ruta, la
tabla y el nombre del módulo de permisos. El registro compartido de
`src/common/crud/resources.ts` combina esas declaraciones; agregar un recurso
CRUD implica también importar su módulo en `ApiModule`.

Los controladores CRUD se crean para cada recurso registrado y exponen:

```text
GET    /api/:resource
GET    /api/:resource/:id
POST   /api/:resource
PATCH  /api/:resource/:id
DELETE /api/:resource/:id
```

Los listados aceptan `limit` y `offset`. La lógica de tabla, columnas,
conversión de nombres de propiedades y escrituras compartidas pertenece a
`CrudService`; las búsquedas y reglas específicas de dominio deben seguir el
patrón de servicios y controladores dedicados, como los de personas, clientes
y reportes.

El catálogo de productos también usa controladores dedicados en
`src/modules/catalog/`: `GET /api/products/search` autoriza `Product[READ]`;
`GET /api/catalogs/{brands|categories|departments}/search` autoriza el permiso
`READ` del catálogo; y `POST /api/products/import` autoriza `Product[INSERT]`.
La búsqueda admite `query`, `brand_id`, `category_id`, `department_id`,
`product_type`, `is_active`, `sale_price_min`, `sale_price_max`, `limit` y
`offset` como query params. La importación recibe `{ rows }`, admite hasta 500
filas y es atómica. Las relaciones aceptan ID o nombre (`brand_id`/`brand_name`,
`category_id`/`category_name`, `department_id`/`department_name`); el ID tiene
prioridad. El ámbito se deriva siempre de la sesión, aunque el CSV incluya
`company_id` y `environment_id`.

## Persistencia y ámbito de datos

PostgreSQL es la base de datos. `DatabaseModule` expone un `pg.Pool` compartido
configurado mediante `DATABASE_URL`; consultas específicas usan SQL parametrizado
con `pg`. Las migraciones y la configuración de esquema usan Drizzle. No agregues
un ORM alternativo ni dupliques la configuración de conexión.

La sesión determina el usuario, la empresa y el entorno activos. Las operaciones
CRUD limitan lecturas y escrituras a ese ámbito cuando las tablas tienen
`company_id` o `environment_id`; esos IDs se derivan de la sesión, no se confía
en los valores enviados por el cliente. Los campos `id`, timestamps, campos de
auditoría administrados por servidor y `password_hash` no son editables
directamente. Mantén las consultas parametrizadas y el acceso al ámbito en
cualquier endpoint nuevo que consulte datos de la empresa.

Las migraciones se mantienen en `src/database/migrations/`; el seed inicial crea
los registros necesarios para una primera sesión dentro de una transacción.
Actualiza el esquema/migración correspondiente cuando cambie la estructura de
datos. No expongas tablas internas de sesión o migraciones como recursos CRUD.

## Autenticación y permisos

- `POST /auth/login` entrega un access token JWT de 15 minutos y coloca el
  refresh token en una cookie `HttpOnly`.
- `POST /auth/refresh` rota el refresh token; su hash se almacena en la tabla de
  sesiones. `POST /auth/logout` revoca la sesión.
- `GET /auth/me` requiere el guard de autenticación.
- Configura `ACCESS_TOKEN_SECRET` (mínimo 32 bytes), `DATABASE_URL` y
  `CLIENT_ORIGIN`. En producción la cookie requiere HTTPS.
- Las rutas de datos requieren autenticación y permiso del rol activo. La
  convención de acciones almacenada en `roles.actions` es un arreglo de strings:
  `*`, `Product[*]` o `Product[READ|INSERT|UPDATE|DELETE]`. Las acciones CRUD
  son `READ`, `INSERT`, `UPDATE` y `DELETE`; usa `permissions.ts` para validar,
  normalizar nombres de módulos y comprobar permisos, en vez de implementar
  verificaciones paralelas.
- Solo un superadministrador puede conceder `*`. La asignación de roles no debe
  permitir conceder permisos que quien la realiza no posee.

No agregues acceso sin guard ni omitas el control de permisos para facilitar una
integración. Los recursos globales y los datos de auditoría tienen reglas
especiales en los servicios compartidos; respétalas al extender el API.

## Comandos

Ejecutar desde `backend/`:

```bash
pnpm start:dev
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Agrega pruebas unitarias junto a los servicios y utilidades afectados (`*.spec.ts`)
y usa la configuración e2e para validar comportamiento HTTP cuando aplique.
Antes de cerrar cambios, ejecuta las pruebas y verificaciones relevantes para el
área modificada.

## Límites del estado actual

Implementa sobre las rutas, módulos, tablas y contratos que existen en el
repositorio. El README raíz describe una arquitectura objetivo más amplia
(plugins, eventos y otras capacidades); no las trates como componentes ya
implementados ni las introduzcas al modificar una funcionalidad no relacionada.
