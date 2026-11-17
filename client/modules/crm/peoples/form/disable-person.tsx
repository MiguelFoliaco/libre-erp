import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Ban, X } from "lucide-react";
import type { People } from "../../../../lib/crm";

export function DisablePersonModal({
    person,
    saving,
    primaryColor,
    onClose,
    onConfirm,
}: {
    person: People | null;
    saving: boolean;
    primaryColor: string;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const name = person
        ? [person.first_name, person.middle_name, person.last_name, person.second_last_name]
            .filter(Boolean)
            .join(" ")
        : "";

    return (
        <AnimatePresence>
            {person && (
                <motion.div
                    className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !saving) onClose();
                    }}
                >
                    <motion.section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="disable-person-title"
                        className="relative w-full max-w-md overflow-hidden rounded-sm bg-base-100 shadow-2xl shadow-slate-950/25"
                        initial={{ opacity: 0, y: 18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <button type="button" className="btn btn-circle btn-ghost btn-sm absolute right-4 top-4" aria-label="Cerrar" onClick={onClose} disabled={saving}>
                            <X size={17} />
                        </button>
                        <div className="p-6 sm:p-8">
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
                                <AlertTriangle size={23} />
                            </span>
                            <h2 id="disable-person-title" className="mt-5 text-xl font-bold">¿Deshabilitar a esta persona?</h2>
                            <p className="mt-2 text-sm leading-6 text-base-content/65">
                                <strong className="text-base-content">{name}</strong> dejará de estar disponible para nuevas operaciones. Su ficha y sus relaciones se conservarán; no se eliminará ningún dato.
                            </p>
                            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Conservar activo</button>
                                <button type="button" className="btn btn-warning" onClick={onConfirm} disabled={saving}>
                                    {saving ? <span className="loading loading-spinner loading-sm" /> : <Ban size={16} />}
                                    Deshabilitar
                                </button>
                            </div>
                        </div>
                    </motion.section>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
