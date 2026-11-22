# LibreERP

**Open Source · Modular · ERP operativo para escritorio y web**

LibreERP es un ERP de código abierto construido con React, React Router,
NestJS, PostgreSQL y TypeScript. El proyecto utiliza una arquitectura cliente-
servidor: el cliente no accede directamente a la base de datos y todas las
operaciones pasan por una API autenticada.

El repositorio contiene actualmente dos aplicaciones principales:

- `client/`: interfaz web React con React Router, Tailwind CSS y DaisyUI.
- `backend/`: API NestJS con autenticación, permisos, PostgreSQL y módulos por dominio.

La instalación como aplicación de escritorio mediante Electron continúa en
planificación; el estado actual es una aplicación web cliente-servidor.

## Estado actual

LibreERP se encuentra en desarrollo activo. Los módulos base ya permiten
configurar el workspace, administrar usuarios y permisos, trabajar con personas
y clientes, mantener el catálogo e inventario, operar el POS y consultar
información operativa.

### Funcionalidades implementadas

- Inicio de sesión con JWT de 15 minutos y refresh token rotativo.
- Sesiones por empresa y entorno.
- Usuarios, roles, permisos y asignación de roles.
- Empresas, sucursales, bodegas y ambientes de trabajo.
- Personas, clientes y tipos de clientes.
- Marcas, categorías, departamentos y productos.
- Importación de productos por CSV.
- Existencias por bodega, entradas, salidas, ajustes y traslados.
- Cajas registradoras configurables por sucursal y bodega.
- Sesiones de caja vinculadas al usuario que las abre.
- Punto de venta con búsqueda por nombre, descripción, SKU y código de barras.
- Búsqueda de productos limitada al stock disponible de la bodega de la caja.
- Carrito, descuentos, impuestos, cobro dividido y métodos de pago.
- Actualización transaccional de stock e historial de movimientos al vender.
- Consultas iniciales de inventario y ventas.
- Navegación por teclado, atajos de función y modo pantalla completa en el POS.

### Funcionalidades previstas

- Completar el módulo **Ventas**:
  - consultar y analizar ventas;
  - revisar resúmenes por periodo, sucursal y vendedor;
  - consultar ventas en efectivo y a crédito;
  - analizar cuentas por cobrar, pagos parciales y saldos pendientes;
  - revisar estados, devoluciones y documentos asociados.
- Completar el módulo **Reportes**:
  - convertirlo en un generador de documentos PDF dinámicos;
  - permitir seleccionar datos, filtros, columnas y formato del documento;
  - crear reportes reutilizables según las necesidades de cada operación;
  - generar documentos de ventas, inventario, caja, clientes y otros dominios;
  - definir encabezados, totales, agrupaciones y presentaciones personalizadas.
- Contabilidad, compras, devoluciones completas y sincronización con marketplaces.
- Electron y distribución como aplicación de escritorio.
- Sistema de plugins y marketplace de extensiones.

Las funcionalidades previstas no deben considerarse disponibles solo porque
aparezcan en esta documentación o en el roadmap.

## Arquitectura

```mermaid
flowchart TB
    subgraph Cliente["Cliente web"]
        React["React + TypeScript"]
        Router["React Router"]
        SDK["SDK compartido"]
        React --> Router
        Router --> SDK
    end

    subgraph Backend["Backend NestJS"]
        API["REST API"]
        Auth["Autenticación y permisos"]
        Modules["Módulos por dominio"]
        API --> Auth
        API --> Modules
    end

    subgraph Datos["Persistencia"]
        PostgreSQL[("PostgreSQL")]
        Redis[("Redis")]
    end

    SDK --> API
    Auth --> PostgreSQL
    Modules --> PostgreSQL
    Backend --> Redis
```

## Tecnologías

| Componente | Tecnología |
|---|---|
| Frontend | React 19, TypeScript, React Router |
| UI | Tailwind CSS, DaisyUI |
| Estado | Zustand |
| Cliente HTTP | SDK compartido sobre Fetch |
| Backend | NestJS 12, TypeScript |
| Base de datos | PostgreSQL |
| ORM/migraciones | Drizzle |
| Caché | Redis |
| Pruebas backend | Vitest |
| Gestor de paquetes | pnpm |

## Estructura del repositorio

```text
libre-erp/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── common/
│   │   │   ├── authorization/
│   │   │   └── crud/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seed/
│   │   └── modules/
│   │       ├── accounting/
│   │       ├── api/
│   │       ├── catalog/
│   │       ├── documents/
│   │       ├── inventory/
│   │       ├── organization/
│   │       ├── people/
│   │       ├── pos/
│   │       ├── reports/
│   │       ├── roles/
│   │       ├── taxes/
│   │       └── users/
│   └── docker/
├── client/
│   ├── app/
│   │   └── routes/
│   ├── lib/
│   └── modules/
│       ├── auth/
│       ├── common/
│       ├── crm/
│       ├── inventory/
│       ├── language/
│       ├── pos/
│       ├── products/
│       ├── setting/
│       └── start/
├── ROADMAP-MVP.md
└── README.md
```

## Módulos principales

### Organización

Administra la compañía, sucursales y ambientes de trabajo que forman el alcance
de los datos.

### Usuarios y roles

Permite crear cuentas, asignar roles y controlar acciones por módulo dentro de
cada empresa y entorno.

### Productos y catálogo

Gestiona productos, marcas, categorías, departamentos, precios, unidades,
códigos SKU, códigos de barras e impuestos.

### Inventario

Consulta existencias por bodega y registra entradas, salidas, ajustes y
traslados. Los movimientos conservan trazabilidad de cantidad, usuario, fecha,
motivo y referencia.

