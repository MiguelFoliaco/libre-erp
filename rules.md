
las acciones en roles tendran el siguiente formato para permitir o no que hacer en la aplicacion:
* = Significa que puedes hacer todo
ModuleName[*] = significa que puedes hacer todo en la tabla
ModuleName[READ|UPDATE|INSERT|DELETE] = dentro de corchetes estaran las acciones

El array de acciones seria algo asi: Product[READ|UPDATE], Brand[READ], CLIENT[INSERT|UPDATE]

estos son los principales roles
ROLES
 - SUPER ADMIN
   actions: *
 
 - ADMIN COMPANY
   actions: TODO LECTURA, ingresos de productos, marcas, clientes, proveedores y reportes(ALL)
 
 - SallerMan:
 - actions: Product[READ], Document[Insert|Update], REPORTES [READ|OMSERT] | CLIENT[READ|INSERT] | 

  - USUARIO DE CAJA
  - actions lo mismo que seller man pero solo para pos
  
  - Administrador de bodega
  actions: Acciones para administrar inventario


Estos son los modulos:
PRODUCT
MARCA
DEPARTAMENTO(o el que se refiere en sql)
VENDEDORES
USUARIOS - cambios de contraseña, crear usuarios
CLIENTES(crear cliente y persona)
ROLES
REPORTES
DOCUMENTOS
TIPOS DE DOCUMENTOS
INVENTARIO(ingresos, traslados, devoluciones, entregas de proveedores)
CONTADURIA(Algo sencillo para empezar, reportes mes a mes y algunos reportes custom) -- puedes no crear este modulo o algo simple para empezar
TAX MANAGER (Administrador de impuestos)


--

Eso seria todo, es hacer un crud para consumirlo desde cliente