# Guía de desarrollo del cliente

## Alcance y arquitectura

El cliente es una aplicación React + TypeScript basada en React Router, con
renderizado de servidor y compilación mediante Vite. La estructura de rutas se
declara en `app/routes.ts`; la interfaz y las funcionalidades se organizan
principalmente en `app/routes/` y `modules/`.

`app/root.tsx` es el layout raíz: instala estilos globales, fuentes, el proveedor
de sesión y el proveedor de notificaciones. El cliente consume la API NestJS
mediante el SDK compartido `lib/sdk.ts`; no accede directamente a PostgreSQL.

## Organización del código

- `app/routes.ts`: árbol y anidación de las rutas de React Router.
- `app/routes/`: componentes de ruta que componen las páginas y módulos.
- `modules/`: pantallas y componentes por funcionalidad, por ejemplo `crm`,
  `setting`, `user-and-roles` y `start`.
- `modules/common/`: componentes compartidos, como panel de navegación, tabla,
  notificaciones, bienvenida y autocompletados de catálogos.
- `modules/auth/`: estado de sesión mediante Zustand.
- `modules/language/`: textos y soporte de idiomas.
- `lib/sdk.ts`: tipos de API, errores, autenticación y métodos CRUD compartidos.
- `app/app.css`: estilos globales y configuración visual.

Mantén la lógica de una funcionalidad dentro de su módulo y deja que las rutas
sirvan como composición/navegación. Reutiliza el SDK y los componentes comunes
en lugar de implementar solicitudes HTTP o controles de interfaz duplicados.

## API y sesión

Configura `VITE_API_URL` para apuntar al backend (por defecto
`http://localhost:3000`). Usa el singleton `apiClient` de `lib/sdk.ts` para
solicitudes:

- `login`, `restoreSession`, `refresh` y `logout` administran el ciclo de sesión.
- `list`, `get`, `create`, `update` y `remove` consumen recursos CRUD.
- `searchPeople`, `searchCustomers`, `changePassword` y métodos de reportes
  cubren operaciones específicas disponibles en el SDK.

El SDK envía credenciales de cookie, adjunta el access token en memoria y
renueva la sesión una sola vez cuando una solicitud autenticada recibe `401`.
El refresh token pertenece a una cookie `HttpOnly` del backend; no lo guardes en
localStorage, Zustand ni en el código de interfaz. Los errores HTTP se exponen
como `ApiError`; conserva el manejo explícito de errores en las pantallas.

`AuthProvider` restaura la sesión al iniciar y programa la renovación del token.
El estado compartido de usuario y sesión está en el store Zustand de
`modules/auth/hook/store.ts`. Actualiza ese estado mediante sus acciones y evita
crear una segunda fuente de verdad para autenticación.

Las solicitudes deben respetar los permisos y el ámbito de empresa/entorno que
aplica el backend. La interfaz puede ocultar acciones no disponibles para
mejorar la experiencia, pero el backend sigue siendo la autoridad de
autorización.

## Rutas, formularios y presentación

Registra nuevas páginas en `app/routes.ts` y conserva el patrón anidado por
secciones existente (por ejemplo, `/start/settings` y `/start/crm`). Reutiliza
los módulos para vistas y formularios; valida y envía los datos mediante las
funciones del SDK con los tipos de recursos existentes.

El proyecto utiliza React, TypeScript, React Router, Zustand, Tailwind CSS y
DaisyUI. Mantén los textos en el sistema de `modules/language/` cuando aplique,
en vez de dispersar cadenas traducibles por los componentes. Sigue los patrones
de componentes y estilos ya presentes en las pantallas del módulo relevante.

El módulo de productos está en `modules/products/` y sus rutas viven en
`app/routes/products/`. La búsqueda usa `apiClient.searchProducts` para enviar
filtros como query params. La importación CSV ofrece una vista previa y
validaciones iniciales en el cliente; el backend valida y procesa la carga
atómica de hasta 500 filas. Usa `CatalogAutocomplete` de `modules/common/` para
consultar marcas, categorías y departamentos sin duplicar la lógica de búsqueda.
La plantilla omite los campos generados, precarga `company_id` y
`environment_id` como referencia, y ofrece columnas de ID/nombre para resolver
las asociaciones con marcas, categorías y departamentos.

## Comandos

Ejecutar desde `client/`:

```bash
pnpm dev
pnpm build
pnpm typecheck
```

Ejecuta `pnpm typecheck` y `pnpm build` al cambiar rutas, tipos de SDK o
componentes compartidos, y las verificaciones relevantes para cambios más
acotados.

## Límites del estado actual

Algunas áreas de la aplicación siguen en desarrollo. Antes de asumir que una
funcionalidad existe, comprueba sus rutas, pantallas y métodos del SDK actuales.
La documentación de visión/roadmap no es por sí sola un contrato de API ni una
descripción de funcionalidades ya disponibles.


## Cosas que se deben evitar a toda costa

No se debe agregar tipo any bajo ningun concepto, cuando mucho el tipo unknown.
No agregar las clases input-bordered, select-bordered o textarea-bordered cuando se construye componentes, esto no funciona en las versiones actuales de tailwindcss o daisyui.