
import { useMemo, useState } from "react";
import {
    Bell,
    CalendarDays,
    ChartColumn,
    Check,
    CircleHelp,
    FileText,
    LockKeyhole,
    Mail,
    MoreHorizontal,
    Package,
    Plus,
    Search,
    ShieldCheck,
    ShoppingCart,
    Truck,
    UserRound,
    UsersRound,
    Warehouse,
} from "lucide-react";
import { text } from "../language";
import { Link } from "react-router";

const primaryColor = 'bg-linear-to-tr from-red-500 to-120% to-orange-600'
const primaryColor20 = 'bg-linear-to-tr from-red-500/10 to-120% to-orange-600/10'
const textColor =
    "bg-linear-to-r from-red-500 to-orange-600 bg-clip-text text-transparent";

const users = [
    {
        name: "María Fernanda López",
        email: "maria.lopez@libreerp.com",
        initials: "ML",
        roles: ["Administradora", "Ventas"],
        status: "Activo",
        color: primaryColor + ' text-white',
    },
    {
        name: "Carlos Mendoza",
        email: "carlos.mendoza@libreerp.com",
        initials: "CM",
        roles: ["Cajero"],
        status: "Activo",
        color: "bg-info text-info-content",
    },
    {
        name: "Ana Torres",
        email: "ana.torres@libreerp.com",
        initials: "AT",
        roles: ["Inventario"],
        status: "Activo",
        color: "bg-secondary text-secondary-content",
    },
    {
        name: "Jorge Ramírez",
        email: "jorge.ramirez@libreerp.com",
        initials: "JR",
        roles: ["Consulta"],
        status: "Invitación pendiente",
        color: "bg-warning text-warning-content",
    },
];

const permissionGroups = [
    {
        name: "Ventas y POS",
        description: "Caja, ventas y devoluciones",
        icon: ShoppingCart,
        permissions: [
            ["Consultar ventas", true],
            ["Registrar ventas", true],
            ["Aplicar descuentos", true],
            ["Cancelar ventas", false],
        ],
    },
    {
        name: "Productos",
        description: "Catálogo y precios",
        icon: Package,
        permissions: [
            ["Consultar productos", true],
            ["Crear y editar productos", true],
            ["Eliminar productos", false],
            ["Cambiar precios", false],
        ],
    },
    {
        name: "Inventario",
        description: "Existencias, movimientos y almacenes",
        icon: Warehouse,
        permissions: [
            ["Consultar existencias", true],
            ["Registrar movimientos", false],
            ["Ajustar inventario", false],
            ["Administrar almacenes", false],
        ],
    },
    {
        name: "Compras",
        description: "Proveedores y órdenes de compra",
        icon: Truck,
        permissions: [
            ["Consultar compras", false],
            ["Registrar compras", false],
            ["Administrar proveedores", false],
        ],
    },
    {
        name: "Documentos y reportes",
        description: "Documentos comerciales e información",
        icon: FileText,
        permissions: [
            ["Consultar documentos", true],
            ["Emitir documentos", true],
            ["Consultar reportes", false],
            ["Exportar información", false],
        ],
    },
    {
        name: "Usuarios y roles",
        description: "Acceso y administración del equipo",
        icon: UsersRound,
        permissions: [
            ["Consultar usuarios", false],
            ["Invitar usuarios", false],
            ["Administrar roles", false],
        ],
    },
];

