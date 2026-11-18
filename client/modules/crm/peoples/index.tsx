import { AnimatePresence, motion } from "motion/react";
import { CircleSlash, Eye, EyeClosed, Fingerprint, Mail, MapPin, Pencil, Phone, Plus, Search,  User2 } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "@formkit/tempo";
import { clsx } from "clsx";
import { text } from "@/modules/language";
import { Table, type TableAction } from "@/modules/common/table";
import { useToast } from "@/modules/common/toast";
import type { People } from "@/lib/crm";
import { PersonFormModal } from "./form/create-person";
import { DisablePersonModal } from "./form/disable-person";
import { usePeople } from "./form/hook";
import { ViewPersonModal } from "./form/view-person";

export const primaryColor20 = "bg-linear-to-tr from-emerald-500/20 via-green-500/20 to-120% to-yellow-400/20";
export const primaryColor = "bg-linear-to-tr from-emerald-500 via-green-500 to-120% to-yellow-400";

export const Peoples = () => {
    const [closeInfoSecction, setCloseInfoSecction] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const { notify } = useToast();
    const {
        people,
        documentTypes,
        loading,
        loadingSearch,
        saving,
        modalMode,
        selectedPerson,
        search,
        clearSearch,
        openModal,
        closeModal,
        savePerson,
        disablePerson,
    } = usePeople();

    useEffect(() => {
        const savedPreference = localStorage.getItem("closeInfoSecction");
        if (savedPreference) setCloseInfoSecction(JSON.parse(savedPreference));
    }, []);

    const toggleInfoSecction = () => {
        const nextValue = !closeInfoSecction;
        localStorage.setItem("closeInfoSecction", JSON.stringify(nextValue));
        setCloseInfoSecction(nextValue);
    };

    const actions: TableAction<People>[] = [
        {
            label: text("modules.crm.people.view"),
            icon: <Eye size={16} />,
            onClick: (person) => openModal("view", person),
        },
        {
            label: text("modules.crm.people.edit"),
            icon: <Pencil size={16} />,
            hidden: (person) => !person.is_active,
            onClick: (person) => openModal("edit", person),
        },
        {
            label: text("modules.crm.people.disable"),
            icon: <CircleSlash size={16} />,
            className: "text-error hover:bg-error/10",
            hidden: (person) => !person.is_active,
            onClick: (person) => openModal("disable", person),
        },
    ];

    return (
        <div className="min-h-full bg-base-200/50 pb-8">
            <header className="flex h-16 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4 lg:px-10">
                <span className={
                    clsx(
                        "flex size-9 items-center justify-center  rounded-sm ",
                        primaryColor20
                    )
                }>
                    <User2 size={19} />
                </span>
                <div>
                    <span className="text-sm font-semibold text-base-content/80">
                        {text("modules.crm.navigation.people")}
                    </span>
                    <p className="text-xs text-base-content/50">{text("modules.crm.people.headerDescription")}</p>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
                <AnimatePresence initial={false}>
                    {!closeInfoSecction && (
                        <motion.section
                            key="people-intro"
                            initial={{ opacity: 0, height: 0, y: -8 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="relative overflow-hidden rounded-sm border border-emerald-800/10 bg-base-100 p-3 px-5 shadow-sm ">

                                <div className="absolute -right-8 -top-20 size-48 rounded-full bg-emerald-400/10 blur-2xl" />
                                <button
                                    type="button"
                                    onClick={toggleInfoSecction}
                                    className="btn btn-circle btn-sm btn-ghost absolute right-3 top-3"
                                    aria-label={text("modules.crm.people.hideInformation")}
                                    title={text("modules.crm.people.hideInformation")}
                                >
                                    <EyeClosed size={15} />
                                </button>
                                <div className="relative max-w-3xl pl-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{text("modules.crm.people.introLabel")}</p>
                                    <h1 className="mt-1 text-xl font-semibold opacity-80 tracking-tight sm:text-2xl">
                                        {text("modules.crm.people.introTitle")}
                                    </h1>
                                    <p className="mt-2 text-sm leading-6 text-base-content/65">
                                        {text("modules.crm.people.introDescription")}
                                    </p>
                                </div>
                            </div>
                        </motion.section>
                    )}
                    {closeInfoSecction && (
                        <motion.button
                            key="show-people-info"
                            type="button"
                            onClick={toggleInfoSecction}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="btn btn-ghost btn-xs text-base-content/55"
                        >
                            <Eye size={14} />                             {text("modules.crm.people.showInformation")}
                        </motion.button>
                    )}
                </AnimatePresence>

                <section className="overflow-hidden rounded-sm border border-base-300 bg-base-100 shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-base-300 p-4">
                        <div className="min-w-0">
                            <h2 className="font-bold tracking-tight">{text("modules.crm.people.listTitle")}</h2>
                            <p className="text-xs text-base-content/55">{text("modules.crm.people.listDescription")}</p>
                        </div>

                        <div className="flex  gap-2 w-full">
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
                                        className="grow "
                                        placeholder={text("modules.crm.people.searchPlaceholder")}
                                        aria-label={text("modules.crm.people.searchAriaLabel")}
                                    />
                                </label>
                                <button
                                    type="submit"
                                    disabled={loadingSearch}
                                    aria-label={text("modules.crm.people.search")}
                                    className={clsx("btn btn-sm join-item border-0 text-white", primaryColor)}
                                >
                                    {loadingSearch ? <span className="loading loading-spinner loading-xs" /> : <Search size={16} />}
                                </button>
                            </form>

                            <button type="button" onClick={() => {
                                clearSearch();
                                setSearchValue("");
                            }} className="btn btn-sm btn-ghost">
                                {text("modules.crm.people.clear")}
                            </button>
                            <button
                                type="button"
                                onClick={() => openModal("create")}
                                disabled={loading}
                                className={`btn btn-sm ml-auto border-0 text-white shadow-sm ${primaryColor}`}
                            >
                                <Plus size={16} /> {text("modules.crm.people.create")}
                            </button>
                        </div>
                    </div>

                    <div className="p-3 sm:p-5 max-h-150">
                        <Table<People>
                            data={people}
                            loading={loading || loadingSearch}
                            emptyMessage={searchValue
                                ? text("modules.crm.people.noSearchResults")
                                : text("modules.crm.people.empty")}
                            columns={[
                                {
                                    key: "id",
                                    label: text("modules.crm.people.id"),
                                    className: "w-20 font-medium",
                                    render: (value) => <span className="kbd kbd-xs cursor-copy" title={text("modules.crm.people.copyId")} onClick={async () => {
                                        if (typeof value !== "string") return;
                                        try {
                                            await navigator.clipboard.writeText(value);
                                            notify("info", text("modules.crm.people.idCopied"));
                                        } catch {
                                            notify("error", text("modules.crm.people.copyFailed"));
                                        }
                                    }}>{typeof value === "string" ? value.substring(0, 6) : "—"}</span>,
                                },
                                {
                                    key: "first_name",
                                    label: text("modules.crm.people.name"),
                                    className: "min-w-36 font-semibold",
                                    render: (_, person) => <span>{[person.first_name, person.middle_name].filter(Boolean).join(" ")}</span>,
                                },
                                {
                                    key: "last_name",
                                    label: text("modules.crm.people.lastNames"),
                                    className: "min-w-36",
                                    render: (_, person) => <span>{[person.last_name, person.second_last_name].filter(Boolean).join(" ") || "—"}</span>,
                                },
                                {
                                    key: "document_number",
                                    label: text("modules.crm.people.document"),
                                    className: "min-w-36",
                                    render: (value, person) => <span className="inline-flex items-center gap-1.5"><Fingerprint size={13} className="text-base-content/40" />{documentTypes.find((type) => type.id === person.document_types_people_id)?.name ?? text("modules.crm.people.genericDocument")} {String(value ?? "—")}</span>,
                                },
                                {
                                    key: "phone",
                                    label: text("modules.crm.people.phone"),
                                    render: (value) => <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-base-content/40" />{String(value ?? "—")}</span>,
                                },
                                {
                                    key: "email",
                                    label: text("modules.crm.people.email"),
                                    className: "max-w-52",
                                    render: (value) => <span className="inline-flex max-w-full items-center gap-1.5 truncate"><Mail size={13} className="shrink-0 text-base-content/40" />{String(value ?? "—")}</span>,
                                },
                                {
                                    key: "address_str",
                                    label: text("modules.crm.people.address"),
                                    className: "max-w-50 ",
                                    render: (_, person) => {
                                        const address = person.address_fields
                                            .map((field) => person.address?.[field] ?? "")
                                            .filter(Boolean)
                                            .join(", ");
                                        return <span className="inline-flex max-w-50 overflow-hidden items-center gap-1.5 truncate"><MapPin size={13} className="shrink-0 text-base-content/40" />{address || "—"}</span>

                                    },
                                },
                                {
                                    key: "birth_date",
                                    label: text("modules.crm.people.birthDate"),
                                    className: "whitespace-nowrap",
                                    render: (value) => value ? format(value as string | Date, "medium") : "—",
                                },
                                {
                                    key: "is_active",
                                    label: text("modules.crm.people.status"),
                                    render: (value) => (
                                        <span className={clsx("badge badge-sm border-0", value ? "bg-emerald-500/10 text-emerald-800" : "bg-base-300 text-base-content/60")}>
                                            <span className={clsx("mr-1 size-1.5 rounded-full", value ? "bg-emerald-500" : "bg-base-content/40")} />
                                            {value
                                                ? text("modules.crm.people.active")
                                                : text("modules.crm.people.inactive")}
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

            <PersonFormModal
                open={modalMode === "create" || modalMode === "edit"}
                person={modalMode === "edit" ? selectedPerson : null}
                documentTypes={documentTypes}
                saving={saving}
                primaryColor={primaryColor}
                onClose={closeModal}
                onSave={savePerson}
            />
            <ViewPersonModal
                person={modalMode === "view" ? selectedPerson : null}
                documentTypes={documentTypes}
                primaryColor={primaryColor}
                onClose={closeModal}
                onEdit={() => selectedPerson && openModal("edit", selectedPerson)}
            />
            <DisablePersonModal
                person={modalMode === "disable" ? selectedPerson : null}
                saving={saving}
                primaryColor={primaryColor}
                onClose={closeModal}
                onConfirm={() => void disablePerson()}
            />
        </div>
    );
};