### CRM

Administra personas, clientes, tipos de clientes y datos utilizados por ventas
y documentos.

### POS

Permite seleccionar una caja, abrir una sesión como usuario autenticado,
buscar productos disponibles en la bodega asignada, crear el carrito y cobrar.

Una caja abierta pertenece al usuario que inició la sesión. Solo ese usuario
puede cobrar o cerrarla, y recargar el navegador conserva la sesión activa.

### Ventas

El módulo de Ventas es el espacio destinado a revisar y analizar las operaciones
comerciales.

Debido a su alcance debe permitir:

- ver un resumen general de ventas;
- consultar ventas por fecha, sucursal, vendedor, estado y método de pago;
- analizar totales, descuentos, impuestos y tendencias;
- revisar ventas completadas, canceladas o parcialmente devueltas;
- identificar ventas a crédito;
- consultar pagos parciales, pagos pendientes y saldos de deuda;
- relacionar clientes, documentos y movimientos de efectivo;
- exportar o imprimir los resultados según el alcance disponible.

La interfaz inicial de resumen puede crecer hasta convertirse en el centro de
consulta y análisis de ventas y cuentas por cobrar.

### Reportes

El módulo de Reportes funcionará como un **generador de documentos PDF
dinámicos**.

Permitirá crear, configurar y ejecutar documentos dependiendo de la necesidad
del usuario, por ejemplo:

- reportes de ventas;
- documentos de cierre de caja;
- reportes de inventario;
- estados de cuenta de clientes;
- reportes de pagos y cuentas por cobrar;
- movimientos de efectivo;
- documentos fiscales o operativos definidos por el usuario.

El generador podrá combinar filtros, rangos de fechas, sucursales, columnas,
agrupaciones, totales y presentaciones antes de producir un PDF. Los datos
base deben conciliarse siempre con las operaciones registradas en el ERP.

Los endpoints actuales de reportes son una consulta inicial de ventas e
inventario; el generador dinámico de PDF todavía no está implementado.

### Documentos

Administra tipos de documentos y elementos utilizados para representar
operaciones comerciales. La representación imprimible completa continúa en
desarrollo.

### Contabilidad

Contiene recursos base y consultas previstas para operaciones contables. No
debe presentar resultados como estados financieros oficiales hasta definir el
plan de cuentas y las reglas contables aplicables.

## Backend

### Inicio rápido

Desde `backend/`:

```powershell
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm start:dev
```

La API escucha en `PORT`, con `3000` como valor predeterminado. Configura:

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/libreerp
REDIS_URL=redis://localhost:6379
ACCESS_TOKEN_SECRET=una_clave_segura_de_al_menos_32_bytes
CLIENT_ORIGIN=http://localhost:5173
SEED_ADMIN_PASSWORD=una_contraseña_segura_de_al_menos_12_caracteres
```

### Rutas principales

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET|POST|PATCH|DELETE /api/:resource`
- `GET /api/inventory/stock`
- `POST /api/inventory/operations`
- `POST /api/inventory/transfers`
- `GET /api/pos/status`
- `GET /api/pos/registers`
- `GET /api/pos/sessions/active`
- `POST /api/pos/sessions/open`
- `POST /api/pos/sessions/:id/close`
- `GET /api/pos/products/search`
- `GET /api/pos/payment-methods`
- `POST /api/pos/checkout`
- `GET /api/reports/inventory`
- `GET /api/reports/sales`

Las operaciones protegidas requieren autenticación y permisos asociados al
módulo. Las operaciones CRUD y específicas limitan los datos a la empresa y al
entorno activos del usuario.

## Frontend

Desde `client/`:

```powershell
pnpm install
pnpm dev
```

El cliente estará disponible normalmente en `http://localhost:5173`.

Para apuntar a otro backend:

```env
VITE_API_URL=http://localhost:3000
```

Comandos de validación:

```powershell
pnpm typecheck
pnpm build
```

## Base de datos

PostgreSQL almacena la información empresarial. Las migraciones y el esquema
Drizzle se encuentran en `backend/src/database/migrations/`. Las operaciones
transaccionales usan SQL parametrizado y bloqueos de filas cuando el stock, la
sesión de caja o el cobro requieren evitar condiciones de carrera.

La base de datos incluye tablas para cajas, sesiones de caja, métodos de pago,
ventas, líneas de venta, impuestos, pagos, movimientos de caja y devoluciones.

## Scripts útiles

Desde `backend/`:

```powershell
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Desde `client/`:

```powershell
pnpm dev
pnpm typecheck
pnpm build
pnpm start
```

## Seguridad y permisos

- Los access tokens duran 15 minutos.
- Los refresh tokens se almacenan como hash y se envían mediante cookie HttpOnly.
- Las rutas requieren permisos explícitos salvo autenticación pública.
- Las consultas limitan empresa y entorno desde la sesión.
- Las IDs de empresa o entorno enviadas por el cliente no deben controlar el
  alcance de una operación.
- Las escrituras críticas deben validar stock, permisos y estado de la sesión.

## Roadmap

La planificación detallada del MVP está disponible en
[ROADMAP-MVP.md](./ROADMAP-MVP.md).

Las prioridades actuales incluyen:

1. Completar el análisis de ventas y cuentas por cobrar.
2. Completar cierres de caja y devoluciones.
3. Vincular comprobantes a ventas y documentos.
4. Crear el generador dinámico de reportes PDF.
5. Ampliar compras y contabilidad.
6. Incorporar integraciones externas y plugins.
7. Añadir distribución Electron y modos de instalación local/servidor.

## Licencia

Consulta [licence.md](./licence.md) para conocer los términos del proyecto.
