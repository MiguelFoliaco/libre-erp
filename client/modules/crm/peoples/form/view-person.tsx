import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Copy, Fingerprint, Mail, MapPin, Pencil, Phone, X } from "lucide-react";
import type { ReactNode } from "react";
import { config, addressFieldLabels } from "../../../../config";
import type { DocumentTypePeople, People } from "../../../../lib/crm";
import { text } from "../../../language";
import { useToast } from './../../../common/toast';
import { clsx } from "clsx";


export const disableColor = "bg-linear-to-tr from-black/50 to-120% to-gray-400/50";


export function ViewPersonModal({
    person,
    documentTypes,
    primaryColor,
    onClose,
    onEdit,
}: {
    person: People | null;
    documentTypes: DocumentTypePeople[];
    primaryColor: string;
    onClose: () => void;
    onEdit: () => void;
}) {

    const { notify } = useToast()

    const fullName = person
        ? [person.first_name, person.middle_name, person.last_name, person.second_last_name]
            .filter(Boolean)
            .join(" ")
        : "";
    const documentType = documentTypes.find((type) => type.id === person?.document_types_people_id);
    const addressParts = person
        ? config.addressConfig.order
            .map((field) => person.address?.[field] ? {
                label: text(addressFieldLabels[field]),
                value: person.address[field],
            } : null)
            .filter((entry): entry is { label: string; value: string } => entry !== null)
        : [];

    const copyAddress = () => {
        if (!addressParts.length) return;
        navigator.clipboard.writeText(addressParts.map(({ value }) => value).join(", "));
        notify("success", "Dirección copiada al portapapeles");
    }

    return (
        <AnimatePresence>
            {person && (
                <motion.div
                    className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) onClose();
                    }}
                >
                    <motion.section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="person-details-title"
                        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm bg-base-100 shadow-2xl shadow-slate-950/25"
                        initial={{ opacity: 0, y: 22, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 14, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 280, damping: 27 }}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className={
                            clsx(
                                `relative overflow-hidden px-6 pb-6 pt-7 text-white sm:px-8`,
                                person.is_active ? primaryColor : disableColor
                            )
                        }>
                            <div className="absolute -right-8 -top-20 size-56 rounded-full border border-white/15" />
                            <div className="absolute -right-1 top-8 size-36 rounded-full border border-white/10" />
                            <button type="button" className="btn btn-circle btn-sm btn-ghost absolute right-4 top-4 text-white hover:bg-white/15" aria-label="Cerrar" onClick={onClose}>
                                <X size={18} />
                            </button>
                            <div className="relative flex items-center gap-4">
                                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-2xl font-bold shadow-lg backdrop-blur">
                                    {fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Ficha de persona</p>
                                    <h2 id="person-details-title" className="mt-1 truncate text-2xl font-bold">{fullName}</h2>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                        <span className="rounded-full bg-white/15 px-2.5 py-1">{documentType?.name ?? "Documento"}</span>
                                        <span className="font-mono text-white/80">{person.document_number || "Sin número registrado"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative mt-5 flex items-center justify-between border-t border-white/20 pt-4 text-sm">
                                <span className={`badge border-0 ${person.is_active ? "bg-white/20 text-white" : "bg-slate-950/20 text-white/80"}`}>
                                    <span className={`mr-1.5 size-1.5 rounded-full ${person.is_active ? "bg-emerald-200" : "bg-white/60"}`} />
                                    {person.is_active ? "Registro activo" : "Registro deshabilitado"}
                                </span>
                                <span className="font-mono text-xs text-white/65">ID {person.id.slice(0, 8)}</span>
                            </div>
                        </div>

                        <div className="space-y-5 p-5 sm:p-8">
                            <section className="grid gap-3 sm:grid-cols-2">
                                <Detail label="Correo electrónico" value={person.email} icon={<Mail size={16} />} />
                                <Detail label="Teléfono" value={person.phone} icon={<Phone size={16} />} />
                                <Detail label="Fecha de nacimiento" value={person.birth_date ? new Date(`${person.birth_date.slice(0, 10)}T00:00:00`).toLocaleDateString() : ""} icon={<CalendarDays size={16} />} />
                                <Detail label="Documento" value={[documentType?.name, person.document_number].filter(Boolean).join(" · ")} icon={<Fingerprint size={16} />} />
                            </section>

                            <section className="rounded-sm border border-base-300 bg-base-200/35 p-4 sm:p-5">
                                <div className="mb-3 flex items-center gap-2">
                                    <MapPin size={16} className="text-emerald-700" />
                                    <h3 className="font-semibold">Domicilio registrado</h3>
                                    <div role="button" onClick={copyAddress} className="tooltip tooltip-bottom ml-auto" data-tip="Copiar domicilio">
                                        <button className="btn btn-circle btn-sm btn-ghost " ><Copy size={14} /></button>
                                    </div>
                                </div>
                                {addressParts.length > 0 ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {addressParts.map(({ label, value }) => (
                                            <div key={label}>
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">{label}</p>
                                                <p className="mt-0.5 text-sm">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-base-content/55">No hay domicilio registrado.</p>}
                            </section>

                            <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                                <button type="button" className="btn btn-ghost" onClick={onClose}>Cerrar</button>
                                {person.is_active && (
                                    <button type="button" className={`btn border-0 text-white ${primaryColor}`} onClick={onEdit}>
                                        <Pencil size={15} /> Editar ficha
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.section>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Detail({ label, value, icon }: { label: string; value: string | null | undefined; icon: ReactNode }) {
    return (
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-base-300 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-base-200 text-base-content/60">{icon}</span>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">{label}</p>
                <p className="truncate text-sm font-medium">{value || "No registrado"}</p>
            </div>
        </div>
    );
}
