import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Ban, X } from "lucide-react";
import type { CustomerSearchResult } from "../../../../lib/crm";

export function DisableClientModal({
    client,
    saving,
    primaryColor,
    onClose,
    onConfirm,
}: {
    client: CustomerSearchResult | null;
    saving: boolean;
    primaryColor: string;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const name = client?.person
        ? [client.person.first_name, client.person.middle_name, client.person.last_name, client.person.second_last_name]
            .filter(Boolean)
            .join(" ")
        : "";

    return (
        <AnimatePresence>
            {client && (
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
                        aria-labelledby="disable-client-title"
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
                            <h2 id="disable-client-title" className="mt-5 text-xl font-bold">¿Deshabilitar esta cuenta?</h2>
                            <p className="mt-2 text-sm leading-6 text-base-content/65">
                                El cliente <strong className="text-base-content">{name}</strong> ya no estará disponible para nuevas operaciones. Su persona vinculada y el historial de la cuenta se conservarán.
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
