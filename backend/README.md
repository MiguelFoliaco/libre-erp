<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Autenticación

La API implementa access tokens JWT de 15 minutos y refresh tokens aleatorios
rotativos de 30 días. El access token se devuelve en JSON y el refresh token se
guarda como hash SHA-256 en `session` y se envía al cliente en una cookie
`HttpOnly`. Los endpoints son:

El backend compila a CommonJS, por lo que los imports relativos internos se
escriben sin extensión y Node los resuelve al ejecutar `dist`.

- `POST /auth/login`: acepta `identifier` (usuario o correo), `password` y,
  opcionalmente, `companyId` junto con `environmentId` si la cuenta existe en
  más de una empresa.
- `POST /auth/refresh`: rota la sesión y devuelve un access token nuevo.
- `POST /auth/logout`: revoca la sesión y borra la cookie.
- `GET /auth/me`: devuelve el usuario autenticado; requiere `Authorization:
Bearer <accessToken>`.

Configura `DATABASE_URL`, `ACCESS_TOKEN_SECRET` (mínimo 32 bytes) y
`CLIENT_ORIGIN` en el entorno del servidor. Ejecuta las migraciones existentes
con `pnpm db:migrate`.

### Primer inicio de sesión

1. Desde `backend`, configura `SEED_ADMIN_PASSWORD` con una contraseña fuerte
   de al menos 12 caracteres. En PowerShell, usa el prompt seguro:

   ```powershell
   $secret = Read-Host "Contraseña inicial (12+ caracteres)" -AsSecureString
   $env:SEED_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $secret).Password
   ```

2. Ejecuta `pnpm db:seed`. El seed crea la empresa, el entorno `main`, la
   persona, el usuario inicial, el rol `Super Admin` y su asignación, todo en
   una sola transacción. Si una operación falla, Drizzle revierte la
   transacción completa.
3. En el cliente inicia sesión con usuario `superadmin` y la contraseña que
   configuraste. Si hay varias empresas, completa también los IDs de empresa y
   entorno que el seed imprime al finalizar.
4. Borra la variable de la sesión de PowerShell cuando termines:

   ```powershell
   Remove-Item Env:SEED_ADMIN_PASSWORD
   ```

No se ofrece registro público porque crear una cuenta requiere asignarle
empresa, entorno y persona. El hash de contraseña usa scrypt; se puede generar
por separado, sin mostrar la contraseña, con `pnpm auth:hash-password`.

En producción la cookie requiere HTTPS (`NODE_ENV=production`). El frontend y
el backend deben compartir el mismo sitio para que funcione la política de
cookie `SameSite=Lax`.

## API de datos y permisos

Las rutas de datos requieren `Authorization: Bearer <accessToken>`. El usuario
debe tener un rol activo asignado en su empresa y entorno; los permisos se leen
de `roles.actions` en cada solicitud:

- `*`: todas las acciones.
- `Product[*]`: todas las acciones del módulo Product.
- `Product[READ|INSERT|UPDATE|DELETE]`: acciones explícitas del módulo.

Los nombres de módulo no distinguen mayúsculas y aceptan alias en español
documentados en `src/common/authorization/permissions.ts`. Un permiso no
concedido responde 403. El acceso a cada fila se limita a la empresa y al entorno del usuario;
los IDs de ámbito enviados por el cliente se ignoran. Los listados aceptan
`limit` (máximo 200) y `offset`.

Las rutas CRUD siguen `GET /api/:resource`, `GET /api/:resource/:id`,
`POST /api/:resource`, `PATCH /api/:resource/:id` y
`DELETE /api/:resource/:id`. Recursos disponibles:

`companies`, `environments`, `brands`, `categories`, `departments`, `products`,
`branches`, `warehouses`, `inventory`, `inventory-movements`, `transfers`,
`transfer-items`, `document-types-people`, `people`, `customer-types`,
`customers`, `users`, `roles`, `user-roles`, `document-types`,
`document-type-fields`, `document-type-headers`, `document-type-footers`,
`documents`, `document-items`, `taxes`, `product-taxes`, `audit-logs`,
`accounts`, `fiscal-periods`, `journal-entries`, `journal-entry-lines`,
`document-taxes`, `cash-registers`, `cash-sessions`, `payment-methods`, `sales`,
`sale-items`, `sale-item-taxes`, `sale-payments`, `cash-movements`,
`sale-returns` y `sale-return-items`.

`/api/sellers` usa la tabla `users` y requiere permisos del módulo `Seller`;
`/api/users` usa la misma tabla con permisos del módulo `User`. No existe una
tabla de proveedores en el esquema actual.

El cuerpo de los CRUD usa nombres de columnas en `snake_case` o propiedades en
`camelCase`; no se aceptan IDs, contraseñas hash, campos de ámbito ni marcas de
tiempo controladas por el servidor. Al crear usuarios se envía `password` (12+
caracteres), que se guarda como scrypt; el hash nunca se devuelve. Para cambiar
la contraseña propia: `PATCH /api/users/:id/password` con
`{ "currentPassword": "...", "newPassword": "..." }`. Al crear un cliente se
puede enviar `{ "person": { ... }, ...camposDelCliente }`; persona y cliente
se insertan en una única transacción.

Los cambios de roles y asignaciones requieren el permiso correspondiente y no
pueden conceder acciones que quien los realiza no tenga. El permiso raíz `*`
solo puede asignarlo un superadministrador. La modificación de empresas y las
escrituras en catálogos globales también requieren `*`. Auditoría es de solo
lectura. Las tablas `session` y `schema_migrations` no se exponen.
Reportes iniciales: `GET /api/reports/inventory` y
`GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD`, ambos requieren
`Report[READ]`.

### Estructura del backend

- `src/common/authorization`: validación de permisos y contexto del usuario.
- `src/common/crud`: operaciones CRUD compartidas y registro de recursos.
- `src/modules`: módulos por dominio, con controladores y recursos del dominio.
- `src/modules/api`: módulo agregador importado por la aplicación.

Esta organización mantiene las rutas públicas existentes y permite desarrollar
cada dominio en su propio módulo sin duplicar la lógica CRUD común.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