export const Manager = () => {

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [search, setSearch] = useState("");

    const selectedUser = users[selectedIndex];

    const filteredUsers = useMemo(
        () =>
            users
                .map((user, index) => ({ ...user, index }))
                .filter(
                    (user) =>
                        user.name.toLowerCase().includes(search.toLowerCase()) ||
                        user.email.toLowerCase().includes(search.toLowerCase()),
                ),
        [search],
    );

    const totalPermissions = permissionGroups.reduce(
        (total, group) => total + group.permissions.length,
        0,
    );

    const enabledPermissions = permissionGroups.reduce(
        (total, group) =>
            total + group.permissions.filter((permission) => permission[1]).length,
        0,
    );


    return (
        <div>
            {/* Topbar */}
            <header className="navbar min-h-14 border-b border-base-300 bg-base-100 px-4" >
                <div className="breadcrumbs text-sm">
                    <ul>
                        <li><Link to="/" className="hover:text-error">Inicio</Link></li>
                        <li><Link to="/start/users-and-roles/manager">{text('startModule.listAppliaction.userAndRoles')}</Link></li>
                    </ul>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                    <button className="btn btn-ghost btn-square btn-sm" aria-label="Ayuda">
                        <CircleHelp size={18} />
                    </button>
                    <button className="btn btn-ghost btn-square btn-sm" aria-label="Notificaciones">
                        <Bell size={18} />
                    </button>
                    <div className="avatar placeholder ml-2">
                        <div className={"size-8 rounded-full items-center justify-center flex  " + primaryColor} >
                            <span className="text-sm text-white">AF</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-375 space-y-5 p-4 sm:p-6">

                {/* Page heading */}
                <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <div className={"mb-1 flex items-center gap-2 font-medium "}>
                            <ShieldCheck size={15} className={'text-red-500'} />
                            <p className={textColor}>
                                Seguridad y accesos
                            </p>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Usuarios y roles
                        </h1>
                        <p className="mt-1 text-sm text-base-content/55">
                            Administra los miembros de tu equipo y sus permisos de acceso.
                        </p>
                    </div>

                    <button className={"btn btn-error btn-sm text-white " + primaryColor}>
                        <Plus size={16} />
                        Invitar usuario
                    </button>
                </section>

                {/* Statistics */}
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                        {
                            label: "Usuarios",
                            value: "24",
                            detail: "3 nuevos este mes",
                            icon: UsersRound,
                            color: "text-error",
                            bg: primaryColor20,
                        },
                        {
                            label: "Roles configurados",
                            value: "6",
                            detail: "Roles personalizados",
                            icon: ShieldCheck,
                            color: "text-error",
                            bg: primaryColor20,
                        },
                        {
                            label: "Invitaciones pendientes",
                            value: "2",
                            detail: "Por aceptar",
                            icon: LockKeyhole,
                            color: "text-error",
                            bg: primaryColor20,
                        },
                    ].map(({ label, value, detail, icon: Icon, color, bg }) => (
                        <div
                            key={label}
                            className="card border border-base-300 bg-base-100 shadow-sm"
                        >
                            <div className="card-body flex-row items-center gap-3 p-4">
                                <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${bg} ${color}`}>
                                    <Icon size={19} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-base-content/55">{label}</p>
                                    <p className="text-2xl font-bold leading-tight">{value}</p>
                                </div>
                                <span className="hidden text-xs text-base-content/90 sm:block">
                                    {detail}
                                </span>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Content */}
                <section className="grid min-w-0 gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">

                    {/* User list */}
                    <aside className="card h-fit border border-base-300 bg-base-100 shadow-sm">
                        <div className="card-body gap-3 p-3 sm:p-4">

                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold">Equipo</h2>
                                    <p className="text-xs text-base-content/50">
                                        24 usuarios registrados
                                    </p>
                                </div>
                                <button className="btn btn-ghost btn-square btn-xs" aria-label="Opciones">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>

                            <label className="input input-sm flex w-full items-center gap-2 bg-base-200/60">
                                <Search size={16} className="text-base-content/40" />
                                <input
                                    className="grow"
                                    placeholder="Buscar usuario..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </label>

                            <div className="divider my-0" />

                            <div className="space-y-1">
                                {filteredUsers.map((user) => (
                                    <button
                                        key={user.email}
                                        onClick={() => setSelectedIndex(user.index)}
                                        className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${selectedIndex === user.index
                                            ? "border-primary/30 bg-primary/5"
                                            : "border-transparent hover:bg-base-200"
                                            }`}
                                    >
                                        <div className="avatar placeholder">
                                            <div className={`size-10 rounded-full ${user.color}`}>
                                                <span className="text-xs font-bold">
                                                    {user.initials}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {user.name}
                                            </p>
                                            <p className="truncate text-xs text-base-content/50">
                                                {user.email}
                                            </p>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {user.roles.map((role) => (
                                                    <span className="badge badge-ghost badge-xs" key={role}>
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <span
                                            className={`size-2 shrink-0 rounded-full ${user.status === "Activo"
                                                ? primaryColor
                                                : "bg-warning"
                                                }`}
                                            title={user.status}
                                        />
                                    </button>
                                ))}

                                {filteredUsers.length === 0 && (
                                    <div className="py-8 text-center text-sm text-base-content/50">
                                        No se encontraron usuarios.
                                    </div>
                                )}
                            </div>

                            <div className="divider my-0" />

                            <button className={"btn btn-ghost btn-sm w-full " + textColor}>
                                Ver todos los usuarios
                            </button>
                        </div>
                    </aside>

                    {/* User details */}
                    <div className="min-w-0 space-y-4">

                        {/* Profile */}
                        <section className="card border border-base-300 bg-base-100 shadow-sm">
                            <div className="card-body gap-4 p-4 sm:p-5">

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="avatar placeholder">
                                            <div className={`size-12 rounded-xl ${selectedUser.color}`}>
                                                <span className="text-base font-bold">
                                                    {selectedUser.initials}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="font-bold">
                                                    {selectedUser.name}
                                                </h2>
                                                <span
                                                    className={`badge badge-sm ${selectedUser.status === "Activo"
                                                        ? "badge-error badge-outline"
                                                        : "badge-warning badge-outline"
                                                        }`}
                                                >
                                                    {selectedUser.status}
                                                </span>
                                            </div>
                                            <p className="truncate text-xs text-base-content/70">
                                                {selectedUser.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="dropdown dropdown-end">
                                        <button tabIndex={0} className="btn btn-ghost btn-square btn-sm">
                                            <MoreHorizontal size={19} />
                                        </button>
                                        <ul tabIndex={0} className="dropdown-content menu z-10 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                                            <li><a>Editar usuario</a></li>
                                            <li><a>Restablecer contraseña</a></li>
                                            <li><a className="text-error">Desactivar usuario</a></li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="divider my-0" />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail size={16} className="text-base-content/40" />
                                        <span className="text-base-content/60">Correo:</span>
                                        <span className="truncate font-medium">
                                            {selectedUser.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CalendarDays size={16} className="text-base-content/40" />
                                        <span className="text-base-content/60">Miembro desde:</span>
                                        <span className="font-medium">Ene. 2024</span>
                                    </div>
                                </div>

                                <div className="divider my-0" />

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="mr-2 flex items-center gap-2 text-sm font-semibold">
                                        <ShieldCheck size={16} className="text-error" />
                                        Roles asignados
                                    </div>

                                    {selectedUser.roles.map((role) => (
                                        <span
                                            key={role}
                                            className={"badge badge-sm gap-1.5 border-error/20  text-error " + primaryColor20}
                                        >
                                            <ShieldCheck size={13} />
                                            {role}
                                        </span>
                                    ))}

                                    <button className="btn btn-outline btn-xs">
                                        <Plus size={14} />
                                        Asignar rol
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Permissions */}
                        <section className="card border border-base-300 bg-base-100 shadow-sm">
                            <div className="card-body gap-4 p-4 sm:p-5">

                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <LockKeyhole size={17} className="text-error" />
                                            <h2 className="font-bold">Permisos de acceso</h2>
                                        </div>
                                        <p className="mt-1 text-xs text-base-content/50">
                                            Permisos efectivos del usuario según sus roles.
                                        </p>
                                    </div>

                                    <span className="badge badge-ghost">
                                        Solo lectura
                                    </span>
                                </div>

                                {/* Permission summary */}
                                <div className="rounded-lg bg-base-200/60 p-3">
                                    <div className="mb-2 flex items-center justify-between text-xs">
                                        <span className="font-medium">
                                            Permisos habilitados
                                        </span>
                                        <span className="font-semibold tabular-nums">
                                            {enabledPermissions} / {totalPermissions}
                                        </span>
                                    </div>

                                    <progress
                                        className={"progress h-1.5 progress-error w-full "}
                                        value={enabledPermissions}
                                        max={totalPermissions}
                                    />

                                    <p className="mt-2 flex items-center gap-1.5 text-xs text-base-content/50">
                                        <ShieldCheck size={13} className="text-error" />
                                        Los permisos se heredan de los roles asignados.
                                    </p>
                                </div>

                                {/* Permission groups */}
                                <div className="space-y-2">
                                    {permissionGroups.map(
                                        ({ name, description, icon: Icon, permissions }, index) => {
                                            const enabled = permissions.filter(
                                                (permission) => permission[1],
                                            ).length;

                                            return (
                                                <details
                                                    key={name}
                                                    className="collapse collapse-arrow rounded-lg border border-base-300 bg-base-100"
                                                    open={index === 0}
                                                >
                                                    <summary className="collapse-title flex min-h-14 items-center gap-3 py-2 pr-10">
                                                        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-base-200 text-base-content">
                                                            <Icon size={17} />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold">{name}</p>
                                                            <p className="text-xs text-base-content/50">
                                                                {description}
                                                            </p>
                                                        </div>

                                                        <span className="badge badge-ghost badge-sm">
                                                            {enabled}/{permissions.length}
                                                        </span>
                                                    </summary>

                                                    <div className="collapse-content">
                                                        <div className="space-y-1 border-t border-base-300 pt-3">
                                                            {permissions.map(([label, checked]) => (
                                                                <label
                                                                    key={label.toString()}
                                                                    className="flex min-h-9 items-center gap-3 rounded-md px-2 text-sm hover:bg-base-200/60"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="checkbox checkbox-error checkbox-sm"
                                                                        checked={checked as boolean}
                                                                        disabled
                                                                        readOnly
                                                                    />
                                                                    <span className={checked ? "" : "text-base-content/45"}>
                                                                        {label}
                                                                    </span>
                                                                    {checked && (
                                                                        <Check
                                                                            size={14}
                                                                            className="ml-auto text-error"
                                                                        />
                                                                    )}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </details>
                                            );
                                        },
                                    )}
                                </div>

                                <div className="flex items-start gap-2 border-t border-base-300 pt-3 text-xs leading-relaxed text-base-content/50">
                                    <UserRound size={15} className="mt-0.5 shrink-0" />
                                    La edición de permisos se administra desde la configuración
                                    de roles.
                                </div>
                            </div>
                        </section>
                    </div>
                </section>

                <footer className="flex items-center justify-center gap-2 pb-2 text-xs text-base-content/40">
                    <ChartColumn size={14} />
                    LibreERP · Administración de accesos
                </footer>
            </div>
        </div>
    )
}


export default Manager
