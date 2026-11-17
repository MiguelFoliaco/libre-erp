import { AnimatePresence, motion } from "motion/react";
import {  CircleSlash, Coins, Eye, EyeClosed, Fingerprint, Pencil, Phone, Plus, Search,  } from "lucide-react";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Table, type TableAction } from "../../common/table";
import { useToast } from "../../common/toast";
import type { CustomerSearchResult } from "../../../lib/crm";
import { CustomerFormModal } from "./form/customer-form";
import { DisableClientModal } from "./form/disable-client";
import { useClients } from "./form/hook";
import { ViewClientModal } from "./form/view-client";

export const primaryColor = "bg-linear-to-tr from-emerald-500 via-green-500 to-120% to-yellow-400";
export const primaryColor20 = "bg-linear-to-tr from-emerald-500/20 via-green-500/20 to-120% to-yellow-400/20";

export function Clients() {
    const [closeInfoSection, setCloseInfoSection] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const { notify } = useToast();
    const {
        clients,
        customerTypes,
        documentTypes,
        loading,
        loadingSearch,
        saving,
        modalMode,
        selectedClient,
        search,
        clearSearch,
        openModal,
        closeModal,
        saveClient,
        disableClient,
    } = useClients();

    useEffect(() => {
        const savedPreference = localStorage.getItem("closeClientInfoSection");
        if (savedPreference) setCloseInfoSection(JSON.parse(savedPreference));
    }, []);

    const toggleInfoSection = () => {
        const nextValue = !closeInfoSection;
        localStorage.setItem("closeClientInfoSection", JSON.stringify(nextValue));
        setCloseInfoSection(nextValue);
    };

    const actions: TableAction<CustomerSearchResult>[] = [
        {
            label: "Ver cliente",
            icon: <Eye size={16} />,
            onClick: (client) => openModal("view", client),
        },
        {
            label: "Editar",
            icon: <Pencil size={16} />,
            hidden: (client) => !client.is_active,
            onClick: (client) => openModal("edit", client),
        },
        {
            label: "Deshabilitar",
            icon: <CircleSlash size={16} />,
            className: "text-error hover:bg-error/10",
            hidden: (client) => !client.is_active,
            onClick: (client) => openModal("disable", client),
        },
    ];

    return (
        <div className="min-h-full bg-base-200/50 pb-8">
            <header className="flex h-16 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4 lg:px-10">
                <span className={
                    clsx(
                        "flex size-9 items-center justify-center rounded-sm  text-emerald-700",
                        primaryColor20
                    )
                }>
                    <Coins size={19} />
                </span>
                <div>
                    <span className="text-sm font-semibold text-base-content/80">Clientes</span>
                    <p className="text-xs text-base-content/50">Cuentas y condiciones comerciales</p>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
                <AnimatePresence initial={false}>
                    {!closeInfoSection && (
                        <motion.section
                            key="client-intro"
                            initial={{ opacity: 0, height: 0, y: -8 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="relative overflow-hidden rounded-sm border border-emerald-800/10 bg-base-100 py-3 px-5 shadow-sm">
                                <div className="absolute -right-8 -top-20 size-48 rounded-full bg-emerald-400/10 blur-2xl" />
                                <button
                                    type="button"
                                    onClick={toggleInfoSection}
                                    className="btn btn-circle btn-sm btn-ghost absolute right-3 top-3"
                                    aria-label="Ocultar información"
                                    title="Ocultar"
                                >
                                    <EyeClosed size={15} />
                                </button>
                                <div className="relative max-w-3xl pl-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Clientes · CRM</p>
                                    <h1 className="mt-1 text-xl font-semibold opacity-90 tracking-tight sm:text-2xl">Relaciones comerciales, en contexto</h1>
                                    <p className="mt-2 text-sm leading-6 text-base-content/65">
                                        Administra el tipo de cliente, el crédito y sus plazos de pago en una cuenta vinculada
                                        a la ficha personal. Deshabilitar conserva el historial y los datos relacionados.
                                    </p>
                                </div>
                            </div>
                        </motion.section>
                    )}
                    {closeInfoSection && (
                        <motion.button
                            key="show-client-info"
                            type="button"
                            onClick={toggleInfoSection}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="btn btn-ghost btn-xs text-base-content/55"
                        >
                            <Eye size={14} /> Mostrar información
                        </motion.button>
                    )}
                </AnimatePresence>

                <section className="overflow-hidden rounded-sm border border-base-300 bg-base-100 shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-base-300 p-4">
                        <div className="min-w-0">
                            <h2 className="font-bold tracking-tight">Cuentas de clientes</h2>
                            <p className="text-xs text-base-content/55">Busca por persona, documento o código de cliente.</p>
                        </div>
                        <div className="flex gap-2 ">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void search(searchValue);
                                }}
                                className="join w-full sm:w-80"
                            >
                                <label className="input outline-none focus-within:border-primary input-sm join-item flex min-w-0 flex-1 items-center gap-2 border-base-300 bg-base-200/30">
                                    <Search size={15} className="shrink-0 text-base-content/45" />
                                    <input
                                        value={searchValue}
                                        onChange={(event) => setSearchValue(event.target.value)}
                                        placeholder="Nombre, documento o código"
                                        aria-label="Buscar clientes"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    disabled={loadingSearch}
                                    aria-label="Buscar clientes"
                                    className={clsx("btn btn-sm join-item border-0 text-white", primaryColor)}
                                >
                                    {loadingSearch ? <span className="loading loading-spinner loading-xs" /> : <Search size={16} />}
                                </button>
                            </form>
                            <button
                                type="button"
                                onClick={() => {
                                    clearSearch();
                                    setSearchValue("");
                                }}
                                className="btn btn-sm btn-ghost"
                            >
                                Limpiar
                            </button>
                            <button
                                type="button"
                                onClick={() => openModal("create")}
                                disabled={loading}
                                className={`btn btn-sm ml-auto  border-0 text-white  ${primaryColor}`}
                            >
                                <Plus size={16} /> Crear cliente
                            </button>
                        </div>
                    </div>

                    <div className="p-3 sm:p-5">
                        <Table<CustomerSearchResult>
                            data={clients}
                            loading={loading || loadingSearch}
                            emptyMessage={searchValue ? "No encontramos clientes con esos datos." : "Aún no hay clientes registrados."}
                            columns={[
                                {
                                    key: "id",
                                    label: "ID",
                                    className: "w-20 font-medium",
                                    render: (value) => <span className="kbd kbd-xs cursor-copy" title="Copiar ID" onClick={async () => {
                                        if (typeof value !== "string") return;
                                        try {
                                            await navigator.clipboard.writeText(value);
                                            notify("info", "ID copiado al portapapeles.");
                                        } catch {
                                            notify("error", "No se pudo copiar el ID al portapapeles.");
                                        }
                                    }}>{typeof value === "string" ? value.substring(0, 6) : "—"}</span>,
                                },
                                {
                                    key: "person_id",
                                    label: "Persona",
                                    className: "min-w-40 font-semibold",
                                    render: (_, client) => <span>{[client.person.first_name, client.person.middle_name, client.person.last_name, client.person.second_last_name].filter(Boolean).join(" ")}</span>,
                                },
                                {
                                    key: "customer_code",
                                    label: "Código",
                                    render: (value) => String(value ?? "—"),
                                },
                                {
                                    key: "customer_type_name",
                                    label: "Documento",
                                    render: (_, client) => <span className="inline-flex items-center gap-1.5"><Fingerprint size={13} className="text-base-content/40" />{client.person.document_number || "—"}</span>,
                                },
                                {
                                    key: "customer_type_id",
                                    label: "Tipo",
                                    render: (_, client) => client.customer_type_name || customerTypes.find((type) => type.id === client.customer_type_id)?.name || "—",
                                },
                                {
                                    key: "person",
                                    label: "Teléfono",
                                    
                                    render: (_, client) => (
                                        <span className="flex flex-col gap-1 text-xs">
                                            <span className="inline-flex items-center gap-1.5"><Phone size={12} className="text-base-content/40" />{client.person.phone}</span>
                                        </span>
                                    ),
                                },
                                {
                                    key: "updated_at",
                                    label: "Email",
                                    
                                    render: (_, client) => (
                                        <span className="flex flex-col gap-1 text-xs">
                                            <span className="inline-flex items-center gap-1.5"><Phone size={12} className="text-base-content/40" />{client.person.email}</span>
                                        </span>
                                    ),
                                },
                                {
                                    key: "credit_limit",
                                    label: "Límite",
                                    className: "whitespace-nowrap",
                                    render: (value) => Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                                },
                                {
                                    key: "payment_terms_days",
                                    label: "Pago",
                                    className: "whitespace-nowrap",
                                    render: (value) => `${String(value ?? 0)} días`,
                                },
                                {
                                    key: "is_active",
                                    label: "Estado",
                                    render: (value) => (
                                        <span className={clsx("badge badge-sm border-0", value ? "bg-emerald-500/10 text-emerald-800" : "bg-base-300 text-base-content/60")}>
                                            <span className={clsx("mr-1 size-1.5 rounded-full", value ? "bg-emerald-500" : "bg-base-content/40")} />
                                            {value ? "Activo" : "Deshabilitado"}
                                        </span>
                                    ),
                                },
                            ]}
                            actions={actions}
                            pageSize={8}
                        />
                    </div>
                </section>
            </main>

            <CustomerFormModal
                open={modalMode === "create" || modalMode === "edit"}
                client={modalMode === "edit" ? selectedClient : null}
                customerTypes={customerTypes}
                documentTypes={documentTypes}
                saving={saving}
                primaryColor={primaryColor}
                onClose={closeModal}
                onSave={saveClient}
            />
            <ViewClientModal
                client={modalMode === "view" ? selectedClient : null}
                primaryColor={primaryColor}
                onClose={closeModal}
                onEdit={() => selectedClient && openModal("edit", selectedClient)}
            />
            <DisableClientModal
                client={modalMode === "disable" ? selectedClient : null}
                saving={saving}
                primaryColor={primaryColor}
                onClose={closeModal}
                onConfirm={() => void disableClient()}
            />
        </div>
    );
}
